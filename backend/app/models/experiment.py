from sqlalchemy import Column, Integer, String, Text, Enum, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin
import enum

class ExperimentStatus(str, enum.Enum):
    """
    Represents the current state of an experiment
    - PLANNED: Experiment is defined but not started
    - IN_PROGRESS: Currently being conducted
    - COMPLETED: Experiment has been finished
    """
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class Experiment(Base, TimestampMixin):
    """
    Core experiment model representing a research experiment node.
    Each experiment captures its motivation, expectations, hypothesis, and results.
    Experiments are connected through ExperimentRelationship to form a DAG.
    """
    __tablename__ = "experiments"

    # Core fields
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)  # Short name/title of the experiment
    description = Column(Text, nullable=True)    # Detailed description of the experiment
    
    # Experiment planning and reasoning
    motivation = Column(Text, nullable=False)    # Why we're conducting this experiment (provided by AI)
    expectations = Column(Text, nullable=False)  # What we expect to learn/achieve from this experiment
    
    # Current state of the experiment
    status = Column(
        Enum(ExperimentStatus), 
        nullable=False, 
        default=ExperimentStatus.PLANNED
    )
    
    # Optional hypothesis and result fields
    hypothesis = Column(Text, nullable=True)  # The hypothesis being tested
    result = Column(Text, nullable=True)      # The outcome/results of the experiment
    
    # Flexible storage for additional properties
    # Stores any extra metadata that doesn't fit in the standard fields
    extra_data = Column(JSON, nullable=True)

class ExperimentRelationship(Base, TimestampMixin):
    """
    Represents directed edges between experiments in the research DAG.
    Each relationship has a type that describes how experiments are connected.
    
    Common relationship_types:
    - "leads_to": This experiment led to the creation of another
    - "supports": Results support another experiment's hypothesis
    - "refutes": Results contradict another experiment's hypothesis
    - "requires": This experiment depends on another's completion
    - "related_to": General relationship between experiments
    """
    __tablename__ = "experiment_relationships"

    id = Column(Integer, primary_key=True, index=True)
    
    # Source and target experiments
    from_experiment_id = Column(Integer, ForeignKey('experiments.id'), nullable=False)
    to_experiment_id = Column(Integer, ForeignKey('experiments.id'), nullable=False)
    
    # Type and description of the relationship
    relationship_type = Column(String(100), nullable=False)
    label = Column(Text, nullable=True)  # Optional description of the relationship
    
    # Additional properties specific to this relationship
    extra_data = Column(JSON, nullable=True)

    # Relationships to the connected experiments
    from_experiment = relationship(
        "Experiment", 
        foreign_keys=[from_experiment_id],
        backref="outgoing_relationships"
    )
    to_experiment = relationship(
        "Experiment", 
        foreign_keys=[to_experiment_id],
        backref="incoming_relationships"
    )