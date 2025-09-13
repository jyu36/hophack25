from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...models import experiment as models
from ...schemas import experiment as schemas

router = APIRouter()

@router.get("/graph/overview", response_model=schemas.GraphOverview)
def get_graph_overview(db: Session = Depends(get_db)):
    """
    Get a concise representation of the entire experiment graph.
    Returns all nodes (experiments) and their connections.
    """
    # Get all experiments
    experiments = db.query(models.Experiment).all()
    # Get all relationships
    relationships = db.query(models.ExperimentRelationship).all()

    # Format nodes
    nodes = [
        {
            "id": exp.id,
            "title": exp.title,
            "status": exp.status,
            "type": "experiment",  # Using current structure
            "description": exp.description[:100] if exp.description else None  # Short preview
        }
        for exp in experiments
    ]

    # Format edges
    edges = [
        {
            "id": rel.id,
            "from": rel.from_experiment_id,
            "to": rel.to_experiment_id,
            "type": rel.relationship_type,
            "label": rel.label
        }
        for rel in relationships
    ]

    return {"nodes": nodes, "edges": edges}

@router.get("/nodes/{node_id}", response_model=schemas.NodeInfo)
def get_node_info(
    node_id: int,
    with_parents: bool = True,
    with_children: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific node (experiment) including optional
    parent and child relationships.
    """
    # Get the experiment
    experiment = db.query(models.Experiment).filter(models.Experiment.id == node_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Node not found")

    # Get relationships if requested
    incoming_rels = []
    outgoing_rels = []
    
    if with_parents:
        incoming_rels = db.query(models.ExperimentRelationship).filter(
            models.ExperimentRelationship.to_experiment_id == node_id
        ).all()
    
    if with_children:
        outgoing_rels = db.query(models.ExperimentRelationship).filter(
            models.ExperimentRelationship.from_experiment_id == node_id
        ).all()

    # Get parent nodes
    parent_nodes = []
    if with_parents:
        parent_ids = [rel.from_experiment_id for rel in incoming_rels]
        parents = db.query(models.Experiment).filter(models.Experiment.id.in_(parent_ids)).all()
        parent_nodes = [{
            "id": p.id,
            "title": p.title,
            "description": p.description[:100] if p.description else None,
            "relationship": next(r.relationship_type for r in incoming_rels if r.from_experiment_id == p.id)
        } for p in parents]

    # Get child nodes
    child_nodes = []
    if with_children:
        child_ids = [rel.to_experiment_id for rel in outgoing_rels]
        children = db.query(models.Experiment).filter(models.Experiment.id.in_(child_ids)).all()
        child_nodes = [{
            "id": c.id,
            "title": c.title,
            "description": c.description[:100] if c.description else None,
            "relationship": next(r.relationship_type for r in outgoing_rels if r.to_experiment_id == c.id)
        } for c in children]

    return {
        "node": {
            "id": experiment.id,
            "title": experiment.title,
            "description": experiment.description,
            "status": experiment.status,
            "type": experiment.extra_data.get("node_type", "experiment") if experiment.extra_data else "experiment"
        },
        "parents": parent_nodes,
        "children": child_nodes
    }

@router.get("/nodes", response_model=List[schemas.Experiment])
def get_all_nodes(
    concise: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get a list of all nodes. If concise=true, returns only basic information.
    """
    experiments = db.query(models.Experiment).all()
    if not concise:
        return experiments
    
    return [{
        "id": exp.id,
        "title": exp.title,
        "display_text": exp.description[:100] if exp.description else None,
        "status": exp.status,
        "type": exp.extra_data.get("node_type", "experiment") if exp.extra_data else "experiment"
    } for exp in experiments]

@router.post("/nodes", response_model=schemas.Experiment)
def create_node(
    experiment: schemas.ExperimentCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new node (experiment) with metadata.
    """
    db_experiment = models.Experiment(**experiment.model_dump())
    db.add(db_experiment)
    db.commit()
    db.refresh(db_experiment)
    return db_experiment

@router.patch("/nodes/{node_id}", response_model=schemas.Experiment)
def update_node(
    node_id: int,
    update_data: schemas.ExperimentCreate,
    db: Session = Depends(get_db)
):
    """
    Update an existing node (experiment). Only provided fields will be updated.
    """
    experiment = db.query(models.Experiment).filter(models.Experiment.id == node_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Node not found")

    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if field == 'extra_data' and value and experiment.extra_data:
            # Merge extra_data instead of overwriting
            experiment.extra_data.update(value)
        else:
            setattr(experiment, field, value)

    db.commit()
    db.refresh(experiment)
    return experiment

def collect_subgraph_nodes(node_id: int, db: Session) -> set:
    """
    Collect all descendant nodes in the subgraph using BFS.
    """
    to_visit = {node_id}
    visited = set()
    
    while to_visit:
        current = to_visit.pop()
        if current in visited:
            continue
            
        visited.add(current)
        
        # Get all children
        children = db.query(models.ExperimentRelationship.to_experiment_id).filter(
            models.ExperimentRelationship.from_experiment_id == current
        ).all()
        
        to_visit.update(child[0] for child in children)
    
    return visited

@router.delete("/nodes/{node_id}")
def delete_node(
    node_id: int,
    force_delete: bool = False,
    db: Session = Depends(get_db)
):
    """
    Delete a node (experiment). If force_delete is True, also delete the entire subgraph.
    """
    # Check if node exists
    node = db.query(models.Experiment).filter(models.Experiment.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Check if node has any outgoing relationships (is not a leaf)
    has_children = db.query(models.ExperimentRelationship).filter(
        models.ExperimentRelationship.from_experiment_id == node_id
    ).first() is not None

    if has_children and not force_delete:
        raise HTTPException(
            status_code=400,
            detail="Node has children. Set force_delete=True to delete node and its subgraph"
        )

    if force_delete:
        # Collect all nodes in the subgraph
        nodes_to_delete = collect_subgraph_nodes(node_id, db)
        
        # Delete all relationships involving these nodes
        db.query(models.ExperimentRelationship).filter(
            (models.ExperimentRelationship.from_experiment_id.in_(nodes_to_delete)) |
            (models.ExperimentRelationship.to_experiment_id.in_(nodes_to_delete))
        ).delete(synchronize_session=False)
        
        # Delete all nodes
        db.query(models.Experiment).filter(
            models.Experiment.id.in_(nodes_to_delete)
        ).delete(synchronize_session=False)
    else:
        # Just delete relationships involving this node
        db.query(models.ExperimentRelationship).filter(
            (models.ExperimentRelationship.from_experiment_id == node_id) |
            (models.ExperimentRelationship.to_experiment_id == node_id)
        ).delete(synchronize_session=False)
        
        # Delete the node
        db.query(models.Experiment).filter(
            models.Experiment.id == node_id
        ).delete(synchronize_session=False)

    db.commit()
    return {"success": True}

@router.post("/edges", response_model=schemas.ExperimentRelationship)
def create_edge(
    edge: schemas.ExperimentRelationshipCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new edge (relationship) between nodes.
    """
    # Verify both nodes exist
    from_node = db.query(models.Experiment).filter(models.Experiment.id == edge.from_experiment_id).first()
    to_node = db.query(models.Experiment).filter(models.Experiment.id == edge.to_experiment_id).first()
    
    if not from_node or not to_node:
        raise HTTPException(status_code=404, detail="One or both nodes not found")

    db_edge = models.ExperimentRelationship(**edge.model_dump())
    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return db_edge

@router.patch("/edges/{edge_id}", response_model=schemas.ExperimentRelationship)
def update_edge(
    edge_id: int,
    edge: schemas.ExperimentRelationshipCreate,
    db: Session = Depends(get_db)
):
    """
    Update an existing edge (relationship).
    """
    db_edge = db.query(models.ExperimentRelationship).filter(models.ExperimentRelationship.id == edge_id).first()
    if not db_edge:
        raise HTTPException(status_code=404, detail="Edge not found")

    update_data = edge.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_edge, field, value)

    db.commit()
    db.refresh(db_edge)
    return db_edge

def find_edge_by_nodes(
    db: Session,
    from_id: int,
    to_id: int,
    label: str = None
) -> models.ExperimentRelationship:
    """Helper to find edge by node IDs and optional label"""
    query = db.query(models.ExperimentRelationship).filter(
        models.ExperimentRelationship.from_experiment_id == from_id,
        models.ExperimentRelationship.to_experiment_id == to_id
    )
    if label:
        query = query.filter(models.ExperimentRelationship.label == label)
    return query.first()

@router.delete("/edges/{edge_id}")
def delete_edge_by_id(edge_id: int, db: Session = Depends(get_db)):
    """
    Delete an edge by its ID.
    """
    result = db.query(models.ExperimentRelationship).filter(models.ExperimentRelationship.id == edge_id).delete()
    if not result:
        raise HTTPException(status_code=404, detail="Edge not found")
    
    db.commit()
    return {"success": True}

@router.delete("/edges/by-nodes")
def delete_edge(
    from_id: int,
    to_id: int,
    label: str = None,
    db: Session = Depends(get_db)
):
    """
    Delete an edge by specifying source and target nodes, and optionally a label.
    """
    edge = find_edge_by_nodes(db, from_id, to_id, label)
    if not edge:
        raise HTTPException(status_code=404, detail="Edge not found")
    
    return delete_edge_by_id(edge.id, db)
