# backend/app/api/endpoints/slides.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path

from ...database import get_db
from sqlalchemy.orm import Session

from ...models.experiment import Experiment
from ...models.literature import Literature

from services.slides_context import build_context_json
from services.slides_prompt import SLIDES_PROMPT_EN
from services import llm_client
from services.pptx_builder import build_pptx

# This router is mounted without prefix; endpoints start with `/slides/...`
router = APIRouter()

class SlidePlanReq(BaseModel):
    node_id: int

class SlideGenerateReq(BaseModel):
    node_id: int
    filename: Optional[str] = None

class SlidePlanAllReq(BaseModel):
    # Placeholder for future filters; currently unused
    pass

class SlideGenerateAllReq(BaseModel):
    filename: Optional[str] = None

@router.get("/slides/context/{node_id}")
def get_context(node_id: int, db: Session = Depends(get_db)):
    """
    Return a compact 'Research Context JSON' assembled from DB for the given node.
    This is the exact object you later inject into the LLM prompt template.
    """
    return build_context_json(node_id, db)

@router.get("/slides/context")
def get_context_all(db: Session = Depends(get_db)):
    """
    Return a list of compact Research Context JSONs for the entire DB (all nodes).
    Useful when you want to generate slides for the whole project.
    """
    nodes = db.query(Experiment).all()
    contexts = [build_context_json(n.id, db) for n in nodes]
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "node_count": len(contexts),
        "contexts": contexts,
    }

