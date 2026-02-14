#!/bin/bash

################################################################################
# KisanMind System Startup Script
#
# This script starts all KisanMind services in the correct order:
# 1. ML Inference Service (Port 8100)
# 2. API Server (Port 3001)
# 3. Frontend (Port 3000)
#
# Usage: bash start-system.sh
################################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[KisanMind]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if a port is in use
check_port() {
    local port=$1
    if netstat -an | grep -q ":$port.*LISTEN"; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Wait for a service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    print_status "Waiting for $name to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$name is ready!"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done

    print_error "$name failed to start after $max_attempts seconds"
    return 1
}

################################################################################
# Main Script
################################################################################

clear
echo "======================================"
echo "    KisanMind System Startup"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the KisanMind root directory"
    exit 1
fi

# Check for required commands
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm found: $(npm --version)"

if ! command -v python &> /dev/null && ! command -v py &> /dev/null; then
    print_error "Python is not installed"
    exit 1
fi

if command -v py &> /dev/null; then
    PYTHON_CMD="py"
else
    PYTHON_CMD="python"
fi
print_success "Python found: $($PYTHON_CMD --version)"

echo ""

################################################################################
# Check Ports
################################################################################

print_status "Checking ports..."

if check_port 8100; then
    print_warning "Port 8100 is already in use (ML Service)"
    echo "  Do you want to use the existing service? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        print_error "Please stop the service on port 8100 and try again"
        exit 1
    fi
    SKIP_ML=true
else
    print_success "Port 8100 is available"
    SKIP_ML=false
fi

if check_port 3001; then
    print_warning "Port 3001 is already in use (API Server)"
    echo "  Do you want to use the existing service? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        print_error "Please stop the service on port 3001 and try again"
        exit 1
    fi
    SKIP_API=true
else
    print_success "Port 3001 is available"
    SKIP_API=false
fi

if check_port 3000; then
    print_warning "Port 3000 is already in use (Frontend)"
    echo "  Do you want to use the existing service? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        print_error "Please stop the service on port 3000 and try again"
        exit 1
    fi
    SKIP_FRONTEND=true
else
    print_success "Port 3000 is available"
    SKIP_FRONTEND=false
fi

echo ""

################################################################################
# Start ML Inference Service
################################################################################

if [ "$SKIP_ML" = false ]; then
    print_status "Starting ML Inference Service..."

    cd services/ml-inference

    # Check if dependencies are installed
    if ! $PYTHON_CMD -c "import fastapi" 2>/dev/null; then
        print_warning "Installing ML service dependencies..."
        $PYTHON_CMD -m pip install -r requirements.txt
        $PYTHON_CMD -m pip install protobuf==5.29.3
    fi

    # Start ML service in background
    nohup $PYTHON_CMD -m uvicorn app:app --port 8100 > ml-service.log 2>&1 &
    ML_PID=$!
    echo $ML_PID > ml-service.pid

    cd ../..

    # Wait for ML service to be ready
    if wait_for_service "http://localhost:8100/health" "ML Service"; then
        print_success "ML Service started (PID: $ML_PID)"
        echo "  Logs: services/ml-inference/ml-service.log"
    else
        print_error "ML Service failed to start"
        print_error "Check logs: services/ml-inference/ml-service.log"
        exit 1
    fi
else
    print_success "Using existing ML Service on port 8100"
fi

echo ""

################################################################################
# Start API Server
################################################################################

if [ "$SKIP_API" = false ]; then
    print_status "Starting API Server..."

    cd api-server

    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_warning "Installing API server dependencies..."
        npm install
    fi

    # Start API server in background
    nohup npm run dev > api-server.log 2>&1 &
    API_PID=$!
    echo $API_PID > api-server.pid

    cd ..

    # Wait for API server to be ready
    if wait_for_service "http://localhost:3001/health" "API Server"; then
        print_success "API Server started (PID: $API_PID)"
        echo "  Logs: api-server/api-server.log"
    else
        print_error "API Server failed to start"
        print_error "Check logs: api-server/api-server.log"
        exit 1
    fi
else
    print_success "Using existing API Server on port 3001"
fi

echo ""

################################################################################
# Start Frontend
################################################################################

if [ "$SKIP_FRONTEND" = false ]; then
    print_status "Starting Frontend..."

    cd frontend

    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_warning "Installing frontend dependencies..."
        npm install
    fi

    # Start frontend in background
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid

    cd ..

    # Wait for frontend to be ready
    if wait_for_service "http://localhost:3000" "Frontend"; then
        print_success "Frontend started (PID: $FRONTEND_PID)"
        echo "  Logs: frontend/frontend.log"
    else
        print_error "Frontend failed to start"
        print_error "Check logs: frontend/frontend.log"
        exit 1
    fi
else
    print_success "Using existing Frontend on port 3000"
fi

echo ""

################################################################################
# Final Status
################################################################################

echo "======================================"
echo "  KisanMind System is Running!"
echo "======================================"
echo ""
echo "Services:"
echo "  • ML Service:  http://localhost:8100"
echo "  • API Server:  http://localhost:3001"
echo "  • Frontend:    http://localhost:3000"
echo ""
echo "To access the application:"
echo "  Open your browser to: http://localhost:3000"
echo ""
echo "To stop all services:"
echo "  bash stop-system.sh"
echo ""
echo "To check service status:"
echo "  bash check-health.sh"
echo ""
echo "======================================"
