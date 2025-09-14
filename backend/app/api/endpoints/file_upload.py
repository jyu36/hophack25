from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
from typing import List
import logging

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types
ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls',
    '.ppt', '.pptx', '.rtf', '.odt', '.ods', '.odp'
}

def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return os.path.splitext(filename)[1].lower()

def is_allowed_file(filename: str) -> bool:
    """Check if file type is allowed"""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS

def extract_keywords_from_text(text: str) -> List[str]:
    """Extract keywords from text content"""
    # Simple keyword extraction (in production, use more sophisticated NLP)
    import re

    # Remove common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    }

    # Extract words (3+ characters, alphanumeric)
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())

    # Filter out stop words and get unique words
    keywords = list(set([word for word in words if word not in stop_words]))

    # Return top 20 keywords
    return keywords[:20]

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file and extract keywords"""
    try:
        # Validate file type
        if not is_allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = get_file_extension(file.filename)
        filename = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        logger.info(f"File uploaded: {file.filename} -> {file_path}")

        # Extract text content based on file type
        text_content = ""
        keywords = []

        if file_extension == '.txt':
            # Read text file
            with open(file_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
        elif file_extension == '.pdf':
            # For PDF files, you would use a library like PyPDF2 or pdfplumber
            # For now, we'll return a placeholder
            text_content = f"[PDF content extraction not implemented yet for {file.filename}]"
        elif file_extension in ['.csv', '.xlsx', '.xls']:
            # For CSV/Excel files, you would use pandas
            text_content = f"[CSV/Excel content extraction not implemented yet for {file.filename}]"
        else:
            # For other file types, try to read as text
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text_content = f.read()
            except:
                text_content = f"[Content extraction not implemented for {file_extension} files]"

        # Extract keywords from text content
        if text_content and not text_content.startswith('['):
            keywords = extract_keywords_from_text(text_content)

        # Return response
        return JSONResponse({
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "file_type": file_extension,
            "file_size": len(content),
            "keywords": keywords,
            "text_preview": text_content[:500] + "..." if len(text_content) > 500 else text_content,
            "message": f"File uploaded successfully. Extracted {len(keywords)} keywords."
        })

    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/files/{file_id}")
async def get_file_info(file_id: str):
    """Get information about an uploaded file"""
    try:
        # Find file by ID
        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(file_id):
                file_path = os.path.join(UPLOAD_DIR, filename)
                file_size = os.path.getsize(file_path)

                return JSONResponse({
                    "file_id": file_id,
                    "filename": filename,
                    "file_size": file_size,
                    "exists": True
                })

        raise HTTPException(status_code=404, detail="File not found")

    except Exception as e:
        logger.error(f"Error getting file info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving file: {str(e)}")

@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Delete an uploaded file"""
    try:
        # Find and delete file by ID
        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(file_id):
                file_path = os.path.join(UPLOAD_DIR, filename)
                os.remove(file_path)

                return JSONResponse({
                    "success": True,
                    "message": f"File {file_id} deleted successfully"
                })

        raise HTTPException(status_code=404, detail="File not found")

    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.get("/download/sample_deck.pptx")
async def download_sample_presentation():
    """Download the sample presentation for demo purposes"""
    try:
        sample_file_path = os.path.join(UPLOAD_DIR, "sample_deck.pptx")
        
        if not os.path.exists(sample_file_path):
            raise HTTPException(status_code=404, detail="Sample presentation not found")
        
        from fastapi.responses import FileResponse
        return FileResponse(
            path=sample_file_path,
            filename="sample_presentation.pptx",
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )
        
    except Exception as e:
        logger.error(f"Error downloading sample presentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")
