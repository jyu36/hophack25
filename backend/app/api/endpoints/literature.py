from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...models.literature import Literature
from ...models.experiment import Experiment

router = APIRouter()

@router.get("/nodes/{node_id}/literature", response_model=List[str])
def get_node_literature(node_id: int, db: Session = Depends(get_db)):
    """
    Get all literature references for a specific node
    """
    # Check if node exists
    node = db.query(Experiment).filter(Experiment.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Get literature
    literature = db.query(Literature).filter(Literature.experiment_id == node_id).all()
    return [lit.link for lit in literature]

@router.post("/nodes/{node_id}/literature")
def add_literature(node_id: int, link: str, db: Session = Depends(get_db)):
    """
    Add a literature reference to a node
    """
    # Check if node exists
    node = db.query(Experiment).filter(Experiment.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Check if literature already exists
    existing = db.query(Literature).filter(
        Literature.experiment_id == node_id,
        Literature.link == link
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Literature reference already exists for this node")
    
    # Add new literature
    literature = Literature(experiment_id=node_id, link=link)
    db.add(literature)
    db.commit()
    return {"success": True}

@router.delete("/nodes/{node_id}/literature/{link}")
def delete_literature(node_id: int, link: str, db: Session = Depends(get_db)):
    """
    Delete a literature reference from a node
    """
    result = db.query(Literature).filter(
        Literature.experiment_id == node_id,
        Literature.link == link
    ).delete()
    
    if not result:
        raise HTTPException(status_code=404, detail="Literature reference not found")
    
    db.commit()
    return {"success": True}

@router.get("/literature", response_model=List[dict])
def get_all_literature(db: Session = Depends(get_db)):
    """
    Get all literature references across all nodes
    """
    literature = db.query(Literature, Experiment.title).join(Experiment).all()
    return [{
        "node_id": lit.Literature.experiment_id,
        "node_title": lit.title,
        "link": lit.Literature.link
    } for lit in literature]
