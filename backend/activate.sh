#!/bin/bash

# Backend Virtual Environment Activation Script
echo "🐍 Activating Python 3.12.8 virtual environment..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Activate the virtual environment
source venv/bin/activate

# Verify activation
echo "✅ Virtual environment activated!"
echo "📍 Python version: $(python --version)"
echo "📍 Virtual environment path: $(which python)"
echo ""
echo "🚀 You can now run:"
echo "   uvicorn app.main:app --reload    # Start the FastAPI server"
echo "   python -m pytest                 # Run tests (if available)"
echo ""
echo "💡 To deactivate, run: deactivate"
