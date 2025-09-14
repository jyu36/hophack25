from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import json
import os
import asyncio
from datetime import datetime

router = APIRouter()

FEEDBACK_FILE = "feedback.json"

# Initialize with empty feedback if file doesn't exist
if not os.path.exists(FEEDBACK_FILE):
    with open(FEEDBACK_FILE, 'w') as f:
        json.dump({
            "professor_feedback": "",
            "last_updated": datetime.now().isoformat()
        }, f)

@router.get("/feedback")
async def get_feedback():
    """Get the current feedback"""
    try:
        with open(FEEDBACK_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def update_feedback(professor_feedback: Optional[str] = None):
    """Update the feedback - professor only"""
    try:
        # Read current feedback
        with open(FEEDBACK_FILE, 'r') as f:
            feedback = json.load(f)
        
        # Update if provided
        if professor_feedback is not None:
            feedback["professor_feedback"] = professor_feedback
            feedback["last_updated"] = datetime.now().isoformat()
        
        # Save back to file
        with open(FEEDBACK_FILE, 'w') as f:
            json.dump(feedback, f)
        
        return feedback
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/feedback")
async def delete_feedback():
    """Delete the feedback - professor only"""
    try:
        # Reset to empty feedback
        feedback = {
            "professor_feedback": "",
            "last_updated": datetime.now().isoformat()
        }
        
        # Save to file
        with open(FEEDBACK_FILE, 'w') as f:
            json.dump(feedback, f)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SSE endpoint for real-time updates
@router.get("/feedback/updates")
async def feedback_updates():
    """SSE endpoint for feedback updates"""
    async def event_generator():
        while True:
            # Read current state
            with open(FEEDBACK_FILE, 'r') as f:
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
