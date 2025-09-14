from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import os

router = APIRouter()

DISCUSSION_FILE = "discussion.json"

# Initialize with empty discussion if file doesn't exist
if not os.path.exists(DISCUSSION_FILE):
    with open(DISCUSSION_FILE, 'w') as f:
        json.dump({
            "discussion_points": ""
        }, f)

@router.get("/discussion")
async def get_discussion():
    """Get the current discussion points"""
    try:
        with open(DISCUSSION_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/discussion")
async def update_discussion(discussion_points: Optional[str] = None):
    """Update the discussion points"""
    try:
        # Read current discussion
        with open(DISCUSSION_FILE, 'r') as f:
            discussion = json.load(f)
        
        # Update if provided
        if discussion_points is not None:
            discussion["discussion_points"] = discussion_points
        
        # Save back to file
        with open(DISCUSSION_FILE, 'w') as f:
            json.dump(discussion, f)
        
        return discussion
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
