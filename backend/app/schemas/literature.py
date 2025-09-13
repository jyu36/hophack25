# backend/schemas/literature.py
from pydantic import BaseModel, AnyHttpUrl
from typing import Optional, Literal, Dict, Any, List

Rel = Literal["similar", "builds_on", "prior", "contrast"]

class LiteratureCreate(BaseModel):
    # client can send any identifiers; backend will canonicalize
    openalex_id: Optional[str] = None  # e.g. "W123456789"
    doi: Optional[str] = None
    link: Optional[AnyHttpUrl] = None
    title: Optional[str] = None
    venue: Optional[str] = None
    year: Optional[int] = None
    relationship: Rel
    confidence: Optional[float] = None
    evidence: Optional[Dict[str, Any]] = None

class LiteratureOut(BaseModel):
    id: int
    node_id: int
    openalex_id: Optional[str] = None
    doi: Optional[str] = None
    link: AnyHttpUrl
    title: Optional[str] = None
    venue: Optional[str] = None
    year: Optional[int] = None
    relationship: Rel
    confidence: Optional[float] = None
    evidence: Optional[Dict[str, Any]] = None

class NodeLiteratureList(BaseModel):
    node_id: int
    items: List[LiteratureOut]
