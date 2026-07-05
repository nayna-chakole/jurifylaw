# ⚖️ LegalEase – AI-Powered Legal Document Analyzer & Citizen Rights Advisory Platform

## 📌 Project Description

LegalEase is an AI-powered web application designed to help ordinary Indian citizens understand complex legal documents without requiring legal expertise. Many people struggle to interpret legal jargon in documents such as rental agreements, employment contracts, service agreements, and terms & conditions, making them vulnerable to unfair clauses and legal exploitation.

Our platform allows users to upload legal documents in PDF or DOCX format or paste document text directly. The system extracts the document content, analyzes important legal clauses using Natural Language Processing (NLP), detects potentially risky or unfair clauses, generates a plain-language summary, and provides an overall document risk assessment.

The platform also includes an AI-powered legal chatbot based on Retrieval-Augmented Generation (RAG), enabling users to ask legal questions in simple English (and future support for regional languages). Instead of giving unsupported AI responses, the chatbot retrieves relevant legal information from trusted Indian legal datasets before generating answers.

An additional feature of the project is a browser extension that analyzes website Terms & Conditions and Privacy Policies in real time. Rather than expecting users to read lengthy legal agreements, the extension instantly summarizes them and highlights potentially concerning clauses such as hidden subscriptions, excessive data collection, automatic renewals, and unfair liability terms.

The goal of LegalEase is to make legal information understandable, accessible, and transparent for every citizen.

---

# 🎯 Problem Statement

Legal documents are often written using complex legal terminology that is difficult for ordinary citizens to understand. Hiring legal professionals for basic document review is expensive and not always accessible.

Users frequently accept online Terms & Conditions without reading them, unknowingly agreeing to unfair clauses. Existing AI legal tools are primarily designed for lawyers and enterprises rather than the general public.

LegalEase addresses this problem by simplifying legal language, identifying risks, and providing citizen-friendly legal guidance.

---

# 🎯 Objectives

- Analyze uploaded legal documents.
- Detect important legal clauses.
- Identify risky or unfair clauses.
- Generate plain-language summaries.
- Extract important dates, monetary values, and obligations.
- Calculate an overall document risk score.
- Answer legal questions using Indian legal knowledge.
- Summarize website Terms & Conditions using a browser extension.

---

# 🚀 Key Features

- 📄 Upload PDF or DOCX legal documents
- 📝 AI-generated document summaries
- ⚠️ Risky clause detection
- 🟢🟡🔴 Document risk scoring
- 📅 Important date extraction
- 💰 Money and payment extraction
- 🤖 AI-powered legal chatbot
- 📚 Retrieval-Augmented Generation (RAG)
- 🌐 Browser extension for Terms & Conditions analysis
- 📂 User document history
- 📥 Downloadable analysis reports

---

# 🏗️ Project Workflow

```
User Uploads Document
          │
          ▼
Document Parsing (PDF / DOCX)
          │
          ▼
Text Extraction
          │
          ▼
Text Cleaning
          │
          ▼
Clause Detection
          │
          ▼
Named Entity Recognition
          │
          ▼
Risk Detection
          │
          ▼
Summary Generation
          │
          ▼
Document Risk Score
          │
          ▼
Generate Analysis Report
          │
          ▼
Store in Database
          │
          ▼
AI Legal Chatbot (RAG)
```

---

# 🧠 AI Pipeline

1. Upload Document
2. Extract Text
3. Clean Text
4. Split into Clauses
5. Detect Clause Type
6. Extract Legal Entities
7. Detect Risky Clauses
8. Generate Plain Language Summary
9. Calculate Document Health Score
10. Store Analysis
11. Answer User Questions Using RAG

---

# 🌐 Browser Extension Workflow

```
Open Website
      │
      ▼
Detect Terms & Conditions Page
      │
      ▼
Extract Page Text
      │
      ▼
Send to Backend API
      │
      ▼
AI Analysis
      │
      ▼
Risk Detection
      │
      ▼
Generate Summary
      │
      ▼
Display Popup
```

---

# 🛠️ Technology Stack

### Frontend
- React.js
- Tailwind CSS

### Backend
- FastAPI
- Python

### Artificial Intelligence
- Hugging Face Transformers
- spaCy
- LangChain

### Retrieval
- FAISS Vector Database

### Database
- PostgreSQL

### Authentication
- JWT

### Document Processing
- PyMuPDF
- python-docx

### Cloud
- AWS S3

### Deployment
- Docker

---

# 📚 Datasets

