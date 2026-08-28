import spacy
import re

nlp = spacy.load("en_core_web_sm")

# ---------------------------------------------------------------------
# Regex patterns — high precision, checked before spaCy
# ---------------------------------------------------------------------
LEGAL_SECTION_RE = re.compile(r"(Section|Clause|Article)\s+\d+[A-Za-z]?(\(\d+\))?", re.I)
MONEY_RE = re.compile(r"(₹|Rs\.?|INR)\s?[\d,]+(\.\d+)?")
AADHAAR_RE = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
PHONE_RE = re.compile(r"\b[6-9]\d{9}\b")
DOB_RE = re.compile(r"\bDOB\s*[:\-]?\s*\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b", re.I)
AGE_RE = re.compile(r"\bAge\s+(?:about\s+)?\d+\s+years?\b", re.I)
PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
VOTER_ID_RE = re.compile(r"\b[A-Z]{3}[0-9]{7}\b")
HONORIFIC_NAME_RE = re.compile(
    r"\b(SHRI|SMT|SRI|MR|MRS|MS)\.?\s+((?:[A-Z][A-Za-z]*\s*){1,4})"
)

# Words that consistently introduce an address in these documents — used
# to correct ORG-labeled locality/place names (e.g. "Singal Toli Bajar")
# to GPE, since spaCy's small model has no idea these are places when
# they're not major cities/states.
ADDRESS_CONTEXT_RE = re.compile(r"\b(r/o\.?|resident of|res\.?|village|mauza|tehsil|taluka)\b", re.I)
ADDRESS_CONTEXT_WINDOW = 20

# Words that terminate a name match even though they're capitalized and
# can immediately trail a name in these documents.
NAME_STOP_WORDS = {
    "age", "occ", "occ.", "r/o", "r/o.", "mobile", "aadhar", "aadhaar",
    "date", "reg", "district", "dist", "dist.", "resident", "aged",
    "years", "yrs", "s/o", "d/o", "w/o", "c/o", "business", "student",
}

# Known Indian states/major cities that spaCy's small model routinely
# mislabels as ORG or PERSON when they appear in all-caps OCR text.
KNOWN_PLACES = {
    "nagpur", "mumbai", "pune", "delhi", "gondiya", "amravati", "hingana",
    "wagdara", "maharashtra", "wanadongri", "wardha", "chandrapur",
    "akola", "nashik", "aurangabad", "kolhapur",
}

# Entity text that should always be dropped as noise, regardless of the
# label spaCy assigned it — exact matches only.
JUNK_ENTITY_TEXTS = {
    "occ", "occ.", "reg", "r/o", "r/o.", "aadhar", "aadhaar", "s/o",
    "d/o", "w/o", "c/o", "one part", "other part", "witness",
}

# Generic legal-document / boilerplate words that spaCy frequently
# mistags as PERSON/GPE/ORG because they're capitalized mid-sentence in
# formal legal drafting style (e.g. "the LICENSOR", "the Bank"). These
# are role terms and common nouns, never actual names or places — exact
# matches only, so a real place/person name that happens to be a
# substring is never affected.
GENERIC_NOISE_WORDS = {
    "tenant", "landlord", "party", "parties", "subject", "fixtures",
    "facilities", "facilities provided", "authority", "taxes", "bank",
    "net banking", "residential", "guest house", "combustible goods",
    "leave and license", "license",
    "electric fuses", "bulbs", "bathroom basic essentials",
}

# Substring markers — catches these words even when spaCy grabs them as
# part of a longer noisy span (e.g. "the Licensor Account", "AADHAR NUM").
SUBSTRING_JUNK_MARKERS = {"aadhar", "aadhaar", "mobile", "licensor", "licensee"}

MIN_ENTITY_LENGTH = 3


def normalize_for_ner(text: str) -> str:
    """Fix common OCR artifacts before running NER — run-together words
    like 'Nagpur.AADHAR', missing spaces, irregular whitespace."""
    text = re.sub(r'\.(?=[A-Z])', '. ', text)                    # period-glued-to-capital
    text = re.sub(r'(?<=[a-z])(?=[A-Z]{2,})', ' ', text)          # lowerCAPS run split
    text = re.sub(r'(?<=[A-Za-z])(?=\d)', ' ', text)              # letterNumber split
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _clean_honorific_match(raw_name: str) -> str:
    """Trim a matched honorific+name span at the first word that is not
    part of a real name (e.g. stop at 'Age', 'Occ', 'R/o')."""
    words = raw_name.replace(",", " ").split()
    kept = []
    for w in words:
        if w.lower().strip(".,") in NAME_STOP_WORDS:
            break
        if not re.match(r"^[A-Z][A-Za-z]*$", w):  # not a clean title-case word
            break
        kept.append(w)
    return " ".join(kept)


