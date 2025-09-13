#!/bin/bash

echo "🚀 Setting up Research Assistant..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your OpenAI API key and backend URL"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Test context system
echo "🧪 Testing context template system..."
npm run context-demo > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Context system working properly"
else
    echo "⚠️  Context system test failed (this is normal if backend is not running)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your OpenAI API key and backend URL"
echo "2. Make sure the backend API is running"
echo "3. Run the assistant:"
echo "   npm run dev         # Interactive mode with context initialization"
echo "   npm run demo        # Demo mode with context awareness"
echo "   npm run context-demo # Test the context template system"
echo ""
echo "New Features:"
echo "• Dynamic context initialization with current graph state"
echo "• Template-based system prompts with Jinja-style rendering"
echo "• Context refresh commands (refresh, clear)"
echo "• Automatic loading of experiment overview and context keywords"
echo ""
echo "Available Commands:"
echo "• help     - Show help message"
echo "• context  - Show current conversation context"
echo "• refresh  - Refresh context with latest graph information"
echo "• clear    - Clear conversation and refresh with latest context"
echo "• exit     - Exit the assistant"
echo ""
echo "For more information, see README.md"
