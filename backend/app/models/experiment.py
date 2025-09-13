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
    Each experiment can have associated literature references.
    """
    __tablename__ = "experiments"

    # Core fields
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)  # Short name/title of the experiment
    description = Column(Text, nullable=True)    # Detailed description of the experiment
    
    # Experiment planning and reasoning
    motivation = Column(Text, nullable=True)    # Why we're conducting this experiment (provided by AI)
    expectations = Column(Text, nullable=True)  # What we expect to learn/achieve from this experiment
    
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

    # Literature references associated with this experiment
    literature = relationship("Literature", back_populates="experiment", cascade="all, delete-orphan")

class RelationshipType(str, enum.Enum):
    """
    Valid types of relationships between experiments.
    Values are lowercase for case-insensitive comparison.
    Common variations are handled by the normalize_relationship_type function.
    """
    LEADS_TO = "leads_to"      # This experiment led to the creation of another
    SUPPORTS = "supports"      # Results support another experiment's hypothesis
    REFUTES = "refutes"       # Results contradict another experiment's hypothesis
    REQUIRES = "requires"      # This experiment depends on another's completion
    RELATED_TO = "related"     # General relationship between experiments
    INSPIRES = "inspires"     # This experiment inspired another
    EXTENDS = "extends"       # This experiment extends/builds upon another
    VALIDATES = "validates"    # This experiment validates another's findings
    IMPLEMENTS = "implements"  # This experiment implements another's theory/method

    @classmethod
    def normalize(cls, value: str) -> 'RelationshipType':
        """
        Normalize relationship type string to enum value.
        Handles common variations and is case-insensitive.
        """
        if not value:
            return cls.RELATED_TO

        # Convert to lowercase and remove spaces/underscores
        clean_value = value.lower().replace(' ', '_').replace('-', '_')
        
        # Handle common variations
        mapping = {
            # leads_to variations
            'leads_to': cls.LEADS_TO,
            'leadsto': cls.LEADS_TO,
            'leads': cls.LEADS_TO,
            'led_to': cls.LEADS_TO,
            'ledto': cls.LEADS_TO,
            'follows': cls.LEADS_TO,
            'followed_from': cls.LEADS_TO,
            'derived_from': cls.LEADS_TO,
            'derivedfrom': cls.LEADS_TO,
            
            # supports variations
            'supports': cls.SUPPORTS,
            'support': cls.SUPPORTS,
            'supporting': cls.SUPPORTS,
            'proves': cls.SUPPORTS,
            'confirms': cls.SUPPORTS,
            
            # refutes variations
            'refutes': cls.REFUTES,
            'refute': cls.REFUTES,
            'contradicts': cls.REFUTES,
            'disproves': cls.REFUTES,
            'opposes': cls.REFUTES,
            
            # requires variations
            'requires': cls.REQUIRES,
            'require': cls.REQUIRES,
            'depends_on': cls.REQUIRES,
            'dependson': cls.REQUIRES,
            'dependent': cls.REQUIRES,
            'needed': cls.REQUIRES,
            'prerequisite': cls.REQUIRES,
            
            # related variations
            'related': cls.RELATED_TO,
            'related_to': cls.RELATED_TO,
            'relatedto': cls.RELATED_TO,
            'connects_to': cls.RELATED_TO,
            'connected': cls.RELATED_TO,
            'associated': cls.RELATED_TO,
            
            # inspires variations
            'inspires': cls.INSPIRES,
            'inspire': cls.INSPIRES,
            'inspired_by': cls.INSPIRES,
            'inspiration': cls.INSPIRES,
            'motivated_by': cls.INSPIRES,
            
            # extends variations
            'extends': cls.EXTENDS,
            'extend': cls.EXTENDS,
            'builds_on': cls.EXTENDS,
            'buildson': cls.EXTENDS,
            'builds_upon': cls.EXTENDS,
            'extension': cls.EXTENDS,
            
            # validates variations
            'validates': cls.VALIDATES,
            'validate': cls.VALIDATES,
            'verification': cls.VALIDATES,
            'verifies': cls.VALIDATES,
            'confirms': cls.VALIDATES,
            
            # implements variations
            'implements': cls.IMPLEMENTS,
            'implement': cls.IMPLEMENTS,
            'implementation': cls.IMPLEMENTS,
            'realizes': cls.IMPLEMENTS,
            'applies': cls.IMPLEMENTS
        }
        
        # Try to find a match in our mapping
        return mapping.get(clean_value, cls.RELATED_TO)

class ExperimentRelationship(Base, TimestampMixin):
    """
    Represents directed edges between experiments in the research DAG.
    Each relationship has a type that describes how experiments are connected.
    """
    __tablename__ = "experiment_relationships"

    id = Column(Integer, primary_key=True, index=True)
    
    # Source and target experiments
    from_experiment_id = Column(Integer, ForeignKey('experiments.id'), nullable=False)
    to_experiment_id = Column(Integer, ForeignKey('experiments.id'), nullable=False)
    
    # Type and description of the relationship
    relationship_type = Column(Enum(RelationshipType), nullable=False)
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