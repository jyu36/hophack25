# backend/services/llm_gemini.py
import os, json
from typing import Dict, Any, List
from jinja2 import Environment, FileSystemLoader, select_autoescape

import google.generativeai as genai
import time
import dotenv

dotenv.load_dotenv()

# Configure Gemini once
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# Jinja2 environment for prompt templates
env = Environment(
    loader=FileSystemLoader("backend/prompts"),
    autoescape=select_autoescape([]),
    trim_blocks=True, lstrip_blocks=True,
)

def _render(tpl: str, **kw) -> str:
    return env.get_template(tpl).render(**kw)

def _resp_text(resp) -> str:
    """
    Robustly extract text from Gemini response across SDK versions.
    """
    if hasattr(resp, "text") and resp.text is not None:
        return resp.text
    try:
        # Fallback: concatenate all parts
        parts = []
        for c in resp.candidates or []:
            for p in getattr(c, "content", {}).parts or []:
                parts.append(getattr(p, "text", "") or "")
        return "".join(parts)
    except Exception:
        return ""

async def generate_candidates(ctx: Dict[str, Any], relationship: str, k: int = 12) -> List[Dict[str, str]]:
    """
    Ask the LLM to propose candidate papers (title, doi, relationship, why) in strict JSON.
    Returns a Python list of dicts. If API key missing, returns a minimal fallback.
    """
    if not API_KEY:
        # Minimal fallback for local wiring without API access
        return [{
            "title": f"{ctx.get('problem','Experiment topic')} — survey and baselines",
            "doi": None,
            "relationship": relationship or "similar",
            "why": "Likely relevant based on node context."
        }]

    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = _render(
        "generate_litcandidates.j2",
        problem=ctx.get("problem",""),
        description=ctx.get("description",""),
        motivation=ctx.get("motivation",""),
        expectations=ctx.get("expectations",""),
        hypothesis=ctx.get("hypothesis",""),
        parents=ctx.get("parents", []),
        children=ctx.get("children", []),
        methods_aliases=ctx.get("methods_aliases", []),
        datasets_metrics=ctx.get("datasets_metrics", []),
        relationship=relationship,
        k=k,
    )
    try:
        resp = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.2},
        )
        print("[llm] got response")
        txt = _resp_text(resp)
        data = json.loads(txt or "{}")
        papers = data.get("papers", [])
        out = []
        for p in papers:
            if "title" in p and "relationship" in p:
                print("[llm] candidate", {"title": p["title"], "doi": p.get("doi"), "relationship": p["relationship"], "why": p.get("why","")})
                out.append({"title": p["title"], "doi": p.get("doi"), "relationship": p["relationship"], "why": p.get("why","")})
        if not out:
            print("[llm] empty or invalid JSON; using fallback")
            return [{
                "title": f"{ctx.get('problem','Experiment topic')} — survey and baselines",
                "doi": None,
                "relationship": relationship or "similar",
                "why": "Likely relevant based on node context."
            }]
        return out[:k]
    except Exception as e:
        print(f"[llm] exception during generation: {e}; using fallback")
        return [{
            "title": f"{ctx.get('problem','Experiment topic')} — survey and baselines",
            "doi": None,
            "relationship": relationship or "similar",
            "why": "Likely relevant based on node context."
        }]

async def generate_candidates_from_base(ctx: Dict[str, Any], base_work: Dict[str, Any], relationship: str, k: int = 12) -> List[Dict[str, str]]:
    """
    Ask the LLM to propose candidate papers based on a base paper plus node context.
    Returns a Python list of dicts. If API key missing, returns a minimal fallback.
    """
    if not API_KEY:
        return [{
            "title": f"Works related to {base_work.get('title','base paper')}",
            "doi": None,
            "relationship": relationship or "similar",
            "why": "Related to the base paper and node."
        }]

    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = _render(
        "generate_litcandidates_from_base.j2",
        problem=ctx.get("problem",""),
        description=ctx.get("description",""),
        motivation=ctx.get("motivation",""),
        expectations=ctx.get("expectations",""),
        hypothesis=ctx.get("hypothesis",""),
        parents=ctx.get("parents", []),
        children=ctx.get("children", []),
        methods_aliases=ctx.get("methods_aliases", []),
        datasets_metrics=ctx.get("datasets_metrics", []),
        base_title=base_work.get("title",""),
        base_doi=base_work.get("doi",""),
        base_id=base_work.get("id",""),
        base_year=base_work.get("year") or "unknown",
        relationship=relationship,
        k=k,
    )
    try:
        resp = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.2},
        )
        print("[llm] got response (from_base)")
        txt = _resp_text(resp)
        data = json.loads(txt or "{}")
        papers = data.get("papers", [])
        out = []
        for p in papers:
            if "title" in p and "relationship" in p:
                print("[llm] candidate (from_base)", {"title": p["title"], "doi": p.get("doi"), "relationship": p["relationship"], "why": p.get("why","")})
                out.append({"title": p["title"], "doi": p.get("doi"), "relationship": p["relationship"], "why": p.get("why","")})
        if not out:
            print("[llm] empty/invalid JSON (from_base); using fallback")
            return [{
                "title": f"Works related to {base_work.get('title','base paper')}",
                "doi": None,
                "relationship": relationship or "similar",
                "why": "Related to the base paper and node."
            }]
        return out[:k]
    except Exception as e:
        print(f"[llm] exception during generation (from_base): {e}; using fallback")
        return [{
            "title": f"Works related to {base_work.get('title','base paper')}",
            "doi": None,
            "relationship": relationship or "similar",
            "why": "Related to the base paper and node."
        }]

async def stance(seed_abs: str, cand_abs: str) -> str:
    """
    Return one of: 'support' | 'neutral' | 'contradict'.
    """
    if not API_KEY:
        return "neutral"
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = _render("stance_contrast.j2", seed_abs=seed_abs or "", cand_abs=cand_abs or "")
    resp = model.generate_content(prompt, generation_config={"temperature": 0.0})
    ans = _resp_text(resp).strip().lower()
    # Normalize
    if "contrad" in ans:
        return "contradict"
    if "support" in ans:
        return "support"
    return "neutral"

async def summarize_one_liner_cn(cand_abs: str) -> str:
    """
    Produce a concise Chinese one-liner (<=35 chars). If no API, do a naive fallback.
    """
    if not API_KEY:
        return (cand_abs or "Related work and summary").strip()[:34] + ("…" if len(cand_abs or "") > 35 else "")
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = _render("summary_one_liner_cn.j2", cand_abs=cand_abs or "")
    resp = model.generate_content(prompt, generation_config={"temperature": 0.3})
    return _resp_text(resp).strip() or "Related work and summary"

async def relevance_score(ctx: Dict[str, Any], work: Dict[str, Any]) -> float:
    """
    Lightweight heuristic 0~1: keyword overlap in title.
    You can replace with a model-based scorer later.
    """
    title = (work.get("title") or "").lower()
    bag = " ".join(ctx.get("methods_aliases", []) + ctx.get("datasets_metrics", []) + [ctx.get("problem","")]).lower()
    kws = {w for w in bag.replace("/", " ").replace("-", " ").split() if len(w) >= 3}
    hits = sum(1 for k in kws if k in title)
    return max(0.1, min(1.0, 0.2 + 0.15 * hits))
