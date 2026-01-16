#!/usr/bin/env bash
set -euo pipefail

# Reset PostgreSQL password to match .env
# Usage: ./scripts/reset-postgres-password.sh [mode] [new-password]
# mode: dev (default) or prod
# new-password: optional, defaults to DB_PASSWORD from .env

MODE=${1:-prod}
NEW_PASSWORD=${2:-}

if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.yml"
    CONTAINER_DB="goozi-postgres"
    VOLUME_NAME="goozi_postgres_data"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_DB="goozi-postgres-dev"
    VOLUME_NAME="goozi_postgres_data_dev"
fi

echo "🔐 Reset PostgreSQL Password"
echo "============================="
echo "Mode: $MODE"
echo ""

# Load .env
if [ -f .env ]; then
    source .env 2>/dev/null || true
fi

# Get password
if [ -z "$NEW_PASSWORD" ]; then
    NEW_PASSWORD="${DB_PASSWORD:-postgres}"
fi

echo "New password: ${NEW_PASSWORD:0:1}*** (hidden)"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_DB}$"; then
    echo "⚠️  Postgres container not running. Starting..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres
    echo "⏳ Waiting for postgres to be ready..."
    sleep 10
fi

# Try to connect and reset password
echo "🔧 Resetting password..."

# Method 1: Try connecting without password (trust auth - most common)
if docker exec "$CONTAINER_DB" psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';" &> /dev/null 2>&1; then
    echo "✅ Password reset successful! (trust auth)"
elif docker exec -e PGPASSWORD="" "$CONTAINER_DB" psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';" &> /dev/null 2>&1; then
    echo "✅ Password reset successful! (empty password)"
elif docker exec -e PGPASSWORD="${DB_PASSWORD:-postgres}" "$CONTAINER_DB" psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';" &> /dev/null 2>&1; then
    echo "✅ Password reset successful! (env password)"
else
    echo "⚠️  Cannot reset password automatically."
    echo ""
    echo "Try manually:"
    echo "   docker exec -it $CONTAINER_DB psql -U postgres"
    echo "   ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';"
    echo ""
    echo "Or if that doesn't work, you may need to:"
    echo "   1. Stop containers: docker-compose -f $COMPOSE_FILE down"
    echo "   2. Remove volume: docker volume rm $VOLUME_NAME"
    echo "   3. Start again: docker-compose -f $COMPOSE_FILE up -d"
    exit 1
fi

# Test new password
echo ""
echo "🔍 Testing new password..."
sleep 2

if PGPASSWORD="$NEW_PASSWORD" docker exec -e PGPASSWORD="$NEW_PASSWORD" "$CONTAINER_DB" psql -U postgres -d "${DB_NAME:-goozi_db}" -c "SELECT 1;" &> /dev/null; then
    echo "✅ Password reset and verified!"
    echo ""
    echo "🔄 Restarting backend..."
    docker-compose -f "$COMPOSE_FILE" restart backend
    echo ""
    echo "✅ Done! Backend should now be able to connect."
else
    echo "❌ Password reset but test failed. Please check manually."
    exit 1
fi
