"""FastAPI service: file/text intake -> LangGraph(Groq) -> MySQL/Postgres."""
import email
import io
import os
from datetime import datetime

from fastapi import Depends, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pypdf import PdfReader
from docx import Document

from app.database import Base, engine, get_db
from app.models import ComplaintLog
from app.schemas import ComplaintCreate, ExtractResponse
from app.agent.graph import run_extraction

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Pharma QMS — AI Complaint Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

ALLOWED = {".pdf": "application/pdf",
           ".txt": "text/plain", ".docx": "docx", ".eml": "message/rfc822"}


def read_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    return "\n".join([(p.extract_text() or "") for p in reader.pages])


def read_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    return "\n".join([p.text for p in doc.paragraphs])


def read_eml(data: bytes) -> str:
    msg = email.message_from_bytes(data)
    parts = [f"Subject: {msg.get('Subject', '')}", f"From: {msg.get('From', '')}", f"Date: {msg.get('Date', '')}"]
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                parts.append(part.get_payload(decode=True).decode(errors="ignore"))
    else:
        parts.append(msg.get_payload(decode=True).decode(errors="ignore") if msg.get_payload(decode=True) else str(msg.get_payload()))
    return "\n".join(parts)


def extract_text(filename: str, data: bytes) -> str:
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        return read_pdf(data)
    if ext == ".docx":
        return read_docx(data)
    if ext == ".eml":
        return read_eml(data)
    return data.decode(errors="ignore")  # .txt and fallback


@app.get("/health")
def health():
    return {"ok": True, "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            "groqConfigured": bool(os.getenv("GROQ_API_KEY"))}


@app.post("/api/extract", response_model=ExtractResponse)
async def extract(text: str = Form(default=""), file: UploadFile | None = File(default=None)):
    if file is not None:
        data = await file.read()
        raw = extract_text(file.filename or "upload.txt", data)
        fname = file.filename or "upload.txt"
    else:
        raw, fname = text, "pasted-text.txt"
    if len(raw.strip()) < 20:
        from fastapi import HTTPException
        raise HTTPException(400, "Paste at least a few sentences (min 20 characters).")
    return run_extraction(raw, fname)


@app.post("/api/complaints")
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    row = ComplaintLog(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, **payload.model_dump(), "created_at": row.created_at.isoformat() if row.created_at else None}


@app.get("/api/complaints")
def list_complaints(db: Session = Depends(get_db)):
    rows = db.query(ComplaintLog).order_by(ComplaintLog.id.desc()).limit(500).all()
    out = []
    for r in rows:
        out.append({c.name: getattr(r, c.name) for c in r.__table__.columns} | {"created_at": r.created_at.isoformat() if isinstance(r.created_at, datetime) else r.created_at})
    return out
