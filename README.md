# HopHack25 Project

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with:
   ```
   DATABASE_URL=sqlite:///research_assistant.db
   ```

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Assistant Setup (Optional)
1. Navigate to the assistant directory:
   ```bash
   cd assistant
   ```

2. Create a `.env` file based on `env.example`

3. Install dependencies:
   ```bash
   npm install
   ```

## Development
- Frontend runs on: http://localhost:3000
- Backend API runs on: http://localhost:8000
- API documentation: http://localhost:8000/docs

## Common Issues
- If the database doesn't exist, it will be created automatically on first run
- Make sure both frontend and backend servers are running simultaneously


# DEMO cases
- try: I'm doing an research on finetuning llm using head tuning. Here are the experiments I done so far: - I have a FT dataset that maps from math word problem to the actual answer. collected from the internet and cleaned by mechanical turk. I also finetune the llama-3b model using head tuning.