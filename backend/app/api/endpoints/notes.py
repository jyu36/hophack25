from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import os

router = APIRouter()

NOTES_FILE = "notes.json"

# Initialize with empty notes if file doesn't exist
if not os.path.exists(NOTES_FILE):
    with open(NOTES_FILE, 'w') as f:
        json.dump({
            "last_meeting_notes": "",
            "discussion_points": ""
        }, f)

@router.get("/notes")
async def get_notes():
    """Get the current notes"""
    try:
        with open(NOTES_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notes")
async def update_notes(last_meeting_notes: Optional[str] = None, discussion_points: Optional[str] = None):
    """Update the notes"""
    try:
        # Read current notes
        with open(NOTES_FILE, 'r') as f:
            notes = json.load(f)
        
        # Update only provided fields
        if last_meeting_notes is not None:
            notes["last_meeting_notes"] = last_meeting_notes
        if discussion_points is not None:
            notes["discussion_points"] = discussion_points
        
        # Save back to file
        with open(NOTES_FILE, 'w') as f:
            json.dump(notes, f)
        
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
