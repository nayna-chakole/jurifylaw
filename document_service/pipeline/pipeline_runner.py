import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from document_processor import extract_text
from ner_extractor import extract_entities, mask_sensitive
from clause_classifier import classify_clause

PARENT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, PARENT_DIR)

from llm.llm_client import generate
from llm.prompts import (
    DOCUMENT_SUMMARY_PROMPT,
    OBLIGATIONS_EXTRACTION_PROMPT,
    BATCH_CLAUSE_REASONING_PROMPT,
)


def split_into_clauses(text: str) -> list[str]:
    """Splits on numbered clauses (1) 2) 3) ...), falling back to
    sentence-level splitting if the document has no numbered structure."""
    numbered = re.split(r"\n?\s*\d+\)\s*", text)
    numbered = [c.strip() for c in numbered if len(c.strip()) > 20]
    if len(numbered) > 2:
        return numbered
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def _format_clauses_for_summary(classified_clauses: list[dict]) -> str:
    lines = []
    for c in classified_clauses:
        snippet = c["text"][:200]
        lines.append(f"[{c['risk_label']}] {snippet}")
    return "\n".join(lines)


def _format_entities_for_summary(entities: list[dict]) -> str:
    lines = [f"{e['label']}: {e['text']}" for e in entities]
    return "\n".join(lines)


def generate_document_summary(classified_clauses: list[dict], entities: list[dict]) -> str:
    prompt = DOCUMENT_SUMMARY_PROMPT.format(
        classified_clauses=_format_clauses_for_summary(classified_clauses),
        entities=_format_entities_for_summary(entities),
    )
    try:
        return generate(prompt, max_tokens=400)
    except Exception as e:
        print(f"  Warning: summary generation failed ({e}). Continuing without it.")
        return "Summary unavailable (LLM call failed)."


def generate_obligations(classified_clauses: list[dict]) -> str:
    prompt = OBLIGATIONS_EXTRACTION_PROMPT.format(
        classified_clauses=_format_clauses_for_summary(classified_clauses),
    )
    try:
        return generate(prompt, max_tokens=300)
    except Exception as e:
        print(f"  Warning: obligations extraction failed ({e}). Continuing without it.")
        return "Obligations unavailable (LLM call failed)."


def generate_batch_clause_reasoning(flagged_clauses: list[dict]) -> list[tuple[str, str]]:
    """Generates explanation + fair-suggestion for ALL flagged clauses in a
    SINGLE LLM call (not one call per clause). Returns a list of
    (explanation, suggestion) tuples, same order and length as
    flagged_clauses. Falls back to placeholder text per clause if the call
    or parsing fails — never raises, never drops a clause."""
    if not flagged_clauses:
        return []

    numbered = "\n\n".join(
        f"Clause {i+1} [{c['risk_label']}]: {c['text'][:400]}"
        for i, c in enumerate(flagged_clauses)
    )
    prompt = BATCH_CLAUSE_REASONING_PROMPT.format(numbered_clauses=numbered)
    max_tokens = min(2000, 250 + 300 * len(flagged_clauses))

    try:
        raw = generate(prompt, max_tokens=max_tokens)
    except Exception as e:
        print(f"  Warning: batch clause reasoning failed ({e}). Using fallback text.")
        return [("Explanation unavailable (LLM call failed).",
                  "Suggestion unavailable (LLM call failed).") for _ in flagged_clauses]

    parts = raw.split("---")
    results = []
    for i in range(len(flagged_clauses)):
        if i < len(parts):
            block = parts[i]
            exp_match = re.search(r"Explanation:\s*(.+?)(?=Suggestion:|$)", block, re.DOTALL | re.IGNORECASE)
            sug_match = re.search(r"Suggestion:\s*(.+)", block, re.DOTALL | re.IGNORECASE)
            explanation = exp_match.group(1).strip() if exp_match else "Explanation unavailable (parse failed)."
            suggestion = sug_match.group(1).strip() if sug_match else "Suggestion unavailable (parse failed)."
            results.append((explanation, suggestion))
        else:
            results.append(("Explanation unavailable (LLM call failed).",
                             "Suggestion unavailable (LLM call failed)."))
    return results


def analyze_document(file_path: str) -> dict:
    print(f"Extracting text from {file_path}...")
    raw_text = extract_text(file_path)

    print("Splitting into clauses...")
    clauses = split_into_clauses(raw_text)
    print(f"Found {len(clauses)} clauses")

    print("Classifying each clause...")
    classified_clauses = []
    for clause in clauses:
        result = classify_clause(clause)
        classified_clauses.append({
            "text": clause,
            "risk_label": result["label"],
            "confidence": result["confidence"],
        })

    print("Generating explanations + fair suggestions (batched, 1 call)...")
    flagged = [c for c in classified_clauses if c["risk_label"] in ("Risky", "Caution")]
    reasoning_results = generate_batch_clause_reasoning(flagged)
    ri = 0
    for c in classified_clauses:
        if c["risk_label"] in ("Risky", "Caution"):
            c["explanation"], c["fair_suggestion"] = reasoning_results[ri]
            ri += 1
        else:
            c["explanation"] = None
            c["fair_suggestion"] = None

    print("Extracting entities...")
    entities = extract_entities(raw_text)

    risky_count = sum(1 for c in classified_clauses if c["risk_label"] == "Risky")
    caution_count = sum(1 for c in classified_clauses if c["risk_label"] == "Caution")
    safe_count = sum(1 for c in classified_clauses if c["risk_label"] == "Safe")

    print("Generating plain-language summary...")
    summary = generate_document_summary(classified_clauses, entities)

    print("Extracting obligations...")
    obligations = generate_obligations(classified_clauses)

    return {
        "total_clauses": len(classified_clauses),
        "risk_summary": {"Safe": safe_count, "Caution": caution_count, "Risky": risky_count},
        "clauses": classified_clauses,
        "entities": entities,
        "masked_preview": mask_sensitive(raw_text[:500]),
        "summary": summary,
        "obligations": obligations,
    }


if __name__ == "__main__":
    test_path = os.path.join(SCRIPT_DIR, "Sample_Employment_Agreement.docx")
    result = analyze_document(test_path)

    print("\n=== ANALYSIS SUMMARY ===")
    print(f"Total clauses: {result['total_clauses']}")
    print(f"Risk breakdown: {result['risk_summary']}")

    print("\n=== PLAIN-LANGUAGE SUMMARY ===")
    print(result["summary"])

    print("\n=== OBLIGATIONS OF THE SIGNER ===")
    print(result["obligations"])

    print("\n=== ALL CLAUSES WITH RISK LABELS ===")
    for c in result["clauses"]:
        print(f"  [{c['risk_label']:8s} | {c['confidence']}] {c['text'][:120]}")
        if c.get("explanation"):
            print(f"      → {c['explanation']}")
        if c.get("fair_suggestion"):
            print(f"      → Suggested fix: {c['fair_suggestion']}")

    print("\n=== ENTITIES FOUND ===")
    for e in sorted(result["entities"], key=lambda x: x["label"]):
        print(f"  [{e['label']:15s}] {e['text']}")

    print("\n=== MASKED PREVIEW (first 500 chars) ===")
    print(result["masked_preview"])