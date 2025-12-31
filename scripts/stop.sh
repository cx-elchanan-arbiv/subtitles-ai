#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping SubsTranslator...${NC}"

# Stop development servers if running
echo -e "${YELLOW}📱 Stopping development servers...${NC}"
pkill -f "python.*app.py" 2>/dev/null
pkill -f "react-scripts.*start" 2>/dev/null
pkill -f "npm start" 2>/dev/null

# Stop Docker containers
echo -e "${YELLOW}🐳 Stopping Docker containers...${NC}"
docker-compose down

# The --volumes flag is commented out by default to prevent accidental data loss
# Uncomment the line below if you want to remove the named volumes too
# docker-compose down --volumes

echo -e "${GREEN}✅ All services stopped successfully!${NC}"
