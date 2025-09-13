from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from ..database import Base

class Literature(Base):
    """
    Stores literature references (links/DOIs) associated with experiments.
    Rich fields are kept to cache verification and display info.
    """
    __tablename__ = "literature"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey('experiments.id', ondelete='CASCADE'), nullable=False)

    # Canonical identifiers (store as much as possible for future queries)
    openalex_id = Column(String, nullable=True, index=True)     # e.g. "W123456789"
    doi         = Column(String, nullable=True, index=True)     # e.g. "10.1145/xxxx"
    link        = Column(String, nullable=False)                # canonical URL (OpenAlex/DOI/arXiv)

    # Display fields (optional but useful for UI without extra calls)
    title = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    year  = Column(Integer, nullable=True)

    # Relationship to the node (required)
    rel_type = Column(String, nullable=False, default="similar")  # "similar" | "builds_on" | "prior" | "contrast"

    # Ranking / verification info (optional)
    confidence = Column(Float, nullable=True)                   # final score if coming from suggest_one
    evidence   = Column(JSON, nullable=True)                    # store verify evidence, prompt_version, etc.
    why        = Column(String, nullable=True)                  # short reason why relevant

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship to the experiment
    experiment = relationship("Experiment", back_populates="literature")