def _spans_overlap(a_start, a_end, b_start, b_end) -> bool:
    return a_start < b_end and b_start < a_end


def _contains_digit(text: str) -> bool:
    return any(ch.isdigit() for ch in text)


def _looks_like_address_context(clean_text: str, start_char: int) -> bool:
    """Checks the text immediately before an entity for address-introducing
    words like 'R/o' — used to correct ORG-labeled locality names (e.g.
    'Singal Toli Bajar') to GPE, since Indian legal documents consistently
    introduce addresses this way, regardless of whether the specific
    locality is a major city we could hardcode."""
    window_start = max(0, start_char - ADDRESS_CONTEXT_WINDOW)
    window = clean_text[window_start:start_char]
    return bool(ADDRESS_CONTEXT_RE.search(window))


def _is_junk(text: str, label: str) -> bool:
    """Checks whether an entity should be dropped entirely. IMPORTANT: the
    caller must pass the ALREADY-CORRECTED label (i.e. call _fix_label()
    first), not spaCy's raw label — otherwise a known place mistagged as
    ORG/PERSON gets dropped here before _fix_label ever has a chance to
    relabel it to GPE, silently losing entities instead of correcting
    them."""
    lowered = text.strip().lower()
    if len(lowered) < MIN_ENTITY_LENGTH:
        return True
    if lowered in JUNK_ENTITY_TEXTS:
        return True
    if lowered in GENERIC_NOISE_WORDS:
        return True
    if any(marker in lowered for marker in SUBSTRING_JUNK_MARKERS):
        return True
    # Real person names and place names essentially never contain digits —
    # anything numeric here is almost always an address/plot/ID fragment
    # (e.g. "Khasara No 18/4-A", "Apartment No-302") that spaCy mistagged.
    # Genuine numeric identifiers are already caught separately by the
    # regex patterns above, so dropping these loses nothing.
    if label in {"PERSON", "GPE", "ORG"} and _contains_digit(text):
        return True
    if label in {"ORG", "PERSON"} and lowered in KNOWN_PLACES:
        return True  # only reachable if _fix_label() wasn't called first
    return False


def _fix_label(text: str, label: str) -> str:
    """Correct known systematic mislabels (e.g. Indian city names tagged
    ORG instead of GPE) rather than dropping the entity entirely."""
    if text.strip().lower() in KNOWN_PLACES:
        return "GPE"
    return label


