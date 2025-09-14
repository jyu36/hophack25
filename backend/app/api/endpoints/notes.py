from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import os
import asyncio
from datetime import datetime

router = APIRouter()

NOTES_FILE = "notes.json"

# Initialize with empty notes if file doesn't exist
if not os.path.exists(NOTES_FILE):
    with open(NOTES_FILE, 'w') as f:
        json.dump({
            "last_meeting_notes": "",
            "discussion_points": "",
            "last_updated": datetime.now().isoformat()
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
async def update_notes(last_meeting_notes: Optional[str] = None):
    """Update the notes"""
    try:
        # Read current notes
        with open(NOTES_FILE, 'r') as f:
            notes = json.load(f)
        
        # Update only provided fields
        if last_meeting_notes is not None:
            notes["last_meeting_notes"] = last_meeting_notes
            notes["last_updated"] = datetime.now().isoformat()
        
        # Save back to file
        with open(NOTES_FILE, 'w') as f:
            json.dump(notes, f)
        
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notes/updates")
async def notes_updates():
    """SSE endpoint for notes updates"""
    async def event_generator():
        while True:
            # Read current state
            with open(NOTES_FILE, 'r') as f:
                current_data = json.load(f)
            
            # Send the current state
            yield f"data: {json.dumps(current_data)}\n\n"
            
            # Wait before next check
            await asyncio.sleep(1)  # Check every second

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )