from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
from datetime import datetime

from ...database import get_db
from ...models import experiment as models
from ...schemas import experiment as schemas

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

async def log_request(request: Request, action: str, data: dict = None):
    """Log incoming request details"""
    logger.info(f"[{datetime.now()}] {action} - Request from {request.client.host}")
    if data:
        logger.info(f"Request data: {data}")

async def log_response(action: str, response: dict):
    """Log outgoing response"""
    logger.info(f"[{datetime.now()}] {action} - Response: {response}")

@router.get("/graph/overview", response_model=schemas.GraphOverview)
async def get_graph_overview(request: Request, db: Session = Depends(get_db)):
    """
    Get a concise representation of the entire experiment graph.
    Returns all nodes (experiments) and their connections.
    """
    await log_request(request, "GET_GRAPH_OVERVIEW")
    try:
        experiments = db.query(models.Experiment).all()
        relationships = db.query(models.ExperimentRelationship).all()

        nodes = [
            {
                "id": exp.id,
                "title": exp.title,
                "status": exp.status,
                "type": "experiment",
                "description": exp.description[:100] if exp.description else None,
                "created_at": exp.created_at.isoformat() if exp.created_at else None,
                "updated_at": exp.updated_at.isoformat() if exp.updated_at else None
            }
            for exp in experiments
        ]

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

        response = {"nodes": nodes, "edges": edges}
        await log_response("GET_GRAPH_OVERVIEW", response)
        return response
    except Exception as e:
        logger.error(f"Error in get_graph_overview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve graph overview",
                "message": str(e),
                "action_required": "Please try again or check input parameters"
            }
        )

