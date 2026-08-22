from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Clause(Base):
    __tablename__ = "clauses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_number: Mapped[str] = mapped_column(String(50), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    document = relationship("Document", back_populates="clauses")
    risk_results = relationship("RiskResult", back_populates="clause", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="clause", cascade="all, delete-orphan")
    obligations = relationship("Obligation", back_populates="clause", cascade="all, delete-orphan")


class RiskResult(Base):
    __tablename__ = "risk_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clause_id: Mapped[int] = mapped_column(ForeignKey("clauses.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(100), nullable=True)

    clause = relationship("Clause", back_populates="risk_results")


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clause_id: Mapped[int] = mapped_column(ForeignKey("clauses.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_text: Mapped[str] = mapped_column(String(255), nullable=False)
    start_position: Mapped[int] = mapped_column(Integer, nullable=False)
    end_position: Mapped[int] = mapped_column(Integer, nullable=False)

    clause = relationship("Clause", back_populates="entities")


class Obligation(Base):
    __tablename__ = "obligations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clause_id: Mapped[int] = mapped_column(ForeignKey("clauses.id", ondelete="CASCADE"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    obligated_party: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    clause = relationship("Clause", back_populates="obligations")
