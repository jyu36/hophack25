# backend/services/slides_context.py
from __future__ import annotations

from typing import Dict, Any, List
from sqlalchemy.orm import Session
import json

from app.models.experiment import Experiment
from app.models.literature import Literature

# If you have ContextKeyword model, import it; else we'll ignore keywords gracefully.
try:
    from app.models.context_keyword import ContextKeyword
    HAS_KEYWORDS = True
except Exception:
    HAS_KEYWORDS = False

def _safe_json(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return {}
    return {}

def build_context_json(node_id: int, db: Session) -> Dict[str, Any]:
    """
    Assemble a compact JSON context for one node from DB,
    ready to be injected into the slide-generation prompt.
    """
    node: Experiment | None = db.query(Experiment).filter(Experiment.id == node_id).first()
    if not node:
        raise ValueError("Node not found")

    # Literature list
    lits = db.query(Literature).filter(Literature.experiment_id == node_id).all()
    literature_list: List[Dict[str, Any]] = []
    for lit in lits:
        literature_list.append({
            "id": (lit.openalex_id or lit.link),
            "title": lit.title,
            "venue": lit.venue,
            "year": lit.year,
            "rel_type": lit.rel_type,
            "url": lit.link
        })

    # Keywords
    keywords = []
    if HAS_KEYWORDS:
        try:
            kws = db.query(ContextKeyword).filter(ContextKeyword.experiment_id == node_id).all()
            for k in kws:
                keywords.append({"keyword": k.keyword, "weight": getattr(k, "weight", 1.0)})
        except Exception:
            keywords = []

    extra = _safe_json(node.extra_data)

    # Methods / pipeline: try a few common places
    methods_list = []
    if "methods" in extra and isinstance(extra["methods"], list):
        methods_list = extra["methods"]
    elif "models" in extra and isinstance(extra["models"], dict):
        # allow { "pipeline": [ ... ] }
        methods_list = extra["models"].get("pipeline", []) or list(extra["models"].keys())

    context = {
        "PROJECT_TITLE": node.title,
        "PI_MISSION": extra.get("pi_mission", ""),
        "FOCUS_NODE_TITLE": node.title,
        "PROBLEM": node.description or extra.get("problem", ""),
        "HYPOTHESIS": node.hypothesis or "",
        "METHODS_LIST": methods_list,
        "DATASETS_LIST": extra.get("datasets", []),
        "METRICS_DICT": extra.get("metrics", {}),
        "EXPECTATIONS": node.expectations or "",
        "PLAN_STEPS_LIST": extra.get("planned_steps", []),
        "RESULTS_SUMMARY": node.result or "",
        "RISKS_LIST": extra.get("risks", []),
        "KEYWORDS_WITH_WEIGHTS": keywords,
        "LITERATURE_LIST": literature_list
    }
    return context