def extract_entities(text: str) -> list[dict]:
    clean_text = normalize_for_ner(text)

    regex_entities = []
    regex_spans = []

    for m in AADHAAR_RE.finditer(clean_text):
        regex_entities.append({"text": m.group(), "label": "AADHAAR_NUMBER"})
        regex_spans.append(m.span())

    for m in AGE_RE.finditer(clean_text):
        regex_entities.append({"text": m.group(), "label": "AGE"})
        regex_spans.append(m.span())

    # PAN and Voter ID are matched against the ORIGINAL, un-normalized
    # text, not clean_text. normalize_for_ner() inserts a space at every
    # letter->digit boundary to fix OCR run-together words (e.g.
    # "Nagpur.AADHAR" -> "Nagpur. AADHAR"), but that same rule splits
    # "ABCDE1234F" into "ABCDE 1234F", which no longer matches
    # PAN_RE/VOTER_ID_RE. Matching on the raw text avoids this
    # self-inflicted corruption. No span is recorded for these matches —
    # raw-text character offsets don't line up with clean_text offsets
    # used for the spaCy overlap check below — but that's harmless in
    # practice: these two patterns are precise enough that a genuine
    # overlap with a spaCy entity is very unlikely, and final
    # deduplication is done by entity text, not by span.
    for m in PAN_RE.finditer(text):
        regex_entities.append({"text": m.group(), "label": "PAN_NUMBER"})

    for m in VOTER_ID_RE.finditer(text):
        regex_entities.append({"text": m.group(), "label": "VOTER_ID_NUMBER"})

    for m in PHONE_RE.finditer(clean_text):
        regex_entities.append({"text": m.group(), "label": "PHONE_NUMBER"})
        regex_spans.append(m.span())

    for m in DOB_RE.finditer(clean_text):
        regex_entities.append({"text": m.group(), "label": "DATE_OF_BIRTH"})
        regex_spans.append(m.span())

    for m in MONEY_RE.finditer(clean_text):
        regex_entities.append({"text": m.group(), "label": "MONETARY_VALUE"})
        regex_spans.append(m.span())

    for m in LEGAL_SECTION_RE.finditer(clean_text):
        regex_entities.append({"text": m.group(), "label": "LEGAL_SECTION"})
        regex_spans.append(m.span())

    for m in HONORIFIC_NAME_RE.finditer(clean_text):
        full_name = _clean_honorific_match(m.group(0).strip())
        if len(full_name.split()) >= 2:
            regex_entities.append({"text": full_name, "label": "PERSON"})
            regex_spans.append(m.span())

    doc = nlp(clean_text)
    spacy_entities = []
    last_address_end = -100  # tracks end position of the most recent address-run entity
    for ent in doc.ents:
        if ent.label_ not in {"PERSON", "ORG", "DATE", "MONEY", "GPE"}:
            continue
        entity_text = ent.text.strip()

        # Fix the label BEFORE junk-filtering, not after — otherwise a
        # known place mistagged as ORG/PERSON gets dropped by the
        # ORG/PERSON+KNOWN_PLACES rule in _is_junk() before it ever gets
        # a chance to be corrected to GPE here.
        fixed_label = _fix_label(entity_text, ent.label_)

        if _is_junk(entity_text, fixed_label):
            continue
        if any(_spans_overlap(ent.start_char, ent.end_char, s, e) for s, e in regex_spans):
            continue

        # Address-run detection: either this entity directly follows an
        # address marker like "R/o", OR it starts almost immediately after
        # a GPE entity we just tagged (spaCy often splits one long address
        # into several separate ORG/PERSON-mistagged fragments in a row —
        # this chains the correction through all of them, not just the first).
        starts_address = fixed_label in {"ORG", "PERSON"} and _looks_like_address_context(clean_text, ent.start_char)
        continues_address = fixed_label in {"ORG", "PERSON"} and 0 <= (ent.start_char - last_address_end) <= 3

        if starts_address or continues_address:
            fixed_label = "GPE"

        last_address_end = ent.end_char if fixed_label == "GPE" else -100

        spacy_entities.append({"text": entity_text, "label": fixed_label})

    all_entities = regex_entities + spacy_entities

    # Deduplicate case-insensitively; prefer the version with a more
    # specific/high-precision label if the same text appears twice.
    LABEL_PRIORITY = {
        "AADHAAR_NUMBER": 0, "PAN_NUMBER": 0, "VOTER_ID_NUMBER": 0, "AGE": 0,
        "PHONE_NUMBER": 0, "DATE_OF_BIRTH": 0, "MONETARY_VALUE": 0,
        "LEGAL_SECTION": 0, "PERSON": 1, "GPE": 2, "ORG": 3, "DATE": 3, "MONEY": 3,
    }
    best_by_key = {}
    for e in all_entities:
        key = e["text"].lower()
        priority = LABEL_PRIORITY.get(e["label"], 9)
        if key not in best_by_key or priority < LABEL_PRIORITY.get(best_by_key[key]["label"], 9):
            best_by_key[key] = e

    return list(best_by_key.values())


def mask_sensitive(text: str) -> str:
    """Redact Aadhaar numbers, PAN, Voter ID, phone numbers, and DOB — use
    this for anything shown on a dashboard or logged."""
    text = AADHAAR_RE.sub("[AADHAAR REDACTED]", text)
    text = PAN_RE.sub("[PAN REDACTED]", text)
    text = VOTER_ID_RE.sub("[VOTER ID REDACTED]", text)
    text = PHONE_RE.sub("[PHONE REDACTED]", text)
    text = DOB_RE.sub("[DOB REDACTED]", text)
    return text


if __name__ == "__main__":
    sample = (
        "AGREEMENT OF LEAVE AND LICENSE THIS AGREEMENT OF LEAVE AND LICENSE is made and executed at NAGPUR on 24 th Day of September 2025, Between SHRI SAMIR RAMESH UPADHYE, Age about 02 years, Occ. Business, R/o. Kothi Road, Mahal, Nagpur.AADHAR NUMBER 367300776779 MOBILE (9822226924) Hereinafter called the LICENSOR, which expression shall unless repugnant to the context or meaning there of always mean and include the said LICENSOR as well as, his respective heirs, legal representative. executors, administrators successors and assigns of the ONE PART, made at Nagpur on this 24 day of September 2025. AND SHRI HIMANSHU OMPRAKASH PARASHAR, Age about 24 years,Occ:Student, R/o Singal Toli Bajar Chowlk Ramnagar Gondiya Maharashtra-SHRI SUNIT SUBHASH KHATRI Age 21 Years Occ:Student   R/O c/oSubhash khatri Q"
    )
    print("=== Entities ===")
    for ent in extract_entities(sample):
        print(ent)

    print("\n=== Masked version ===")
    print(mask_sensitive(sample))