@router.get("/nodes/{node_id}", response_model=schemas.NodeInfo)
async def get_node_info(
    node_id: int,
    request: Request,
    with_parents: bool = True,
    with_children: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific node (experiment).
    """
    await log_request(request, "GET_NODE_INFO", {"node_id": node_id})
    try:
        node = db.query(models.Experiment).filter(models.Experiment.id == node_id).first()
        if not node:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Node not found",
                    "message": f"No node exists with ID {node_id}",
                    "action_required": "Please verify the node ID"
                }
            )

        # Get relationships if requested
        parent_nodes = []
        child_nodes = []
        
        if with_parents:
            incoming_rels = db.query(models.ExperimentRelationship).filter(
                models.ExperimentRelationship.to_experiment_id == node_id
            ).all()
            parent_ids = [rel.from_experiment_id for rel in incoming_rels]
            parents = db.query(models.Experiment).filter(models.Experiment.id.in_(parent_ids)).all()
            parent_nodes = [{
                "id": p.id,
                "title": p.title,
                "description": p.description[:100] if p.description else None,
                "relationship": next(r.relationship_type for r in incoming_rels if r.from_experiment_id == p.id)
            } for p in parents]

        if with_children:
            outgoing_rels = db.query(models.ExperimentRelationship).filter(
                models.ExperimentRelationship.from_experiment_id == node_id
            ).all()
            child_ids = [rel.to_experiment_id for rel in outgoing_rels]
            children = db.query(models.Experiment).filter(models.Experiment.id.in_(child_ids)).all()
            child_nodes = [{
                "id": c.id,
                "title": c.title,
                "description": c.description[:100] if c.description else None,
                "relationship": next(r.relationship_type for r in outgoing_rels if r.to_experiment_id == c.id)
            } for c in children]

        response = {
            "node": {
                "id": node.id,
                "title": node.title,
                "description": node.description,
                "motivation": node.motivation,
                "expectations": node.expectations,
                "status": node.status,
                "hypothesis": node.hypothesis,
                "result": node.result,
                "extra_data": node.extra_data,
                "created_at": node.created_at.isoformat() if node.created_at else None,
                "updated_at": node.updated_at.isoformat() if node.updated_at else None
            },
            "parents": parent_nodes,
            "children": child_nodes
        }
        await log_response("GET_NODE_INFO", response)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_node_info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve node information",
                "message": str(e),
                "action_required": "Please try again or check input parameters"
            }
        )

@router.post("/nodes", response_model=schemas.Experiment)
async def create_node(
    experiment: schemas.ExperimentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a new node (experiment).
    Validates input and provides specific guidance for AI agent reprompting.
    """
    await log_request(request, "CREATE_NODE", experiment.model_dump())
    try:
        # Comprehensive input validation
        validation_errors = {
            "missing_fields": [],
            "invalid_fields": {},
            "suggestions": {}
        }

        # Check required fields
        if not experiment.title:
            validation_errors["missing_fields"].append("title")
            validation_errors["suggestions"]["title"] = "Provide a clear, descriptive title for the experiment"
        elif len(experiment.title.strip()) < 5:
            validation_errors["invalid_fields"]["title"] = "Title is too short"
            validation_errors["suggestions"]["title"] = "Title should be at least 5 characters long and descriptive"

        if experiment.status is None:
            validation_errors["missing_fields"].append("status")
            validation_errors["suggestions"]["status"] = f"Must be one of: {', '.join([s.value for s in ExperimentStatus])}"

        # Validate content quality
        if experiment.description and len(experiment.description.strip()) < 20:
            validation_errors["invalid_fields"]["description"] = "Description is too brief"
            validation_errors["suggestions"]["description"] = "Provide a more detailed description (at least 20 characters)"

        if experiment.motivation and len(experiment.motivation.strip()) < 20:
            validation_errors["invalid_fields"]["motivation"] = "Motivation is too brief"
            validation_errors["suggestions"]["motivation"] = "Explain the motivation more thoroughly"

        # Check for logical consistency
        if experiment.result and experiment.status != ExperimentStatus.COMPLETED:
            validation_errors["invalid_fields"]["status"] = "Experiment has results but status is not COMPLETED"
            validation_errors["suggestions"]["status"] = "Set status to COMPLETED or remove results"

        # If any validation errors found, return detailed feedback
        if validation_errors["missing_fields"] or validation_errors["invalid_fields"]:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Invalid experiment data",
                    "validation_errors": validation_errors,
                    "message": "The provided experiment data needs improvement",
                    "action_required": "Please address the following issues:",
                    "reprompt_guidance": {
                        "missing_fields": "You must provide values for all required fields",
                        "invalid_fields": "Some fields need to be improved",
                        "suggestions": "Follow the suggestions to improve the data quality",
                        "examples": {
                            "title": "PCR Optimization for DNA Amplification",
                            "description": "A detailed study to optimize PCR conditions for improved DNA amplification efficiency",
                            "motivation": "Current PCR protocols show inconsistent results. This experiment aims to identify optimal conditions."
                        }
                    }
                }
            )

        db_experiment = models.Experiment(**experiment.model_dump())
        db.add(db_experiment)
        db.commit()
        db.refresh(db_experiment)
        
        response = schemas.Experiment.model_validate(db_experiment)
        await log_response("CREATE_NODE", response.model_dump())
        return response
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error in create_node: {str(e)}")
        
        # Extract specific constraint violation details
        error_msg = str(e)
        if "NOT NULL constraint failed" in error_msg:
            field = error_msg.split(".")[-1].strip()
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Missing required field",
                    "field": field,
                    "message": f"The field '{field}' cannot be null",
                    "action_required": f"Please provide a value for '{field}'"
                }
            )
        elif "UNIQUE constraint failed" in error_msg:
            field = error_msg.split(".")[-1].strip()
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Duplicate value",
                    "field": field,
                    "message": f"The value for '{field}' already exists",
                    "action_required": f"Please provide a unique value for '{field}'"
                }
            )
        else:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Database constraint violation",
                    "message": str(e),
                    "action_required": "Please check your input data and try again"
                }
            )
    except Exception as e:
        db.rollback()
        logger.error(f"Error in create_node: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to create node",
                "message": str(e),
                "action_required": "Please verify your input data and try again"
            }
        )

