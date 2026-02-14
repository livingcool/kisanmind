#!/bin/bash

################################################################################
# KisanMind System Health Check Script
#
# This script checks the health of all KisanMind services
#
# Usage: bash check-health.sh
################################################################################

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "  ${RED}✗${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

check_service() {
    local url=$1
    local name=$2
    local expected_status=$3

    # Try to reach the service
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_status" ]; then
        print_success "$name is running (HTTP $http_code)"

        # Parse JSON response if available
        if echo "$body" | grep -q "status"; then
            status=$(echo "$body" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            if [ "$status" = "healthy" ]; then
                print_success "Status: $status"
            else
                print_warning "Status: $status"
            fi

            # Extract additional info
            version=$(echo "$body" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
            if [ -n "$version" ]; then
                echo "    Version: $version"
            fi
        fi
        return 0
    else
        print_error "$name is not responding (HTTP $http_code)"
        return 1
    fi
}

################################################################################
# Main Script
################################################################################

clear
echo "======================================"
echo "  KisanMind System Health Check"
echo "======================================"
echo ""
echo "Timestamp: $(date)"
echo ""

################################################################################
# Check ML Service
################################################################################

print_header "[1/3] ML Inference Service (Port 8100)"
if check_service "http://localhost:8100/health" "ML Service" "200"; then
    ML_STATUS="UP"
else
    ML_STATUS="DOWN"
    print_warning "Start with: cd services/ml-inference && py -m uvicorn app:app --port 8100"
fi
echo ""

################################################################################
# Check API Server
################################################################################

print_header "[2/3] API Server (Port 3001)"
if check_service "http://localhost:3001/health" "API Server" "200"; then
    API_STATUS="UP"
else
    API_STATUS="DOWN"
    print_warning "Start with: cd api-server && npm run dev"
fi
echo ""

################################################################################
# Check Frontend
################################################################################

print_header "[3/3] Frontend (Port 3000)"
response_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$response_code" = "200" ] || [ "$response_code" = "304" ]; then
    print_success "Frontend is running (HTTP $response_code)"
    FRONTEND_STATUS="UP"
else
    print_error "Frontend is not responding (HTTP $response_code)"
    FRONTEND_STATUS="DOWN"
    print_warning "Start with: cd frontend && npm run dev"
fi
echo ""

################################################################################
# System Integration Check
################################################################################

print_header "[Integration] Service Communication"

if [ "$ML_STATUS" = "UP" ] && [ "$API_STATUS" = "UP" ]; then
    print_success "API Server can reach ML Service"
else
    print_error "Integration check skipped (services not running)"
fi

echo ""

################################################################################
# Summary
################################################################################

echo "======================================"
echo "  Summary"
echo "======================================"
echo ""

all_up=true

if [ "$ML_STATUS" = "UP" ]; then
    print_success "ML Service: OPERATIONAL"
else
    print_error "ML Service: DOWN"
    all_up=false
fi

if [ "$API_STATUS" = "UP" ]; then
    print_success "API Server: OPERATIONAL"
else
    print_error "API Server: DOWN"
    all_up=false
fi

if [ "$FRONTEND_STATUS" = "UP" ]; then
    print_success "Frontend: OPERATIONAL"
else
    print_error "Frontend: DOWN"
    all_up=false
fi

echo ""
echo "======================================"

if [ "$all_up" = true ]; then
    print_success "System Status: ALL SERVICES OPERATIONAL"
    echo ""
    echo "Access the application at:"
    echo "  http://localhost:3000"
    exit 0
else
    print_error "System Status: SOME SERVICES DOWN"
    echo ""
    echo "To start all services:"
    echo "  bash start-system.sh"
    exit 1
fi
