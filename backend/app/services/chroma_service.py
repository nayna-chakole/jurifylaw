"""Vector Store & Retrieval Service for JurifyLaw Legal RAG.

Uses Azure AI Foundry embeddings to compute vector similarity across indexed contract clauses.
"""

import math
from typing import Any
from app.services.embedding_service import get_embedding_service

# In-memory clause vector storage: {document_id: [ {"clause_number": "1", "text": "...", "vector": [...]} ]}
_clause_store: dict[int, list[dict[str, Any]]] = {}


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def index_document_clauses(document_id: int, clauses: list[dict[str, Any]]) -> None:
    """Index extracted document clauses into vector store using Azure AI Foundry embeddings."""
    if not clauses:
        return

    embedding_service = get_embedding_service()
    texts_to_embed = [c.get("text", "") for c in clauses if c.get("text")]
    if not texts_to_embed:
        return

    try:
        vectors = embedding_service.get_embeddings(texts_to_embed)
    except Exception as e:
        # Fallback if external API error occurs
        vectors = [[] for _ in texts_to_embed]

    stored_clauses = []
    vector_idx = 0
    for idx, c in enumerate(clauses):
        clause_text = c.get("text", "")
        if not clause_text:
            continue
        vec = vectors[vector_idx] if vector_idx < len(vectors) else []
        vector_idx += 1
        stored_clauses.append({
            "clause_number": str(c.get("clause_number", idx + 1)),
            "text": clause_text,
            "vector": vec,
        })

    _clause_store[document_id] = stored_clauses


def query_document_chunks(
    document_id: int | None,
    query_text: str,
    n_results: int = 4,
) -> list[dict[str, str]]:
    """Retrieve top-k relevant clauses for a given document using cosine similarity over embeddings."""
    if not query_text:
        return []

    # Get target clauses
    candidate_clauses: list[dict[str, Any]] = []
    if document_id is not None and document_id in _clause_store:
        candidate_clauses = _clause_store[document_id]
    else:
        for doc_clauses in _clause_store.values():
            candidate_clauses.extend(doc_clauses)

    if not candidate_clauses:
        return [
            {
                "title": f"Document {document_id or 'General'}",
                "snippet": query_text,
            }
        ]

    # Generate query embedding vector using Azure AI Foundry
    embedding_service = get_embedding_service()
    try:
        query_vector = embedding_service.get_embedding(query_text)
    except Exception:
        query_vector = []

    # Score clauses
    scored: list[tuple[float, dict[str, Any]]] = []
    for c in candidate_clauses:
        clause_vec = c.get("vector", [])
        if query_vector and clause_vec and len(query_vector) == len(clause_vec):
            score = _cosine_similarity(query_vector, clause_vec)
        else:
            # Fallback simple keyword match
            score = sum(1.0 for word in query_text.lower().split() if word in c.get("text", "").lower())
        scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_clauses = scored[:n_results]

    return [
        {
            "title": f"Clause {item['clause_number']}",
            "snippet": item["text"],
        }
        for _, item in top_clauses
    ]
