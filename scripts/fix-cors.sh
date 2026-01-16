#!/usr/bin/env bash
set -euo pipefail

# Fix CORS issues by rebuilding backend and updating Nginx
# Usage: ./scripts/fix-cors.sh [mode]
# mode: dev (default) or prod

MODE=${1:-prod}

if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.yml"
    CONTAINER_BACKEND="goozi-backend"
    NGINX_CONF="/etc/nginx/sites-available/goozi"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_BACKEND="goozi-backend-dev"
    NGINX_CONF=""
fi

echo "🔧 Fix CORS Issues"
echo "=================="
echo "Mode: $MODE"
echo ""

# Check if backend container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_BACKEND}$"; then
    echo "⚠️  Backend container not found. Building..."
    docker-compose -f "$COMPOSE_FILE" build backend
    docker-compose -f "$COMPOSE_FILE" up -d backend
    echo "✅ Backend container created and started"
    exit 0
fi

# Rebuild backend with new CORS config
echo "🔨 Rebuilding backend container..."
docker-compose -f "$COMPOSE_FILE" build --no-cache backend

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔄 Restarting backend..."
docker-compose -f "$COMPOSE_FILE" up -d backend

echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_BACKEND}$"; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend container not running. Checking logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50 backend
    exit 1
fi

# Update Nginx config if production
if [ "$MODE" = "prod" ] && [ -f "$NGINX_CONF" ]; then
    echo ""
    echo "📝 Updating Nginx config for CORS..."
    
    # Backup current config
    cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Check if CORS headers already exist
    if ! grep -q "Access-Control-Allow-Origin" "$NGINX_CONF"; then
        echo "⚠️  Nginx config needs CORS headers. Please update manually:"
        echo "   File: $NGINX_CONF"
        echo "   Add CORS headers to API server block (see devops/setup-nginx.sh)"
        echo ""
        echo "   Then run: sudo nginx -t && sudo systemctl reload nginx"
    else
        echo "✅ Nginx config already has CORS headers"
        echo "🔄 Reloading Nginx..."
        sudo nginx -t && sudo systemctl reload nginx
    fi
fi

echo ""
echo "✅ CORS fix complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check backend logs: docker-compose -f $COMPOSE_FILE logs -f backend"
echo "   2. Test API: curl -I http://api.goozi.org/api/health"
echo "   3. Check CORS headers: curl -H 'Origin: http://cms.goozi.org' -H 'Access-Control-Request-Method: GET' -X OPTIONS http://api.goozi.org/api/topics -v"
echo ""