@router.patch("/nodes/{node_id}", response_model=schemas.Experiment)
async def update_node(
    node_id: int,
    update_data: schemas.ExperimentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update an existing node (experiment).
    """
    await log_request(request, "UPDATE_NODE", {"node_id": node_id, "data": update_data.model_dump()})
    try:
        experiment = db.query(models.Experiment).filter(models.Experiment.id == node_id).first()
        if not experiment:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Node not found",
                    "message": f"No node exists with ID {node_id}",
                    "action_required": "Please verify the node ID"
                }
            )

        # Validate update data
        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "No update data provided",
                    "message": "At least one field must be provided for update",
                    "action_required": "Please provide at least one field to update",
                    "available_fields": ["title", "description", "motivation", "expectations", "status", "hypothesis", "result", "extra_data"]
                }
            )

        # Validate specific fields
        invalid_fields = []
        if 'status' in update_dict:
            # Convert status to lowercase for case-insensitive comparison
            status_value = update_dict['status'].lower() if isinstance(update_dict['status'], str) else update_dict['status']
            valid_statuses = [s.value for s in ExperimentStatus]
            if status_value not in valid_statuses:
                invalid_fields.append(('status', f"Must be one of: {', '.join(valid_statuses)}"))
            else:
                # Ensure correct case is used
                update_dict['status'] = next(s.value for s in ExperimentStatus if s.value == status_value)

        if 'title' in update_dict and not update_dict['title'].strip():
            invalid_fields.append(('title', "Cannot be empty"))

        if invalid_fields:
            error_response = {
                "error": "Invalid field values",
                "invalid_fields": dict(invalid_fields),
                "message": "Some fields contain invalid values",
                "action_required": f"Please correct the invalid fields. Valid status values are: {', '.join([s.value for s in ExperimentStatus])}",
                "debug_info": {
                    "received_value": update_dict.get('status'),
                    "valid_values": [s.value for s in ExperimentStatus],
                    "validation_errors": invalid_fields
                }
            }
            logger.error(f"Validation error in update_node: {error_response}")
            raise HTTPException(
                status_code=422,
                detail=error_response
            )

        # Apply updates
        for field, value in update_dict.items():
            if field == 'extra_data' and value and experiment.extra_data:
                experiment.extra_data.update(value)
            else:
                setattr(experiment, field, value)

        try:
            db.commit()
            db.refresh(experiment)
            response = schemas.Experiment.model_validate(experiment)
            await log_response("UPDATE_NODE", response.model_dump())
            return response
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Database constraint violation",
                    "message": str(e),
                    "action_required": "Please check your input data and try again"
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in update_node: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to update node",
                "message": str(e),
                "action_required": "Please verify your input data and try again"
            }
        )

@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: int,
    request: Request,
    force_delete: bool = False,
    db: Session = Depends(get_db)
):
    """
    Delete a node and optionally its subgraph.
    """
    await log_request(request, "DELETE_NODE", {"node_id": node_id, "force_delete": force_delete})
    try:
        # Check if node exists
        node = db.query(models.Experiment).filter(models.Experiment.id == node_id).first()
        if not node:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Node not found",
                    "message": f"No node exists with ID {node_id}",
                    "action_required": "Please verify the node ID"
                }
            )

        # Check for children
        has_children = db.query(models.ExperimentRelationship).filter(
            models.ExperimentRelationship.from_experiment_id == node_id
        ).first() is not None

        if has_children and not force_delete:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Node has children",
                    "message": "Cannot delete node with children without force_delete=true",
                    "action_required": "Set force_delete=true to delete node and its subgraph"
                }
            )

        if force_delete:
            # Get all descendant nodes
            nodes_to_delete = set()
            to_visit = {node_id}
            
            while to_visit:
                current = to_visit.pop()
                if current not in nodes_to_delete:
                    nodes_to_delete.add(current)
                    children = db.query(models.ExperimentRelationship.to_experiment_id).filter(
                        models.ExperimentRelationship.from_experiment_id == current
                    ).all()
                    to_visit.update(child[0] for child in children)

            # Delete relationships
            db.query(models.ExperimentRelationship).filter(
                (models.ExperimentRelationship.from_experiment_id.in_(nodes_to_delete)) |
                (models.ExperimentRelationship.to_experiment_id.in_(nodes_to_delete))
            ).delete(synchronize_session=False)

            # Delete nodes
            db.query(models.Experiment).filter(
                models.Experiment.id.in_(nodes_to_delete)
            ).delete(synchronize_session=False)
        else:
            # Delete relationships for this node
            db.query(models.ExperimentRelationship).filter(
                (models.ExperimentRelationship.from_experiment_id == node_id) |
                (models.ExperimentRelationship.to_experiment_id == node_id)
            ).delete(synchronize_session=False)
            
            # Delete the node
            db.query(models.Experiment).filter(models.Experiment.id == node_id).delete()

        db.commit()
        response = {"success": True, "deleted_node_id": node_id}
        await log_response("DELETE_NODE", response)
        return response
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in delete_node: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to delete node",
                "message": str(e),
                "action_required": "Please try again or check input parameters"
            }
        )