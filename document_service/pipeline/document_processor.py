import os
import io
import re
import pymupdf as fitz
import docx
import pytesseract
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
TESSERACT_CMD = os.environ.get("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
MIN_ALPHA_RATIO = 0.5
MIN_LINE_LENGTH = 3


def looks_like_real_text(line: str) -> bool:
    words = line.split()
    if len(words) < 2:
        return False
    vowel_words = sum(1 for w in words if re.search(r'[aeiouAEIOU]', w))
    return (vowel_words / len(words)) >= 0.6


def clean_ocr_text(raw_text: str) -> str:
    cleaned_lines = []
    for line in raw_text.split("\n"):
        stripped = line.strip()
        if len(stripped) < MIN_LINE_LENGTH:
            continue
        alpha_count = sum(c.isalpha() for c in stripped)
        alpha_ratio = alpha_count / len(stripped)
        if alpha_ratio >= MIN_ALPHA_RATIO and looks_like_real_text(stripped):
            cleaned_lines.append(stripped)
    return "\n".join(cleaned_lines)


def trim_to_agreement_body(text: str) -> str:
    start_markers = ["AGREEMENT OF", "THIS AGREEMENT", "MEMORANDUM OF"]
    for marker in start_markers:
        idx = text.upper().find(marker)
        if idx != -1:
            return text[idx:]
    return text


def truncate_at_signatures(text: str) -> str:
    markers = ["IN WITNESS WHEREOF", "SCHEDULE REFERRED TO ABOVE"]
    cutoff_index = len(text)
    for marker in markers:
        idx = text.upper().find(marker)
        if idx != -1:
            buffer_end = text.find("\n\n", idx + 1500)
            candidate_cutoff = buffer_end if buffer_end != -1 else idx + 1500
            cutoff_index = min(cutoff_index, candidate_cutoff)
    return text[:cutoff_index] if cutoff_index < len(text) else text


def extract_text_from_pdf(path: str) -> tuple[str, bool]:
    doc = fitz.open(path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()

    was_ocr = False
    if len(text.strip()) < 50:
        print("Little/no embedded text found — falling back to OCR...")
        text = ocr_pdf(path)
        was_ocr = True

    return text, was_ocr


def ocr_pdf(path: str) -> str:
    doc = fitz.open(path)
    raw_text = ""
    for page_num, page in enumerate(doc, start=1):
        pix = page.get_pixmap(dpi=300)
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))
        page_text = pytesseract.image_to_string(img)
        raw_text += page_text + "\n"
        print(f"  OCR'd page {page_num}/{len(doc)}")
    doc.close()
    return raw_text


def extract_text_from_docx(path: str) -> str:
    d = docx.Document(path)
    return "\n".join(p.text for p in d.paragraphs if p.text.strip())


def extract_text_from_image(path: str) -> str:
    img = Image.open(path)
    return pytesseract.image_to_string(img)


def extract_text(path: str, clean: bool = True, trim_attachments: bool = True) -> str:
    ext = os.path.splitext(path)[1].lower()
    was_ocr = False

    if ext == ".pdf":
        text, was_ocr = extract_text_from_pdf(path)
    elif ext == ".docx":
        text = extract_text_from_docx(path)
    elif ext in {".jpg", ".jpeg", ".png"}:
        text = extract_text_from_image(path)
        was_ocr = True
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    if clean and was_ocr:
        text = clean_ocr_text(text)

    if trim_attachments:
        text = trim_to_agreement_body(text)
        text = truncate_at_signatures(text)

    return text


if __name__ == "__main__":
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    test_path = os.path.join(SCRIPT_DIR, "Sample_Employment_Agreement.docx")

    if not os.path.exists(test_path):
        print(f"No test file found at {test_path}")
        print("Drop a PDF/DOCX/image into ai/pipeline/ and update test_path above.")
    else:
        print(f"Processing: {test_path}\n")
        text = extract_text(test_path)

        print("--- Extracted text (first 1000 chars) ---")
        print(text[:1000])
        print(f"\n\nTotal extracted length: {len(text)} characters")
        print(f"Total lines after cleaning: {len(text.splitlines())}")