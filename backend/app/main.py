from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

<<<<<<< HEAD
from .api.endpoints import experiments, context_keywords, literature, file_upload
=======
from .api.endpoints import experiments, context_keywords, literature, notes, discussion
>>>>>>> main
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Research Lab API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(experiments.router, tags=["experiments"])
app.include_router(context_keywords.router, tags=["context"])
app.include_router(literature.router, tags=["literature"])
<<<<<<< HEAD
app.include_router(file_upload.router, prefix="/files", tags=["files"])
=======
app.include_router(notes.router, tags=["notes"])
app.include_router(discussion.router, tags=["discussion"])
>>>>>>> main

@app.get("/")
def read_root():
    return {"message": "Welcome to Research Assistant"}