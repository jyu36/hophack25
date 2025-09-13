from sqlalchemy import Column, Integer, String
from ..database import Base

class ContextKeyword(Base):
    """
    Simple storage for keywords/phrases to provide context to AI
    """
    __tablename__ = "context_keywords"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False, unique=True)  # The keyword or phrase to remember
