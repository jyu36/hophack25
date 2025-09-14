# backend/services/llm_client.py
from __future__ import annotations

import json
import os
from typing import Dict, Any

# Optional: if you later wire Gemini, you'll import google.generativeai here.
# import google.generativeai as genai

async def generate_slide_plan(context: Dict[str, Any], prompt_template: str) -> Dict[str, Any]:
    """
    Build the prompt from template + context, send to LLM, parse JSON.
    For now this is a stub that returns a minimal valid structure so your pipeline runs end-to-end.

    TODO(YOU):
      - Replace this stub with a real Gemini call using your GEMINI_API_KEY.
      - Make sure the model returns a single JSON with {SLIDE_PLAN, SPEAKER_NOTES}.
    """
    try:
        prompt = prompt_template.format(**context)
    except Exception:
        # If formatting fails due to braces etc., fall back to embedding JSON directly
        prompt = prompt_template + "\n\nRAW_CONTEXT_JSON:\n" + json.dumps(context, ensure_ascii=False)

    # ---- STUB RESPONSE (keeps API working end-to-end) ----
    stub = {
        "SLIDE_PLAN": {
            "theme": {"palette": "deep-blue", "accent": "#2396F5"},
            "slides": [
                {
                    "title": context.get("PROJECT_TITLE") or "Research Proposal",
                    "layout": "title-only",
                    "bullets": ["PI mission: placeholder", "Goal: placeholder"],
                    "charts": [],
                    "tables": [],
                    "refs": []
                },
                {
                    "title": "Problem & Motivation",
                    "layout": "two-col",
                    "bullets": ["State of the art gap (placeholder)", "Impact (placeholder)"],
                    "charts": [
                        {"type":"bar","spec":{"x":[2021,2022,2023],"y":[3,7,12],
                                             "xLabel":"Year","yLabel":"#Papers"}}
                    ],
                    "tables": [],
                    "refs": [lit.get("id") for lit in context.get("LITERATURE_LIST", [])[:1]]
                }
            ]
        },
        "SPEAKER_NOTES": [
            ["Aligns with PI mission", "Audience & application"],
            ["Explain trend", "Identify gap", "Cite prior work"]
        ]
    }
    return stub

     
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")  # or pro, if you have access
    resp = model.generate_content(prompt)
    text = resp.text
    # Ensure it's valid JSON (strip code fences if any)
    text = text.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(text)
