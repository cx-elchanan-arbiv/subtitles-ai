#!/bin/bash

echo "🚀 Starting SubsTranslator in Production Mode (Docker)..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Build and start all services
echo -e "${BLUE}🔨 Building and starting all services...${NC}"
docker-compose up --build -d

# Check if services started successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All services started successfully!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Application: http://localhost${NC}"
    echo -e "${GREEN}🔧 Backend API: http://localhost:8081${NC}"
    echo -e "${GREEN}📊 Redis: localhost:6379${NC}"
    echo ""
    echo -e "${BLUE}📋 Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${YELLOW}💡 To stop: ./scripts/stop.sh or docker-compose down${NC}"
    echo -e "${YELLOW}📝 To view logs: docker-compose logs -f${NC}"
else
    echo -e "${RED}❌ Failed to start services. Check the logs:${NC}"
    docker-compose logs
    exit 1
fi
