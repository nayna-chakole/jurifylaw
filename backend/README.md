# JurifyLaw — Backend API & Neural Processing Engine

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python 3.11+](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Store-orange?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**High-Performance Asynchronous Legal Document Processing, Semantic Risk Scoring, and RAG Precedent Pipeline.**

Author: **Amul Thantharate** (*Junior Cloud Engineer*)

</div>

---

## ⚡ Overview

JurifyLaw Backend is built with **FastAPI**, **SQLAlchemy 2.0**, and **FAISS** (via the AI service). It provides endpoints for:
- User registration, authentication, and session auditing (JWT + bcrypt).
- Secure multi-format document ingestion (PDF, DOCX).
- Automated clause segmentation, risk categorization, and entity extraction.
- Conversational RAG over vector-embedded contract chunks.

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/          # analysis, auth, chat, documents, health
│   │   └── deps.py          # Database & auth dependency injections
│   ├── core/                # Config, database engine, JWT security
│   ├── models/              # SQLAlchemy database ORM entities
│   ├── repositories/        # Database query abstractions
│   ├── schemas/             # Pydantic validation schemas
│   ├── services/            # AI analysis, document parsing, RAG (via AI service)
│   └── utils/               # File validator & helpers
├── migrations/              # Alembic database migrations
├── tests/                   # Pytest test suite (6/6 passing)
├── Dockerfile               # Container definition
├── alembic.ini              # Migration configuration
├── pytest.ini               # Test suite configuration
├── requirements.txt         # Python dependencies
└── .env.example             # Environment template
```

---

## 🚀 Quick Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

* **Swagger API Docs**: `http://localhost:8000/docs`
* **Redoc**: `http://localhost:8000/redoc`

---

## 🧪 Testing

```bash
pytest -v
```

---

## 👤 Author

**Amul Thantharate** — *Junior Cloud Engineer*  
GitHub: [@AmulThantharate](https://github.com/AmulThantharate)
