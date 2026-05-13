#!/bin/bash

echo "🚀 Starting SubsTranslator in Full Development Mode..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${RED}🛑 Shutting down all development servers...${NC}"
    
    # Kill backend server
    pkill -f "python.*app.py" 2>/dev/null
    
    # Kill frontend server
    pkill -f "react-scripts start" 2>/dev/null
    
    # Kill celery worker
    pkill -f "celery.*worker" 2>/dev/null
    
    echo -e "${GREEN}✅ All development servers stopped${NC}"
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

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Redis not running. Starting Redis...${NC}"
    # Try to start Redis (macOS with Homebrew)
    if command -v brew >/dev/null 2>&1; then
        brew services start redis 2>/dev/null || echo -e "${RED}❌ Failed to start Redis. Please start it manually.${NC}"
        sleep 2
    else
        echo -e "${RED}❌ Redis not running. Please start Redis manually: brew services start redis${NC}"
        exit 1
    fi
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
    export REDIS_HOST=localhost
    export REDIS_PORT=6379
    export REDIS_URL=redis://localhost:6379/0
    python app.py
) &

BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

echo -e "${BLUE}⚙️  Starting Celery Worker...${NC}"
# Start Celery worker in background
(
    source .venv/bin/activate
    cd backend
    export UPLOAD_FOLDER=./uploads
    export DOWNLOADS_FOLDER=./downloads
    export WHISPER_MODELS_FOLDER=./whisper_models
    export ASSETS_FOLDER=./assets
    export REDIS_HOST=localhost
    export REDIS_PORT=6379
    export REDIS_URL=redis://localhost:6379/0
    celery -A celery_worker.celery_app worker -l info -Q processing --concurrency=1
) &

CELERY_PID=$!

# Wait a bit for Celery to start
sleep 3

echo -e "${BLUE}🌐 Starting Frontend Server...${NC}"
# Start frontend in background
(
    cd frontend
    npm start
) &

FRONTEND_PID=$!

echo -e "${GREEN}✅ All development servers started!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend:  http://localhost:8081${NC}"
echo -e "${GREEN}⚙️  Celery:   Worker running${NC}"
echo -e "${GREEN}📊 Redis:    localhost:6379${NC}"
echo -e "${BLUE}💡 Press Ctrl+C to stop all servers${NC}"
echo ""
echo -e "${YELLOW}🎯 Full functionality available - video processing will work!${NC}"

# Wait for all processes
wait $BACKEND_PID $FRONTEND_PID $CELERY_PID
