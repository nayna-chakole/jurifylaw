import os
import faiss
import pickle
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

embed_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

index = faiss.read_index(os.path.join(SCRIPT_DIR, "legal_corpus.index"))
with open(os.path.join(SCRIPT_DIR, "legal_corpus_meta.pkl"), "rb") as f:
    metadata = pickle.load(f)

bm25 = BM25Okapi([m["text"].split() for m in metadata])


def retrieve(query: str, top_k_final: int = 5, k_dense: int = 10, k_bm25: int = 10,
             document_type_filter: str = None):
    q_vec = embed_model.encode([query], normalize_embeddings=True).astype("float32")

    # dense retrieval
    scores, idxs = index.search(q_vec, k_dense)
    dense_hits = [metadata[i] for i in idxs[0] if i != -1]

    # bm25 keyword retrieval
    bm25_scores = bm25.get_scores(query.split())
    bm25_top = sorted(range(len(bm25_scores)), key=lambda i: -bm25_scores[i])[:k_bm25]
    bm25_hits = [metadata[i] for i in bm25_top]

    # merge + dedupe by chunk_id
    combined = {m["chunk_id"]: m for m in dense_hits + bm25_hits}
    candidates = list(combined.values())

    # optional metadata filtering by document type
    if document_type_filter:
        candidates = [c for c in candidates if document_type_filter in c.get("document_types", [])]

    if not candidates:
        return []

    # re-rank with cross-encoder
    pairs = [(query, c["text"]) for c in candidates]
    rerank_scores = reranker.predict(pairs)
    ranked = sorted(zip(candidates, rerank_scores), key=lambda x: -x[1])
    return [c for c, _ in ranked[:top_k_final]]


if __name__ == "__main__":
    results = retrieve("what happens if my landlord doesn't return my security deposit")
    for r in results:
        print(f"[{r['source']}] {r['topic']}")
        print(f"  {r['text'][:150]}...")
        print()