# JurifyLaw Document Analysis Service

Upload a legal document (PDF, DOCX, JPG, or PNG) and get back clause-level
risk classification, extracted entities, a plain-language summary, and a
list of the signer's obligations.

Backend/frontend teammates do not need to install spaCy, transformers,
torch, or Tesseract themselves — just make an HTTP request to this
service.

## Running it locally

Requires two things installed separately (not pip packages):

1. **Tesseract OCR** — https://github.com/UB-Mannheim/tesseract/wiki
   (Windows installer). Used only when a PDF has no embedded text
   (scanned documents).
2. **spaCy's English model:**
```bash
   python -m spacy download en_core_web_sm
```

Then:

```bash
cd document_service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
python -m spacy download en_core_web_sm

cp .env.example .env            # then fill in real API keys
uvicorn main:app --reload --port 8002
```

Note: the clause-risk model (~418MB) downloads automatically from
Hugging Face on first run and is cached locally afterward — the very
first request will be slower while this downloads.

## API contract

### POST /analyze

Send the file as multipart form data, with the field name `file`.

**Example — PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8002/analyze" -Method Post -Form @{file=Get-Item "path\to\document.docx"}
```

**Example — curl (Mac/Linux/Git Bash):**
```bash
curl -X POST http://localhost:8002/analyze -F "file=@path/to/document.docx"
```

**Example — Python (what the main backend would actually do):**
```python
import httpx

async def analyze_document(file_bytes: bytes, filename: str) -> dict:
    async with httpx.AsyncClient(timeout=90) as client:
        files = {"file": (filename, file_bytes)}
        res = await client.post("http://localhost:8002/analyze", files=files)
        res.raise_for_status()
        return res.json()
```

**Example — JavaScript/React (if calling directly):**
```javascript
async function analyzeDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("http://localhost:8002/analyze", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}
```

**Response (200):**
```json
{