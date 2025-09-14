from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.endpoints import experiments, context_keywords, literature, notes, discussion
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
app.include_router(notes.router, tags=["notes"])
app.include_router(discussion.router, tags=["discussion"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Research Assistant"}