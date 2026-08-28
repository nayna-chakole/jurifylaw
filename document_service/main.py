import os
import sys
import shutil
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(SCRIPT_DIR, "pipeline"))

from pipeline_runner import analyze_document

app = FastAPI(
    title="JurifyLaw Document Analysis Service",
    description="Upload a legal document (PDF/DOCX/image) and get back "
                 "clause-level risk classification, extracted entities, "
                 "a plain-language summary, and signer obligations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    # analyze_document() needs a real file path on disk, so save the
    # upload to a temp file first, then clean it up when done.
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = analyze_document(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Document analysis failed: {e}")
    finally:
        os.remove(tmp_path)

    return result