@router.post("/slides/plan")
async def make_slide_plan(req: SlidePlanReq, db: Session = Depends(get_db)):
    """
    Produce {SLIDE_PLAN, SPEAKER_NOTES} via LLM (or stub if you haven't wired LLM yet).
    """
    # Ensure node exists
    node = db.query(Experiment).filter(Experiment.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    ctx = build_context_json(req.node_id, db)

    # === Call LLM (or stub) ===
    # This returns a dict with keys 'SLIDE_PLAN' and 'SPEAKER_NOTES'
    result = await llm_client.generate_slide_plan(context=ctx, prompt_template=SLIDES_PROMPT_EN)
    if not isinstance(result, dict) or "SLIDE_PLAN" not in result or "SPEAKER_NOTES" not in result:
        raise HTTPException(status_code=500, detail="Invalid LLM output format.")
    return result

@router.post("/slides/generate")
async def generate_pptx(req: SlideGenerateReq | None = None, db: Session = Depends(get_db)):
    """
    Create a PPTX file.
    - If body absent: auto-generate a combined deck for ALL nodes (no params needed).
    - If body present: generate for the specified node_id (optionally with provided plan/filename).
    Returns: { file_url }
    """
    # Combined mode (no body): generate one deck for all nodes
    if req is None:
        nodes = db.query(Experiment).all()
        plan_items: List[Dict[str, Any]] = []
        for n in nodes:
            ctx = build_context_json(n.id, db)
            plan = await llm_client.generate_slide_plan(context=ctx, prompt_template=SLIDES_PROMPT_EN)
            plan_items.append({"node_id": n.id, "title": n.title, "plan": plan})

        combined = _combine_plans(plan_items)

        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"all_nodes_{ts}.pptx"
        filename = Path(filename).name
        if not filename.lower().endswith(".pptx"):
            filename = f"{filename}.pptx"

        out_dir = Path(__file__).resolve().parents[3] / "generated"
        out_dir.mkdir(exist_ok=True)
        out_path = out_dir / filename
        try:
            build_pptx(combined, str(out_path))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PPTX build failed: {e}")
        return {"file_url": f"/download/{filename}"}

    # Single-node mode (body present)
    node = db.query(Experiment).filter(Experiment.id == req.node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Always generate plan from DB context (ignore any client-provided plan)
    ctx = build_context_json(req.node_id, db)
    plan = await llm_client.generate_slide_plan(context=ctx, prompt_template=SLIDES_PROMPT_EN)
    if not isinstance(plan, dict) or "SLIDE_PLAN" not in plan:
        raise HTTPException(status_code=500, detail="Failed to generate slide plan")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = (node.title or f"node_{node.id}").replace("/", "_").replace(" ", "_")[:50]
    filename = req.filename or f"{safe_title}_{ts}.pptx"
    filename = Path(filename).name
    if not filename.lower().endswith(".pptx"):
        filename = f"{filename}.pptx"

    out_dir = Path(__file__).resolve().parents[3] / "generated"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / filename
    try:
        build_pptx(plan, str(out_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPTX build failed: {e}")

    return {"file_url": f"/download/{filename}"}


@router.post("/slides/plan_all")
async def make_slide_plan_all(_: SlidePlanAllReq | None = None, db: Session = Depends(get_db)):
    """
    Generate slide plans for ALL nodes in the DB.
    Returns: { generated_at, count, items: [{node_id, title, plan, notes}] }
    """
    nodes = db.query(Experiment).all()
    items: List[Dict[str, Any]] = []
    for n in nodes:
        ctx = build_context_json(n.id, db)
        plan = await llm_client.generate_slide_plan(context=ctx, prompt_template=SLIDES_PROMPT_EN)
        notes = plan.get("SPEAKER_NOTES") if isinstance(plan, dict) else None
        items.append({
            "node_id": n.id,
            "title": n.title,
            "plan": plan,
            "notes": notes,
        })
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "count": len(items),
        "items": items,
    }


def _combine_plans(plans: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Combine multiple per-node plans into a single plan dict with concatenated slides.
    Inserts a divider slide for each node.
    """
    combined_slides: List[Dict[str, Any]] = []
    theme = {"palette": "deep-blue", "accent": "#2396F5"}
    speaker_notes: List[List[str]] = []

    for item in plans:
        nid = item.get("node_id") if isinstance(item, dict) else None
        raw_title = item.get("title") if isinstance(item, dict) else None
        # Normalize title to avoid showing "None"
        display_title = raw_title
        if not display_title:
            # Try to derive title from first slide of plan if available
            plan_preview = item.get("plan") or {}
            first_slide = ((plan_preview.get("SLIDE_PLAN") or {}).get("slides") or [{}])[0]
            display_title = first_slide.get("title")
        display_title = (display_title or (f"Node {nid}" if nid else "Node"))
        if isinstance(display_title, str) and display_title.strip().lower() in {"none", "null", ""}:
            display_title = f"Node {nid}" if nid else "Node"
        plan = item.get("plan") or {}
        slides = (plan.get("SLIDE_PLAN") or {}).get("slides", [])
        notes = plan.get("SPEAKER_NOTES") or []

        # Divider slide per node
        combined_slides.append({
            "title": f"{display_title}",
            "layout": "title-only",
            "bullets": ["Overview of this experiment"],
            "charts": [],
            "tables": [],
            "refs": []
        })
        speaker_notes.append([f"Section: {display_title}"])

        # Append node slides
        for s in slides:
            combined_slides.append(s)
        # Append notes aligned length best-effort
        if isinstance(notes, list) and notes:
            speaker_notes.extend(notes)

    return {
        "SLIDE_PLAN": {
            "theme": theme,
            "slides": combined_slides,
        },
        "SPEAKER_NOTES": speaker_notes,
    }


@router.post("/slides/generate_all")
async def generate_pptx_all(req: SlideGenerateAllReq | None = None, db: Session = Depends(get_db)):
    """
    Generate a single PPTX that covers ALL nodes by concatenating per-node plans.
    If `plans` are provided in the request, uses them; otherwise calls LLM per node.
    Returns: { file_url }
    """
    nodes = db.query(Experiment).all()
    plan_items: List[Dict[str, Any]] = []
    # Always compute plans from DB context; ignore any client-provided plans
    for n in nodes:
        ctx = build_context_json(n.id, db)
        plan = await llm_client.generate_slide_plan(context=ctx, prompt_template=SLIDES_PROMPT_EN)
        plan_items.append({"node_id": n.id, "title": n.title, "plan": plan})

    combined = _combine_plans(plan_items)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = (req.filename if req and req.filename else f"all_nodes_{ts}.pptx")
    # normalize filename: strip any path and ensure .pptx suffix
    filename = (Path(filename).name)
    if not filename.lower().endswith(".pptx"):
        filename = f"{filename}.pptx"

    out_dir = Path(__file__).resolve().parents[3] / "generated"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / filename

    try:
        build_pptx(combined, str(out_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPTX build failed: {e}")

    return {"file_url": f"/download/{filename}"}
