# backend/services/orchestrator.py
from typing import List, Optional, Dict, Any
from . import memory, llm_gemini as llm, openalex, scorer
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.models.experiment import Experiment
from app.models.literature import Literature
from sqlalchemy.orm import Session


class NoCandidateError(Exception):
    ...

async def suggest_one(
    node_id: str,
    relationship: str = "auto",
    exclude_ids: Optional[List[str]] = None,
    db: Session = None,     
   
) -> Dict[str, Any]:
    """
    Orchestrate: context -> LLM candidates -> OpenAlex verify -> score -> one-liner summary.
    Returns a normalized paper card dict.
    """
    exclude_ids = set(exclude_ids or [])

    # 1) Node context (seedless)
    ctx = await memory.get_node_context(int(node_id), db)

    # 2) LLM candidates
    print("[orch] generating candidates for node", node_id)
    cands = await llm.generate_candidates(ctx, relationship=relationship, k=12)
    print(f"[orch] LLM candidates count: {len(cands) if isinstance(cands, list) else 'N/A'}")
    if callable(cands):
        raise TypeError("BUG: cands is a function; did you forget to CALL llm.generate_candidates?")
    if not isinstance(cands, list):
        raise TypeError(f"BUG: cands should be list, got {type(cands).__name__}")

    verified: List[Dict[str, Any]] = []
    for idx, c in enumerate(cands):
        print(f"[orch] cand[{idx}] doi={c.get('doi')} title={c.get('title')}")
        work = await openalex.resolve_by_doi_or_title(c.get("doi"), c.get("title"))
        if callable(work):
            raise TypeError("BUG: work is a function; did you forget to CALL resolve_by_doi_or_title?")
        if not work:
            print(f"[orch] cand[{idx}] unresolved by OpenAlex; skipping")
            continue
        if work["id"] in exclude_ids:
            print(f"[orch] cand[{idx}] excluded by id {work['id']}")
            continue

        # 3) Verify validity in OpenAlex (seedless)
        vrf = await openalex.verify_validity(work)
        if not vrf["ok"]:
            print(f"[orch] cand[{idx}] failed validity: {vrf}")
            continue

        # Carry over LLM-suggested relationship as a hint
        cand_rel = c.get("relationship", relationship)

        # 4) Score
        rel_score = await llm.relevance_score(ctx, work)
        print(f"[orch] cand[{idx}] rel_score={rel_score:.3f} verify_strength={vrf['strength']}")
        score = scorer.mix(rel_llm=rel_score, verify_strength=vrf["strength"],
                           year=work.get("year"), is_oa=work.get("is_oa", False))

        verified.append({"work": work, "why": c.get("why",""), "vrf": vrf, "score": score, "cand_relationship": cand_rel})

    if not verified:
        print("[orch] no verified candidates after filtering")
        raise NoCandidateError("No verified candidate")

    best = max(verified, key=lambda x: x["score"])
    w = best["work"]

    # 5) One-liner summary (Chinese)
    summary = await llm.summarize_one_liner_cn(w.get("abstract","") or "")

    # 6) Return normalized card
    return {
        "id": w["id"],
        "title": w["title"],
        "year": w.get("year"),
        "venue": w.get("venue"),
        "doi": w.get("doi"),
        "url": w.get("url"),
        "relationship": best.get("cand_relationship") or "related",
        "confidence": round(best["score"], 4),
        "verified": best["vrf"],
        "summary": summary,
        "why_relevant": best["why"],
    }

def _parse_doi_from_link(link: str) -> Optional[str]:
    try:
        if not link:
            return None
        if "doi.org/" in link:
            return link.split("doi.org/")[-1].strip()
        return None
    except Exception:
        return None