- Legal Indian Contract Clauses Dataset
- IndicLegalQA
- Indian Supreme Court Judgments
- Indian Legal Corpus (ILC)

---

# 📂 Project Structure

```
LegalEase/

│── frontend/
│── backend/
│── ai/
│── database/
│── docs/
│── datasets/
│── uploads/
│── README.md
│── .gitignore
```

---

# 👨‍💻 Team Members

| Name | Responsibility |
|------|----------------|
| Nayna Chakole | Team Leader, Architecture, Integration |
| Member 2 | Frontend Development |
| Member 3 | Backend Development |
| Member 4 | AI & NLP |
| Member 5 | Database, Documentation & Testing |

---

# 🎯 Future Scope

- Mobile Application
- OCR Support for Scanned Documents
- Voice-Based Legal Assistant
- Regional Language Support
- State-Specific Legal Guidance
- AI Contract Comparison
- Legal Recommendation Engine
- Chrome & Edge Browser Extensions
- Android Accessibility Service for Terms & Conditions Analysis

---

# 📄 License

This project is developed as a Major Project for educational purposes.

I can absolutely help you build it, but **I don't recommend jumping straight into coding**.

From everything we've discussed, your project is large enough that if you start coding immediately, your team will likely end up rewriting major parts later.

## Here's the order I recommend (this is how software companies build projects)

### Phase 1 — Planning (1–2 days)

* Finalize project scope.
* Decide which document types to support.
* Download and inspect the datasets.
* Decide which model will perform which task.
* Design the database.
* Design the APIs.

### Phase 2 — Backend Foundation (3–4 days)

* Create the FastAPI project.
* Connect PostgreSQL.
* Implement JWT authentication.
* Create document upload API.

### Phase 3 — AI Pipeline (5–7 days)

* PDF extraction.
* Text cleaning.
* Clause detection.
* Risk detection.
* Summarization.
* RAG chatbot.

### Phase 4 — Frontend (5–7 days)

* Login.
* Dashboard.
* Upload page.
* Analysis page.
* Chatbot.

### Phase 5 — Integration & Testing

* Connect frontend and backend.
* Test AI outputs.
* Polish UI.

---

# Since you're working with **5 members**, here's the best GitHub workflow:

```
main
│
├── frontend
│
├── backend
│
├── ai
│
├── database
│
└── documentation
```

Each member works in their own branch and submits pull requests to `main`.

---

## Member 1 — Frontend

**Learn**

* React
* Tailwind CSS
* Axios
* React Router

**Tasks**

* Login page
* Dashboard
* Upload page
* Result page
* Chatbot UI

---

## Member 2 — Backend

**Learn**

* FastAPI
* JWT
* PostgreSQL
* SQLAlchemy

**Tasks**

* Login API
* Upload API
* User API
* History API

---

## Member 3 — AI/NLP

**Learn**

* Python
* PyMuPDF
* spaCy
* Hugging Face Transformers

**Tasks**

* PDF parser
* Text cleaning
* Clause detection
* Risk detection
* Summarization

---

## Member 4 — RAG

**Learn**

* LangChain
* FAISS
* Sentence Transformers

**Tasks**

* Create embeddings
* Store vectors
* Retrieve documents
* Chatbot

---

## Member 5 — Integration & QA

**Learn**

* Git
* Docker (optional)
* Testing

**Tasks**

* Connect frontend/backend
* Testing
* Documentation
* PPT
* Demo

---

# How We'll Build It Together

Instead of giving you **2,000 lines of code at once**, I suggest building it **module by module**.

For example:

### Module 1

* FastAPI project setup

### Module 2

* PostgreSQL connection

### Module 3

* JWT authentication

### Module 4

* PDF upload

### Module 5

* PDF parsing

### Module 6

* AI pipeline

### Module 7

* React frontend

### Module 8

* Chatbot

Each module will include:

* 📁 Folder structure
* 📄 Complete code
* 🧠 Explanation of every line
* 🔌 How it connects to the next module
* ❓ Viva questions
* ✅ Testing steps

---

## ⭐ My Recommendation

Because this is a **large project**, I don't want to dump all the code into one response—that would be difficult to understand, debug, and maintain.

Instead, we can build it **exactly like a real software development team**.

We start with **Project Setup (Module 1)** and finish with a complete working application. By the end you'll have:

* A clean GitHub repository.
* A properly organized codebase.
* Individual tasks for each team member.
* A project that every member understands—not just code they copied.

That approach will help you much more during your viva and if you later decide to turn this into a real product.