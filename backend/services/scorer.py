# backend/services/scorer.py
def _norm_year(y: int | None, lo: int = 2015, hi: int = 2025) -> float:
    if not y: return 0.3
    y = max(lo, min(hi, y))
    return (y - lo) / (hi - lo + 1e-9)

def mix(rel_llm: float, verify_strength: float, year: int | None, is_oa: bool) -> float:
    """
    Weighted mixture for final ranking:
    - rel_llm: 0.45
    - verify_strength: 0.35
    - recency: 0.10
    - OA bonus: 0.10
    """
    rel = max(0.0, min(1.0, rel_llm or 0.0))
    ver = max(0.0, min(1.0, verify_strength or 0.0))
    rec = _norm_year(year)
    oa  = 1.0 if is_oa else 0.0
    return 0.45*rel + 0.35*ver + 0.10*rec + 0.10*oa
