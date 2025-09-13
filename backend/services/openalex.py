# backend/services/openalex.py
import os, httpx
from typing import Dict, Any, Optional, List

OPENALEX_BASE = "https://api.openalex.org"
MAILTO = os.getenv("OPENALEX_MAILTO", "cqian17@jh.edu")

_client: Optional[httpx.AsyncClient] = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(base_url=OPENALEX_BASE, timeout=20.0)
    return _client

def _flatten_abstract(inv_idx: dict | None) -> str:
    if not inv_idx:
        return ""
    # Rebuild abstract from inverted index
    max_pos = max(pos for positions in inv_idx.values() for pos in positions)
    arr = [""] * (max_pos + 1)
    for token, poses in inv_idx.items():
        for p in poses:
            arr[p] = token
    return " ".join(arr)

def _norm_work(w: Dict[str, Any]) -> Dict[str, Any]:
    ids = w.get("ids") or {}
    host = w.get("host_venue") or {}
    return {
        "id": w["id"],  # e.g. https://openalex.org/W123...
        "title": w.get("display_name"),
        "year": w.get("publication_year"),
        "venue": host.get("display_name"),
        "doi": ids.get("doi"),
        "url": host.get("url") or ids.get("doi"),
        "cited_by_count": w.get("cited_by_count", 0),
        "referenced_works": w.get("referenced_works") or [],
        "related_works": w.get("related_works") or [],
        "cited_by_api_url": w.get("cited_by_api_url"),
        "open_access": w.get("open_access") or {},
        "is_oa": (w.get("open_access") or {}).get("is_oa", False),
        "topics": w.get("topics") or [],
        "abstract": _flatten_abstract(w.get("abstract_inverted_index")),
    }

async def _get(path: str, params: Dict[str, Any] | None = None) -> Dict[str, Any]:
    params = dict(params or {})
    params["mailto"] = MAILTO
    r = await get_client().get(path, params=params)
    r.raise_for_status()
    return r.json()

async def get_work(work_id_or_url: str) -> Dict[str, Any]:
    """
    Accepts either W-id or full OpenAlex URL.
    """
    wid = work_id_or_url.split("/")[-1]
    data = await _get(f"/works/{wid}")
    return _norm_work(data)

async def resolve_by_doi_or_title(doi: str | None, title_or_link: str | None) -> Dict[str, Any] | None:
    """
    Resolve a paper by DOI first; if not available, try title-based search (top-1).
    """
    # DOI path
    if doi:
        try:
            data = await _get(f"/works/doi:{doi}")
            w = _norm_work(data)
            w["_resolved_via"] = "doi"
            return w
        except httpx.HTTPStatusError as e:
            print(f"[openalex] DOI not found: {doi} ({e})")
        except Exception as e:
            print(f"[openalex] DOI lookup error: {doi} ({e})")
    # Title or link path
    q = title_or_link or ""
    if q:
        try:
            data = await _get("/works", {"search": q, "per-page": 5})
            res = data.get("results", [])
            if res:
                w = _norm_work(res[0])
                w["_resolved_via"] = "title"
                return w
            print(f"[openalex] title search returned no results for query: {q!r}")
        except Exception as e:
            print(f"[openalex] title search error for {q!r}: {e}")
    return None

async def get_abstract(work_id_or_url: str) -> str:
    w = await get_work(work_id_or_url)
    return w.get("abstract", "")

# verify_relationship and citation-based checks were removed in favor of
# a simpler, seedless binary validity check (verify_validity).

async def verify_validity(cand_work: Dict[str, Any]) -> Dict[str, Any]:
    """
    Binary validity: the paper exists in OpenAlex.
    Assumes caller already resolved via OpenAlex. If unresolved/malformed, invalid.
    Returns: { ok: bool, strength: 1.0|0.0, label: "valid", evidence }
    """
    if not cand_work or not cand_work.get("id"):
        return {"ok": False, "strength": 0.0, "label": "valid", "evidence": {"reason": "unresolved"}}

    evidence = {
        "openalex_id": cand_work.get("id"),
        "doi": cand_work.get("doi"),
        "resolved_via": cand_work.get("_resolved_via", "unknown"),
    }
    return {"ok": True, "strength": 1.0, "label": "valid", "evidence": evidence}
