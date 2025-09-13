from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import literature as models
from ...models.experiment import Experiment
from ...schemas import literature as schemas

router = APIRouter()

@router.get("/nodes/{node_id}/literature", response_model=list[str])
async def get_node_literature(
    node_id: int,
    db: Session = Depends(get_db)
):
    """Get literature references for a node"""
    literature = db.query(models.Literature).filter(
        models.Literature.experiment_id == node_id
    ).all()
    return [lit.link for lit in literature]

@router.post("/nodes/{node_id}/literature")
async def add_literature(
    node_id: int,
    link: str,
    db: Session = Depends(get_db)
):
    """Add a literature reference to a node"""
    # Verify node exists
    node = db.query(Experiment).filter(Experiment.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Node not found",
                "message": f"No node exists with ID {node_id}",
                "action_required": "Please verify the node ID"
            }
        )

    # Create literature reference
    literature = models.Literature(
        experiment_id=node_id,
        link=link
    )
    db.add(literature)
    db.commit()
    return {"success": True}

@router.delete("/nodes/{node_id}/literature/{link}")
async def delete_literature(
    node_id: int,
    link: str,
    db: Session = Depends(get_db)
):
    """Delete a literature reference from a node"""
    result = db.query(models.Literature).filter(
        models.Literature.experiment_id == node_id,
        models.Literature.link == link
    ).delete()

    if not result:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Literature reference not found",
                "message": f"No literature reference found for node {node_id} with link {link}",
                "action_required": "Please verify the node ID and link"
            }
        )

    db.commit()
    return {"success": True}