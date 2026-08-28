"""
ai/rag/rag_pipeline.py

Glues the hybrid retriever (retriever.py) and the LLM client (llm_client.py)
together into a single question-answering function, with a routing step
in front so the assistant behaves like a general chatbot for non-legal
questions but stays strictly grounded (cites sources, declines rather than
guesses) for legal questions.

Pipeline:
    query -> classify (LEGAL_IN_SCOPE vs GENERAL)
        LEGAL_IN_SCOPE -> query transformation -> hybrid retrieval + rerank
                           -> batched compression -> grounded answer
                           generation (unchanged from before)
        GENERAL        -> direct LLM answer from general knowledge, no
                           retrieval, with a disclaimer that this answer
                           is NOT sourced from the verified legal knowledge
                           base

Note: compression happens in ONE batched LLM call across all retrieved
chunks (not one call per chunk) to stay well within free-tier rate limits
— a legal query is 4 calls total now (classify, rewrite, batch compress,
final answer); a general query is just 2 (classify, answer).
"""

import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(SCRIPT_DIR, ".."))

from rag.retriever import retrieve
from llm.llm_client import generate
from llm.prompts import (
    CHATBOT_PROMPT,
    QUERY_TRANSFORMATION_PROMPT,
    BATCH_COMPRESSION_PROMPT,
)

# ---------------------------------------------------------------------
# New prompts for the routing step. Kept here (not in prompts.py) since
# this session doesn't have the real current prompts.py source to safely
# edit — move these into prompts.py later if you want everything
# centralized in one file.
# ---------------------------------------------------------------------

QUERY_CLASSIFICATION_PROMPT = """You are a query router for an Indian legal assistant.

Decide whether the user's question needs Indian legal knowledge (law, legal
rights, contracts, tenancy, consumer protection, employment/labour law,
insurance, banking regulation, data protection, or a similar legal topic a
citizen might need legal guidance on) - answer LEGAL. If it's a general
knowledge question, definition, acronym, or anything not requiring legal
sourcing - answer GENERAL, even if it sounds official or work-related.

Examples:
Question: What is the capital of France?
Answer: GENERAL

Question: How much notice must my employer give before firing me?
Answer: LEGAL

Question: What does API mean?
Answer: GENERAL

Question: Can my landlord evict me without going to court?
Answer: LEGAL

Question: What is the punishment for murder in India?
Answer: LEGAL

Question: What is CTC?
Answer: GENERAL

Now classify this one. Reply with ONLY the single word GENERAL or the
single word LEGAL. No period, no explanation, no repeating the question -
just that one word.

Question: {user_question}
Answer:"""

GENERAL_KNOWLEDGE_PROMPT = """Answer the following question directly and helpfully,
using your own general knowledge. Do not mention legal sources or Indian law
unless the question specifically asks about them. Keep the answer clear and
concise. No markdown formatting — plain sentences only.

Question: {user_question}

Answer:"""

GENERAL_ANSWER_DISCLAIMER = (
    "\n\n(Note: this answer is from general knowledge, not our verified Indian "
    "legal knowledge base. For legal matters, please consult a lawyer.)"
)


def classify_query(user_query: str) -> str:
    """Returns 'LEGAL' or 'GENERAL'. Defaults to 'LEGAL' on any failure or
    unparseable response, since staying grounded is the safer failure mode
    for this project than silently answering a legal question ungrounded.

    max_tokens=60 (raised from 20): openai/gpt-oss-120b on Groq is a
    reasoning model whose hidden reasoning tokens draw from the same
    budget as the visible answer. At max_tokens=20 the model consistently
    burned its entire budget on reasoning and emitted an empty content
    string every time, silently defaulting every query to LEGAL regardless
    of actual content. Combined with reasoning_effort="low" now set in
    llm_client.py's _raw_generate_groq, 60 gives enough headroom for the
    one-word answer to actually surface."""
    prompt = QUERY_CLASSIFICATION_PROMPT.format(user_question=user_query)
    try:
        raw = generate(prompt, max_tokens=60).strip().upper()
    except Exception as e:
        print(f"  Warning: query classification failed ({e}). Defaulting to LEGAL.")
        return "LEGAL"

    print(f"  Raw classification output: {raw!r}")
    if "GENERAL" in raw:
        return "GENERAL"
    return "LEGAL"


def transform_query(user_query: str) -> str:
    prompt = QUERY_TRANSFORMATION_PROMPT.format(user_question=user_query)
    try:
        rewritten = generate(prompt, max_tokens=100).strip()
        return rewritten if rewritten else user_query
    except Exception as e:
        print(f"  Warning: query transformation failed ({e}). Using original query.")
        return user_query


def compress_chunks(chunks: list[dict], user_query: str) -> list:
    numbered_chunks = "\n\n".join(
        f"Chunk {i+1}: {c['text']}" for i, c in enumerate(chunks)
    )
    prompt = BATCH_COMPRESSION_PROMPT.format(
        numbered_chunks=numbered_chunks, user_question=user_query
    )
    try:
        raw = generate(prompt, max_tokens=800)
    except Exception as e:
        print(f"  Warning: batch compression failed ({e}). Using original chunks.")
        return [c["text"] for c in chunks]

    parts = raw.split("---")
    results = []
    for i in range(len(chunks)):
        if i < len(parts):
            text = re.sub(r"^\s*Chunk\s*\d+\s*:\s*", "", parts[i].strip(), flags=re.IGNORECASE).strip()
            if text.upper().startswith("NOT RELEVANT"):
                results.append(None)
            elif text:
                results.append(text)
            else:
                results.append(chunks[i]["text"])
        else:
            results.append(chunks[i]["text"])
    return results


