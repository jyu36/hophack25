from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ...database import get_db
from ...models.context_keywords import ContextKeyword

router = APIRouter()

@router.get("/context-keywords", response_model=List[str])
def get_all_keywords(db: Session = Depends(get_db)):
    """Get all saved keywords"""
    keywords = db.query(ContextKeyword).all()
    return [k.keyword for k in keywords]

@router.post("/context-keywords")
def add_keyword(keyword: str, db: Session = Depends(get_db)):
    """Add a new keyword"""
    try:
        db_keyword = ContextKeyword(keyword=keyword)
        db.add(db_keyword)
        db.commit()
        return {"success": True}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Keyword already exists")

@router.delete("/context-keywords/{keyword}")
def delete_keyword(keyword: str, db: Session = Depends(get_db)):
    """Delete a keyword"""
    result = db.query(ContextKeyword).filter(ContextKeyword.keyword == keyword).delete()
    if not result:
        raise HTTPException(status_code=404, detail="Keyword not found")
    db.commit()
    return {"success": True}
