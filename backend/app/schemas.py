"""Pydantic schemas — the 13 GMP extraction fields + API envelopes."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ComplaintExtract(BaseModel):
    complaint_source: str = "Email"
    customer_name: str = ""
    product_name: str = ""
    product_strength_grade: str = ""
    batch_lot_number: str = ""
    manufacturing_date: str = ""
    expiry_date: str = ""
    quantity_affected: str = ""
    complaint_type: str = "Other / Quality Defect"
    detailed_description: str = ""
    complaint_date: str = ""
    initial_severity: str = "Major"
    priority: str = "P1 - High"


class TraceStep(BaseModel):
    node: str
    detail: str


class ExtractResponse(BaseModel):
    fields: ComplaintExtract
    confidence: Dict[str, float] = Field(default_factory=dict)
    overallConfidence: float = 0.0
    reasoning: str = ""
    severityRationale: str = ""
    priorityRationale: str = ""
    complaintTypeRationale: str = ""
    trace: List[TraceStep] = Field(default_factory=list)
    provider: str = "groq"
    model: str = "llama-3.3-70b-versatile"


class ComplaintCreate(ComplaintExtract):
    status: str = "Open"
    raw_text: str = ""
    ai_summary: str = ""
    overall_confidence: Optional[float] = None
    confidence: Optional[Dict[str, float]] = None


class ComplaintOut(ComplaintCreate):
    id: int
    created_at: Optional[str] = None
