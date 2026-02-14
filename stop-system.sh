#!/bin/bash

################################################################################
# KisanMind System Shutdown Script
#
# This script gracefully stops all KisanMind services
#
# Usage: bash stop-system.sh
################################################################################

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[KisanMind]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

stop_service() {
    local pid_file=$1
    local service_name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null
            sleep 2

            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_status "Force stopping $service_name..."
                kill -9 "$pid" 2>/dev/null
            fi

            print_success "$service_name stopped"
        else
            print_status "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_status "No PID file found for $service_name"
    fi
}

################################################################################
# Main Script
################################################################################

clear
echo "======================================"
echo "    KisanMind System Shutdown"
echo "======================================"
echo ""

# Stop Frontend
stop_service "frontend/frontend.pid" "Frontend"

# Stop API Server
stop_service "api-server/api-server.pid" "API Server"

# Stop ML Service
stop_service "services/ml-inference/ml-service.pid" "ML Service"

echo ""
echo "======================================"
print_success "All services stopped"
echo "======================================"
