#!/bin/bash

echo "🚀 Starting SubsTranslator in Development Mode..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${RED}🛑 Shutting down development servers...${NC}"
    
    # Kill backend server
    pkill -f "python.*app.py" 2>/dev/null
    
    # Kill frontend server
    pkill -f "react-scripts start" 2>/dev/null
    
    echo -e "${GREEN}✅ Development servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${RED}❌ Virtual environment not found. Please run: python3 -m venv .venv${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}❌ Frontend dependencies not installed. Please run: cd frontend && npm install${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Starting Backend Server...${NC}"
# Start backend in background
(
    source .venv/bin/activate
    cd backend
    export UPLOAD_FOLDER=./uploads
    export DOWNLOADS_FOLDER=./downloads
    export WHISPER_MODELS_FOLDER=./whisper_models
    export ASSETS_FOLDER=./assets
    export FLASK_ENV=development
    export DEBUG=true
    python app.py
) &

BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

echo -e "${BLUE}🌐 Starting Frontend Server...${NC}"
# Start frontend in background
(
    cd frontend
    npm start
) &

FRONTEND_PID=$!

echo -e "${GREEN}✅ Development servers started!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend:  http://localhost:8081${NC}"
echo -e "${BLUE}💡 Press Ctrl+C to stop both servers${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
