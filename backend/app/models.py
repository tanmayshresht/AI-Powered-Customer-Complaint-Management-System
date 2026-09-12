"""SQLAlchemy models — works on MySQL and PostgreSQL unchanged."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, func
from .database import Base


class ComplaintLog(Base):
    __tablename__ = "complaint_logs"

    id = Column(Integer, primary_key=True, index=True)
    complaint_source = Column(String(80), default="Email", index=True)
    customer_name = Column(String(200), index=True)
    product_name = Column(String(200), index=True)
    product_strength_grade = Column(String(120))
    batch_lot_number = Column(String(80), index=True)
    manufacturing_date = Column(String(40))
    expiry_date = Column(String(40))
    quantity_affected = Column(String(120))
    complaint_type = Column(String(80), index=True)
    detailed_description = Column(Text)
    complaint_date = Column(String(40))
    initial_severity = Column(String(20), default="Major", index=True)
    priority = Column(String(20), default="P1 - High", index=True)
    status = Column(String(40), default="Open", index=True)
    raw_text = Column(Text)
    ai_summary = Column(Text)
    overall_confidence = Column(Float, nullable=True)
    confidence = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
