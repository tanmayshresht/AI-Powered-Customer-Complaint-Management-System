# Pharma QMS — AI Complaint Service (FastAPI + LangGraph + Groq)

## 1. Folder structure
```
pharma-qms/
├── backend/
│   ├── main.py                 # FastAPI: /api/extract (file/text) + /api/complaints
│   ├── requirements.txt
│   ├── .env                    # GROQ_API_KEY, GROQ_MODEL, DATABASE_URL
│   └── app/
│       ├── database.py         # SQLAlchemy engine (MySQL/Postgres)
│       ├── models.py           # ComplaintLog ORM (13 GMP fields + audit)
│       ├── schemas.py          # Pydantic contracts
│       └── agent/
│           ├── graph.py        # LangGraph: preprocess → extract_llm → assess
│           └── prompts.py      # extraction system prompt + severity matrix
└── frontend/                   # React + Redux (this deployed app)
    └── src/store/complaintSlice.ts
```

## 2. Setup
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add GROQ_API_KEY + DATABASE_URL
# MySQL: CREATE DATABASE pharma_qms CHARACTER SET utf8mb4;
uvicorn main:app --reload --port 8000
```

## 3. Try it
- `POST /api/extract` with `text=` or `file=` (.pdf/.txt/.docx/.eml)
- `POST /api/complaints` with the 13 fields → saved via SQLAlchemy
- `GET /docs` for Swagger UI

## 4. Models
Set `GROQ_MODEL=llama-3.3-70b-versatile` (default) or `gemma2-9b-it`.