async def suggest_one_from_literature(
    node_id: str,
    base_link: Optional[str] = None,
    base_openalex_id: Optional[str] = None,
    relationship: str = "auto",
    exclude_ids: Optional[List[str]] = None,
    db: Session = None,
) -> Dict[str, Any]:
    """
    Suggest one paper based on a base literature item plus node context.
    Validity checked via OpenAlex; node context informs relevance.
    """
    exclude_ids = set(exclude_ids or [])

    # Node context
    ctx = await memory.get_node_context(int(node_id), db)

    # Resolve base work
    base_work: Dict[str, Any] | None = None
    if base_openalex_id:
        try:
            base_work = await openalex.get_work(base_openalex_id)
        except Exception as e:
            print(f"[orch] failed to get base by openalex id {base_openalex_id}: {e}")
    if base_work is None and base_link:
        doi = _parse_doi_from_link(base_link)
        base_work = await openalex.resolve_by_doi_or_title(doi, base_link)
    if not base_work:
        raise ValueError("Base literature cannot be resolved via OpenAlex (provide openalex_id or DOI/link)")

    # Generate candidates conditioned on base
    print("[orch] generating candidates (from_base) for node", node_id)
    cands = await llm.generate_candidates_from_base(ctx, base_work, relationship=relationship, k=12)
    print(f"[orch] LLM candidates count (from_base): {len(cands) if isinstance(cands, list) else 'N/A'}")

    verified: List[Dict[str, Any]] = []
    for idx, c in enumerate(cands):
        print(f"[orch] (from_base) cand[{idx}] doi={c.get('doi')} title={c.get('title')}")
        work = await openalex.resolve_by_doi_or_title(c.get("doi"), c.get("title"))
        if not work:
            print(f"[orch] (from_base) cand[{idx}] unresolved by OpenAlex; skipping")
            continue
        if work["id"] in exclude_ids:
            print(f"[orch] (from_base) cand[{idx}] excluded by id {work['id']}")
            continue

        vrf = await openalex.verify_validity(work)
        if not vrf["ok"]:
            print(f"[orch] (from_base) cand[{idx}] failed validity: {vrf}")
            continue

        cand_rel = c.get("relationship", relationship)
        # Enforce temporal constraints w.r.t base paper when possible
        try:
            base_year = int((base_work.get("year") or 0))
            cand_year = int((work.get("year") or 0))
        except Exception:
            base_year, cand_year = 0, 0
        if base_year and cand_year:
            if cand_rel == "prior" and not (cand_year < base_year):
                print(f"[orch] (from_base) cand[{idx}] violates prior year constraint: cand {cand_year} !< base {base_year}")
                continue
            if cand_rel == "builds_on" and not (cand_year >= base_year):
                print(f"[orch] (from_base) cand[{idx}] violates builds_on year constraint: cand {cand_year} !>= base {base_year}")
                continue
        rel_score = await llm.relevance_score(ctx, work)
        print(f"[orch] (from_base) cand[{idx}] rel_score={rel_score:.3f} verify_strength={vrf['strength']}")
        score = scorer.mix(rel_llm=rel_score, verify_strength=vrf["strength"],
                           year=work.get("year"), is_oa=work.get("is_oa", False))

        verified.append({"work": work, "why": c.get("why",""), "vrf": vrf, "score": score, "cand_relationship": cand_rel})

    if not verified:
        print("[orch] (from_base) no verified candidates after filtering")
        raise NoCandidateError("No verified candidate")

    best = max(verified, key=lambda x: x["score"])
    w = best["work"]
    summary = await llm.summarize_one_liner_cn(w.get("abstract","") or "")

    return {
        "id": w["id"],
        "title": w["title"],
        "year": w.get("year"),
        "venue": w.get("venue"),
        "doi": w.get("doi"),
        "url": w.get("url"),
        "relationship": best.get("cand_relationship") or "related",
        "confidence": round(best["score"], 4),
        "verified": best["vrf"],
        "summary": summary,
        "why_relevant": best["why"],
        "base": {"id": base_work.get("id"), "title": base_work.get("title"), "doi": base_work.get("doi")},
    }
