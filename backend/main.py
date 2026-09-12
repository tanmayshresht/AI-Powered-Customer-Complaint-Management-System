"""FastAPI service: file/text intake -> LangGraph(Groq) -> MySQL/Postgres."""
import email
import io
import os
from datetime import datetime

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
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
                payload = part.get_payload(decode=True)
                if isinstance(payload, bytes):
                    parts.append(payload.decode(errors="ignore"))
    else:
        payload = msg.get_payload(decode=True)
        if isinstance(payload, bytes):
            parts.append(payload.decode(errors="ignore"))
        else:
            val = msg.get_payload()
            parts.append(str(val) if val else "")
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
async def extract(request: Request):
    content_type = request.headers.get("content-type", "")
    raw = ""
    fname = "pasted-text.txt"

    try:
        if "application/json" in content_type:
            body = await request.json()
            raw = body.get("text", "") or body.get("complaint_text", "")
        else:
            form = await request.form()
            text = form.get("text", "")
            file = form.get("file")
            if file is not None and not isinstance(file, str):
                data = await file.read()
                fname = file.filename or "upload.txt"
                raw = extract_text(fname, data)
            else:
                raw = str(text) if text else ""
    except Exception as e:
        raise HTTPException(400, f"Invalid request payload: {str(e)}")

    if not raw or len(raw.strip()) < 5:
        raise HTTPException(400, "Please provide valid complaint text (min 5 characters).")

    return run_extraction(raw, fname)


@app.post("/api/complaints")
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    row = ComplaintLog(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, **payload.model_dump(), "created_at": row.created_at.isoformat() if row.created_at is not None else None}


@app.get("/api/complaints")
def list_complaints(db: Session = Depends(get_db)):
    rows = db.query(ComplaintLog).order_by(ComplaintLog.id.desc()).limit(500).all()
    out = []
    for r in rows:
        created_val = getattr(r, "created_at", None)
        created_str = created_val.isoformat() if isinstance(created_val, datetime) else created_val
        out.append({c.name: getattr(r, c.name) for c in r.__table__.columns} | {"created_at": created_str})
    return out


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    rows = db.query(ComplaintLog).all()
    total = len(rows)

    open_count = sum(1 for r in rows if str(getattr(r, "status", "")).lower() != "closed")
    critical_open = sum(1 for r in rows if str(getattr(r, "severity", "")).lower() == "critical" and str(getattr(r, "status", "")).lower() != "closed")

    now = datetime.utcnow()
    recent_7d = 0
    for r in rows:
        dt = getattr(r, "created_at", None)
        if isinstance(dt, datetime):
            if (now - dt).days <= 7:
                recent_7d += 1

    by_severity = {}
    for r in rows:
        sev = getattr(r, "severity", "Unknown") or "Unknown"
        by_severity[sev] = by_severity.get(sev, 0) + 1

    by_priority = {}
    for r in rows:
        pri = getattr(r, "priority", "Unknown") or "Unknown"
        by_priority[pri] = by_priority.get(pri, 0) + 1

    by_type = {}
    for r in rows:
        t = getattr(r, "complaint_type", None) or getattr(r, "type", None) or "General"
        by_type[t] = by_type.get(t, 0) + 1

    by_status = {}
    for r in rows:
        st = getattr(r, "status", "Open") or "Open"
        by_status[st] = by_status.get(st, 0) + 1

    return {
        "total": total,
        "open": open_count,
        "criticalOpen": critical_open,
        "recent7d": recent_7d,
        "bySeverity": by_severity,
        "byPriority": by_priority,
        "byType": by_type,
        "byStatus": by_status
    }