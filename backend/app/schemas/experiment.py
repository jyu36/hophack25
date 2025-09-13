from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Import the enum from SQLAlchemy model to avoid duplication
from ..models.experiment import ExperimentStatus

class ExperimentBase(BaseModel):
    """
    Base Pydantic model for experiments with all fields except title being optional
    """
    title: Optional[str] = None
    description: Optional[str] = None
    motivation: Optional[str] = None
    expectations: Optional[str] = None
    status: Optional[ExperimentStatus] = ExperimentStatus.PLANNED
    hypothesis: Optional[str] = None
    result: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

class ExperimentCreate(ExperimentBase):
    """
    Schema for creating a new experiment
    Only title is required, all other fields are optional
    """
    pass

class Experiment(ExperimentBase):
    """
    Schema for returning an experiment
    Includes all fields from base plus id and timestamps
    """
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExperimentRelationshipBase(BaseModel):
    """
    Base schema for experiment relationships
    """
    from_experiment_id: int
    to_experiment_id: int
    relationship_type: str
    label: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

class ExperimentRelationshipCreate(ExperimentRelationshipBase):
    """
    Schema for creating a new relationship between experiments
    """
    pass

class ExperimentRelationship(ExperimentRelationshipBase):
    """
    Schema for returning a relationship, includes id and timestamp
    """
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GraphOverview(BaseModel):
    """
    Schema for returning a graph overview
    """
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class NodeInfo(BaseModel):
    """
    Schema for returning detailed node information
    """
    node: Experiment
    incoming_relationships: List[ExperimentRelationship] = []
    outgoing_relationships: List[ExperimentRelationship] = []