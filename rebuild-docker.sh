#!/bin/bash

# Script to rebuild Docker containers individually
# Usage: ./rebuild-docker.sh [service] [mode]
# service: backend, web, cms, all (default: all)
# mode: dev, prod (default: dev)

SERVICE=${1:-all}
MODE=${2:-dev}

if [ "$MODE" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    COMPOSE_PREFIX="dev"
else
    COMPOSE_FILE="docker-compose.yml"
    COMPOSE_PREFIX=""
fi

echo "========================================"
echo "Rebuilding Docker Container(s)"
echo "========================================"
echo "Service: $SERVICE"
echo "Mode: $MODE"
echo "Compose File: $COMPOSE_FILE"
echo "========================================"
echo ""

# Function to rebuild and restart a service
rebuild_service() {
    local service=$1
    local service_name=$(echo $service | tr '[:lower:]' '[:upper:]')
    
    echo "Rebuilding $service_name service..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache "$service"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] $service_name build failed!"
        exit 1
    fi
    
    echo ""
    echo "Restarting $service_name service..."
    docker-compose -f "$COMPOSE_FILE" up -d "$service"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Failed to restart $service_name!"
        exit 1
    fi
    
    echo ""
    echo "[SUCCESS] $service_name rebuilt and restarted!"
}

# Main logic
case "$SERVICE" in
    all)
        echo "Rebuilding ALL services..."
        docker-compose -f "$COMPOSE_FILE" build --no-cache
        
        if [ $? -ne 0 ]; then
            echo ""
            echo "[ERROR] Build failed!"
            exit 1
        fi
        
        echo ""
        echo "Restarting all services..."
        docker-compose -f "$COMPOSE_FILE" up -d
        
        if [ $? -ne 0 ]; then
            echo ""
            echo "[ERROR] Failed to restart services!"
            exit 1
        fi
        
        echo ""
        echo "[SUCCESS] All services rebuilt and restarted!"
        ;;
    backend)
        rebuild_service "backend"
        ;;
    web)
        rebuild_service "web"
        ;;
    cms)
        rebuild_service "cms"
        ;;
    *)
        echo "[ERROR] Invalid service: $SERVICE"
        echo ""
        echo "Usage: ./rebuild-docker.sh [service] [mode]"
        echo ""
        echo "Services: backend, web, cms, all"
        echo "Modes: dev (default), prod"
        echo ""
        echo "Examples:"
        echo "  ./rebuild-docker.sh backend dev"
        echo "  ./rebuild-docker.sh web"
        echo "  ./rebuild-docker.sh all prod"
        echo ""
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "View logs with:"
echo "  docker-compose -f $COMPOSE_FILE logs -f $SERVICE"
echo "========================================"

