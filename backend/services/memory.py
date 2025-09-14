# backend/services/memory.py
import os
from typing import Dict, Any, Optional, List
import httpx
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.models.experiment import Experiment, ExperimentRelationship

RA_BASE_URL = os.getenv("RA_BASE_URL", "http://127.0.0.1:8000")

async def _get_node_info_db(node_id: int, db: Session, with_parents: bool = True, with_children: bool = True) -> Dict[str, Any]:
    """
    Fallback: direct DB query to assemble node info similar to GET /nodes/{id}.
    """
    node = db.get(Experiment, node_id)
    if not node:
        raise ValueError("Node not found")

    info: Dict[str, Any] = {
        "node": {
            "id": node.id,
            "title": node.title,
            "description": node.description,
            "motivation": getattr(node, "motivation", None),
            "expectations": getattr(node, "expectations", None),
            "status": getattr(node.status, "value", str(node.status) if node.status else None),
            "hypothesis": getattr(node, "hypothesis", None),
            "result": getattr(node, "result", None),
            "extra_data": getattr(node, "extra_data", None),
        },
        "parents": [],
        "children": [],
    }

    if with_parents:
        rels = db.query(ExperimentRelationship).filter(ExperimentRelationship.to_experiment_id == node.id).all()
        for rel in rels:
            p = db.get(Experiment, rel.from_experiment_id)
            if p:
                info["parents"].append({
                    "id": p.id,
                    "title": p.title,
                    "description": p.description,
                    "relationship": rel.relationship_type,
                })

    if with_children:
        rels = db.query(ExperimentRelationship).filter(ExperimentRelationship.from_experiment_id == node.id).all()
        for rel in rels:
            ch = db.get(Experiment, rel.to_experiment_id)
            if ch:
                info["children"].append({
                    "id": ch.id,
                    "title": ch.title,
                    "description": ch.description,
                    "relationship": rel.relationship_type,
                })

    return info

async def _fetch_node_info_api(node_id: int) -> Dict[str, Any]:
    """
    Call the backend API GET /nodes/{node_id}?with_parents=true&with_children=true
    """
    url = f"{RA_BASE_URL}/nodes/{node_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(url, params={"with_parents": "true", "with_children": "true"})
        r.raise_for_status()
        data = r.json()
        # The endpoint currently returns { node, parents, children }
        return data

async def get_node_context(node_id: int, db: Session) -> Dict[str, Any]:
    """
    Build LLM-ready context from node info (seedless).
    - problem: Experiment.title
    - description/motivation/expectations/hypothesis: from node
    - parents/children: brief titles with relationship
    - methods_aliases / datasets_metrics: left empty for now
    """
    # Prefer calling the public API to keep one source of truth.
    try:
        info = await _fetch_node_info_api(node_id)
    except Exception as e:
        print(f"[memory] API get_node_info failed: {e}; falling back to DB")
        info = await _get_node_info_db(node_id, db, with_parents=True, with_children=True)

    def _brief(items):
        out = []
        for it in items or []:
            title = it.get("title") or ""
            rel = it.get("relationship") or ""
            out.append(f"{title} ({rel})" if rel else title)
        return out

    parents_brief = _brief(info.get("parents", []))
    children_brief = _brief(info.get("children", []))

    return {
        "problem": info["node"].get("title"),
        "description": info["node"].get("description"),
        "motivation": info["node"].get("motivation"),
        "expectations": info["node"].get("expectations"),
        "hypothesis": info["node"].get("hypothesis"),
        "parents": parents_brief,
        "children": children_brief,
        # Future: enrich from extra_data or keywords tables
        "methods_aliases": [],
        "datasets_metrics": [],
    }
