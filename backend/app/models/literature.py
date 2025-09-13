from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Literature(Base):
    """
    Stores literature references (links/DOIs) associated with experiments
    """
    __tablename__ = "literature"

    id = Column(Integer, primary_key=True, index=True)
    link = Column(String, nullable=False)  # URL or DOI of the literature
    experiment_id = Column(Integer, ForeignKey('experiments.id', ondelete='CASCADE'), nullable=False)
    
    # Relationship to the experiment
    experiment = relationship("Experiment", back_populates="literature")
