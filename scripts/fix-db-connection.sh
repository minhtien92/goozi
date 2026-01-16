#!/usr/bin/env bash
set -euo pipefail

# Fix database connection issues
# Usage: ./scripts/fix-db-connection.sh [mode]
# mode: dev (default) or prod

MODE=${1:-prod}

if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.yml"
    CONTAINER_DB="goozi-postgres"
    CONTAINER_BACKEND="goozi-backend"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_DB="goozi-postgres-dev"
    CONTAINER_BACKEND="goozi-backend-dev"
fi

echo "🔧 Fix Database Connection"
echo "=========================="
echo "Mode: $MODE"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from template..."
    
    cat > .env << EOF
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=goozi_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# CORS
FRONTEND_URL=http://localhost:3000
CMS_URL=http://localhost:3002

# Google OAuth
GOOGLE_CLIENT_ID=

# Frontend Build Args
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=
EOF
    echo "✅ Created .env file with default values"
    echo ""
fi

# Load .env
source .env 2>/dev/null || true

# Check database credentials
echo "📋 Database Configuration:"
echo "   DB_HOST: ${DB_HOST:-postgres}"
echo "   DB_PORT: ${DB_PORT:-5432}"
echo "   DB_NAME: ${DB_NAME:-goozi_db}"
echo "   DB_USER: ${DB_USER:-postgres}"
echo "   DB_PASSWORD: ${DB_PASSWORD:-[not set]}"
echo ""

# Check if postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_DB}$"; then
    echo "⚠️  Postgres container not running. Starting..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres
    echo "⏳ Waiting for postgres to be ready..."
    sleep 10
fi

# Test connection with password from env
echo "🔍 Testing database connection..."
DB_PASS="${DB_PASSWORD:-postgres}"

# Try to connect with password
if PGPASSWORD="$DB_PASS" docker exec -e PGPASSWORD="$DB_PASS" "$CONTAINER_DB" psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-goozi_db}" -c "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed with password from .env"
    echo ""
    echo "🔧 Attempting to fix..."
    
    # Check if we can connect without password (old setup)
    if docker exec "$CONTAINER_DB" psql -U postgres -d postgres -c "SELECT 1;" &> /dev/null 2>&1; then
        echo "⚠️  Can connect without password. Resetting password..."
        docker exec "$CONTAINER_DB" psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
        echo "✅ Password reset. Testing again..."
        sleep 2
    fi
    
    # Test again
    if PGPASSWORD="$DB_PASS" docker exec -e PGPASSWORD="$DB_PASS" "$CONTAINER_DB" psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-goozi_db}" -c "SELECT 1;" &> /dev/null; then
        echo "✅ Database connection successful after fix!"
    else
        echo "❌ Still failing. You may need to:"
        echo ""
        echo "Option 1: Reset postgres password manually"
        echo "   docker exec -it $CONTAINER_DB psql -U postgres"
        echo "   ALTER USER postgres WITH PASSWORD '$DB_PASS';"
        echo ""
        echo "Option 2: Recreate postgres volume (⚠️  WILL DELETE DATA)"
        echo "   docker-compose -f $COMPOSE_FILE down"
        if [ "$MODE" = "prod" ]; then
            echo "   docker volume rm goozi_postgres_data"
        else
            echo "   docker volume rm goozi_postgres_data_dev"
        fi
        echo "   docker-compose -f $COMPOSE_FILE up -d postgres"
        echo "   # Wait for postgres to be ready, then:"
        echo "   docker-compose -f $COMPOSE_FILE up -d backend"
        exit 1
    fi
fi

# Restart backend to apply changes
echo ""
echo "🔄 Restarting backend container..."
docker-compose -f "$COMPOSE_FILE" restart backend

echo ""
echo "✅ Done! Backend should now be able to connect to database."
echo ""