def answer_general(user_query: str) -> dict:
    """Handles non-legal questions directly from the LLM's own knowledge,
    no retrieval, with a disclaimer appended so it's always clear this
    answer isn't backed by the verified legal knowledge base."""
    print("Answering from general knowledge (no retrieval)...")
    prompt = GENERAL_KNOWLEDGE_PROMPT.format(user_question=user_query)
    try:
        answer = generate(prompt)
    except Exception as e:
        print(f"  Warning: general-knowledge answer failed ({e}).")
        answer = "Sorry, I wasn't able to generate an answer for that right now."
    return {
        "answer": answer + GENERAL_ANSWER_DISCLAIMER,
        "sources": [],
        "mode": "general",
    }


def _looks_like_a_decline(answer: str) -> bool:
    """Detects an 'I don't have grounds to answer this' response from the
    RAG path. Uses the same two-marker approach (negation word co-occurring
    with a content word) validated in rag_wildset_test.py's
    check_groundedness() fix — a fixed phrase list was too brittle and
    missed real paraphrases like 'does not contain'/'cannot answer'.

    Refined to check per-sentence rather than whole-answer: a genuinely
    grounded, cited answer can still contain one caveat sentence like
    "the Code does not specify X for this edge case" without the whole
    answer being a decline. Only flag it when EVERY sentence matches —
    i.e. the entire response is a refusal, not a caveat embedded in an
    otherwise substantive answer. This fixed a real false positive: a
    correctly sourced, cited answer about employer notice periods under
    the Industrial Relations Code 2020 was being discarded solely because
    one clause said the Code "does not specify" the rule for a narrow
    edge case, even though the rest of the answer was solid."""
    negation_markers = [
        "does not", "doesn't", "do not", "did not", "cannot", "can't",
        "unable to", "no information", "insufficient", "none of the",
    ]
    content_markers = [
        "contain", "include", "specify", "cover", "address", "mention",
        "provide", "answer", "determine", "find", "information",
        "provision", "guidance", "detail", "definition",
    ]

    sentences = re.split(r"(?<=[.!?])\s+", answer.strip())
    sentences = [s for s in sentences if s.strip()]
    if not sentences:
        return False

    def _sentence_matches(s: str) -> bool:
        lowered = s.lower()
        has_negation = any(n in lowered for n in negation_markers)
        has_content = any(c in lowered for c in content_markers)
        return has_negation and has_content

    matching = [s for s in sentences if _sentence_matches(s)]
    return len(matching) == len(sentences)


def answer_legal(user_query: str) -> dict:
    """The grounded RAG flow. If nothing in the knowledge base survives
    compression as relevant, that's treated as a direct signal to fall
    back to a general-knowledge answer (clearly labeled) rather than
    stuffing irrelevant chunks into the prompt and forcing a doomed
    grounded-generation attempt that just declines anyway. This is more
    reliable than detecting decline phrasing after the fact, since it
    doesn't depend on how the model happens to word its refusal."""
    print("Transforming query...")
    search_query = transform_query(user_query)

    print(f"Retrieving with: {search_query!r}")
    top_chunks = retrieve(search_query, top_k_final=8)

    print("Compressing retrieved chunks (batched)...")
    compressed_texts = compress_chunks(top_chunks, user_query)

    context_parts = []
    sources = []
    for c, text in zip(top_chunks, compressed_texts):
        if text is None:
            continue
        context_parts.append(f"[{c['source']} — {c['topic']}] {text}")
        sources.append(c["source"])

    if not context_parts:
        print("  Nothing in the knowledge base was relevant — "
              "falling back to general knowledge...")
        general_result = answer_general(user_query)
        return {
            "answer": general_result["answer"],
            "sources": [],
            "mode": "general_fallback",
        }

    context = "\n\n".join(context_parts)
    prompt = CHATBOT_PROMPT.format(retrieved_chunks=context, user_question=user_query)

    print("Generating final answer...")
    answer = generate(prompt)

    if _looks_like_a_decline(answer):
        print("  RAG answer still declined despite having some context — "
              "falling back to general knowledge...")
        print(f"  DEBUG - full answer that triggered decline detection: {answer!r}")
        general_result = answer_general(user_query)
        return {
            "answer": general_result["answer"],
            "sources": [],
            "mode": "general_fallback",
        }

    return {"answer": answer, "sources": sources, "mode": "rag"}


def answer_query(user_query: str):
    print("Classifying query...")
    query_type = classify_query(user_query)
    print(f"  -> classified as: {query_type}")

    if query_type == "GENERAL":
        return answer_general(user_query)
    return answer_legal(user_query)


if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "can my employer fire me without any notice period"
    result = answer_query(query)
    print("\n=== ANSWER ===")
    print(result["answer"])
    print("\nSources:", result["sources"])
    print("Mode:", result["mode"])