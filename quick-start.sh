#!/bin/bash

# TestFlow Quick Start Script
# This script sets up and runs the entire TestFlow application

set -e  # Exit on error

echo "🚀 TestFlow - Quick Start Script"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0.32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql"
    echo "  macOS: brew install postgresql"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL found${NC}"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo "Starting PostgreSQL..."
    # Try to start PostgreSQL
    if command -v brew &> /dev/null; then
        brew services start postgresql
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    elif command -v service &> /dev/null; then
        sudo service postgresql start
    fi
    sleep 2
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}📦 Setting up backend...${NC}"
cd backend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Setup database
echo -e "${BLUE}🗄️  Setting up database...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Create database (will skip if exists)
bash setup-db.sh || true

echo -e "${GREEN}✅ Backend setup complete!${NC}"
echo ""

# Setup Frontend
echo -e "${BLUE}📦 Setting up frontend...${NC}"
cd ../frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created frontend .env file${NC}"
fi

echo -e "${GREEN}✅ Frontend setup complete!${NC}"
echo ""

# Start the application
echo -e "${BLUE}🚀 Starting TestFlow...${NC}"
echo ""
echo -e "${GREEN}Starting backend server on port 5000...${NC}"

cd ../backend

# Start backend in background
npm run dev > /tmp/testflow-backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check /tmp/testflow-backend.log${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
done

echo ""
echo -e "${GREEN}Starting frontend server on port 5173...${NC}"

cd ../frontend

# Start frontend in background
npm run dev > /tmp/testflow-frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait a bit for frontend to start
sleep 3

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  🎉 TestFlow is running!                                 ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  📍 Frontend: ${BLUE}http://localhost:5173${GREEN}                       ║${NC}"
echo -e "${GREEN}║  📍 Backend:  ${BLUE}http://localhost:5000${GREEN}                       ║${NC}"
echo -e "${GREEN}║  📍 API Docs: ${BLUE}http://localhost:5000/api-docs${GREEN}             ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  Backend PID: ${BACKEND_PID}                                        ║${NC}"
echo -e "${GREEN}║  Frontend PID: ${FRONTEND_PID}                                      ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  📝 Logs:                                                ║${NC}"
echo -e "${GREEN}║    Backend:  tail -f /tmp/testflow-backend.log           ║${NC}"
echo -e "${GREEN}║    Frontend: tail -f /tmp/testflow-frontend.log          ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║  ⏹️  To stop: kill ${BACKEND_PID} ${FRONTEND_PID}                           ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for user to press Ctrl+C
wait
