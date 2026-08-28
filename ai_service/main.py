import os
import sys
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from rag.rag_pipeline import answer_query

app = FastAPI(
    title="JurifyLaw AI Service",
    description="Wraps the RAG pipeline (classification, retrieval, "
                 "compression, grounded/general answering) as an HTTP API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The user's free-text question.")


class QueryResponse(BaseModel):
    answer: str
    sources: list[str]
    mode: str
    elapsed_seconds: float


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/answer", response_model=QueryResponse)
def answer(req: QueryRequest):
    start = time.monotonic()
    try:
        result = answer_query(req.query)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI pipeline failed: {e}",
        )

    elapsed = time.monotonic() - start
    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"],
        mode=result["mode"],
        elapsed_seconds=round(elapsed, 2),
    )