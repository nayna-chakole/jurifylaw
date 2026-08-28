# JurifyLaw AI Service

This is the RAG/LLM chatbot engine, wrapped as a small standalone HTTP
service. Backend/frontend teammates do not need to install any ML
dependencies, download any models, or have a GPU. You only need to make
an HTTP POST request.

## Running it locally

```bash
cd ai_service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
cp .env.example .env            # then fill in real API keys
uvicorn main:app --reload --port 8001
```

## API contract

### POST /answer

Request:
```json
{ "query": "can my landlord evict me without going to court" }
```

Response:
```json
{
  "answer": "...",
  "sources": ["Model Tenancy Act 2021"],
  "mode": "rag",
  "elapsed_seconds": 3.42
}
```

`mode` values:
- `"rag"` — grounded in the legal knowledge base, sources cited
- `"general"` — non-legal question, answered from general knowledge
- `"general_fallback"` — legal question, but nothing relevant found, so answered from general knowledge instead

### GET /health

Returns `{"status": "ok"}` if the service is running.