from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from ...database import get_db
from ...models.literature import Literature
from ...models.experiment import Experiment
from services import orchestrator
from services import openalex as openalex_svc
from services import llm_gemini as llm
import re
import traceback
from fastapi.responses import JSONResponse

from urllib.parse import unquote

router = APIRouter()

@router.get("/nodes/{node_id}/literature", response_model=List[dict])
async def get_node_literature(node_id: int, db: Session = Depends(get_db)):
    """
    Get all literature for a node, enriched similarly to get_literature_of_node.
    """
    # Check if node exists
    node = db.query(Experiment).filter(Experiment.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    rows = (
        db.query(Literature)
        .filter(Literature.experiment_id == node_id)
        .order_by(Literature.created_at.desc())
        .all()
    )

    out: List[dict] = []
    for row in rows:
        try:
            oa_id = row.openalex_id or _parse_openalex_id(row.link or "")
            work = await openalex_svc.get_work(oa_id) if oa_id else None
            if not work:
                # Try DOI parse and resolve if not an OpenAlex link
                doi = row.doi
                if not doi and row.link and "doi.org/" in row.link:
                    doi = row.link.split("doi.org/")[-1].strip()
                if doi:
                    work = await openalex_svc.resolve_by_doi_or_title(doi, row.link)
            summary = await llm.summarize_one_liner_cn(work.get("abstract", "") if work else "")
            out.append({
                "id": (work or {}).get("id") or oa_id or row.link,
                "title": (work or {}).get("title") or row.title,
                "year": (work or {}).get("year") or row.year,
                "venue": (work or {}).get("venue") or row.venue,
                "doi": (work or {}).get("doi") or row.doi,
                "url": (work or {}).get("url") or row.link,
                "relationship": row.rel_type,
                "confidence": round(row.confidence, 4) if row.confidence is not None else None,
                "verified": row.evidence or {},
                "summary": summary,
            })
        except Exception as e:
            out.append({
                "id": row.openalex_id or row.link,
                "title": row.title,
                "year": row.year,
                "venue": row.venue,
                "doi": row.doi,
                "url": row.link,
                "relationship": row.rel_type,
                "confidence": round(row.confidence, 4) if row.confidence is not None else None,
                "verified": row.evidence or {},
                "summary": "",
                "_error": str(e),
            })

    return out

def _parse_openalex_id(link: str) -> Optional[str]:
    m = re.search(r"openalex\.org/(W\d+)", link or "")
    return m.group(1) if m else None

@router.get("/nodes/{node_id}/literature/suggested")
async def get_literature_of_node(
    node_id: int,
    ignore_cache: bool = Query(False, description="Bypass cache and recompute suggestion"),
    relationship: str = Query("auto", description="Relationship type: similar|builds_on|prior|contrast|auto"),
    exclude_ids: str = Query("", description="Comma-separated list of paper IDs to exclude"),
    db: Session = Depends(get_db),
):
    """
    Return one literature item for the node.
    - If cache exists and ignore_cache is False: return most recent cached item (enriched via OpenAlex).
    - Else: call orchestrator.suggest_one, persist to cache, and return it.
    """
    try:
        # Ensure node exists
        node = db.query(Experiment).filter(Experiment.id == node_id).first()
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")

        # Normalize relationship
        allowed = {"auto", "similar", "builds_on", "prior", "contrast"}
        rel = relationship if relationship in allowed else "auto"
        
        # Parse exclude_ids
        exclude_list = [id.strip() for id in exclude_ids.split(",") if id.strip()] if exclude_ids else []

        if not ignore_cache:
            q = db.query(Literature).filter(Literature.experiment_id == node_id)
            if rel != "auto":
                q = q.filter(Literature.rel_type == rel)
            row = q.order_by(Literature.created_at.desc()).first()
            if row:
                oa_id = row.openalex_id or _parse_openalex_id(row.link or "")
                work = await openalex_svc.get_work(oa_id) if oa_id else None
                summary = await llm.summarize_one_liner_cn(work.get("abstract", "") if work else "")
                if work:
                    return {
                        "id": work["id"],
                        "title": work["title"],
                        "year": work.get("year"),
                        "venue": work.get("venue"),
                        "doi": work.get("doi"),
                        "url": work.get("url"),
                        "relationship": row.rel_type,
                        "confidence": round(row.confidence, 4) if row.confidence is not None else None,
                        "verified": row.evidence or {},
                        "summary": summary,
                    }
                # Fallback minimal if work not retrievable
                return {
                    "id": oa_id,
                    "title": None,
                    "year": None,
                    "venue": None,
                    "doi": None,
                    "url": row.link,
                    "relationship": row.rel_type,
                    "confidence": round(row.confidence, 4) if row.confidence is not None else None,
                    "verified": row.evidence or {},
                    "summary": "",
                }

        # No cache or ignore requested: compute suggestion
        try:
            paper = await orchestrator.suggest_one(
                node_id=str(node_id),
                relationship=rel,
                exclude_ids=exclude_list,
                db=db,
            )
        except Exception as e:
            # If suggestion fails (e.g., no candidates), try without exclusions
            if exclude_list:
                print(f"[api] Suggestion failed with exclusions, trying without: {e}")
                paper = await orchestrator.suggest_one(
                    node_id=str(node_id),
                    relationship=rel,
                    exclude_ids=[],
                    db=db,
                )
            else:
                raise e

        # Persist to cache
        try:
            oa_id = _parse_openalex_id(paper.get("id", "")) or _parse_openalex_id(paper.get("url", ""))
            link = paper.get("id") or paper.get("url")
            row = Literature(
                experiment_id=node_id,
                openalex_id=oa_id,
                link=link,
                rel_type=paper.get("relationship", rel if rel != "auto" else "similar"),
                title=paper.get("title"),
                venue=paper.get("venue"),
                year=paper.get("year"),
                confidence=paper.get("confidence"),
                evidence=paper.get("verified"),
            )
            db.add(row)
            db.commit()
        except Exception as e:
            print(f"[api] failed to cache suggested paper for node {node_id}: {e}")

        return paper
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "traceback": traceback.format_exc()},
        )

@router.post("/nodes/{node_id}/literature")
def add_literature(
    node_id: int,
    link: str = Query(..., description="Paper link, e.g. https://openalex.org/W2741809807 or https://doi.org/10.xxxx/yyy"),
    relationship: str = Query("similar", description="Relationship to node"),
    db: Session = Depends(get_db),
):
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
    
    # Derive identifiers
    oa_id = _parse_openalex_id(link)
    doi = None
    if "doi.org/" in (link or ""):
        doi = link.split("doi.org/")[-1].strip()

    # Add new literature (cache minimal fields; others can be enriched later)
    literature = Literature(
        experiment_id=node_id,
        openalex_id=oa_id,
        doi=doi,
        link=link.strip(),
        rel_type=relationship,
    )
    db.add(literature)
    db.commit()
    db.refresh(literature)
    return {"success": True, "id": literature.id, "openalex_id": literature.openalex_id}

@router.delete("/nodes/{node_id}/literature/{link:path}")
def delete_literature(node_id: int, link: str, db: Session = Depends(get_db)):
    link = unquote(link)

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