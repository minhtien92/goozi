#!/usr/bin/env bash
set -euo pipefail

# Quick fix: Reset postgres password to match .env
# Usage: ./scripts/quick-fix-db-password.sh

echo "🔐 Quick Fix: Reset PostgreSQL Password"
echo "========================================="
echo ""

# Load .env
if [ -f .env ]; then
    source .env 2>/dev/null || true
fi

NEW_PASSWORD="${DB_PASSWORD:-postgres}"
CONTAINER_DB="goozi-postgres"

echo "Target password: $NEW_PASSWORD"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_DB}$"; then
    echo "❌ Postgres container not running!"
    echo "Starting postgres..."
    docker-compose up -d postgres
    sleep 10
fi

echo "🔧 Attempting to reset password..."

# Method 1: Try connecting without password (trust auth)
if docker exec "$CONTAINER_DB" psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';" 2>/dev/null; then
    echo "✅ Password reset successful (method 1: trust auth)"
elif docker exec -e PGPASSWORD="" "$CONTAINER_DB" psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';" 2>/dev/null; then
    echo "✅ Password reset successful (method 2: empty password)"
else
    # Method 3: Try with old password from env
    OLD_PASS="${DB_PASSWORD:-postgres}"
    if PGPASSWORD="$OLD_PASS" docker exec -e PGPASSWORD="$OLD_PASS" "$CONTAINER_DB" psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';" 2>/dev/null; then
        echo "✅ Password reset successful (method 3: old password)"
    else
        echo "❌ Cannot reset password automatically"
        echo ""
        echo "Try manually:"
        echo "   docker exec -it $CONTAINER_DB psql -U postgres"
        echo "   ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';"
        echo "   \\q"
        echo ""
        echo "Or recreate postgres volume (⚠️  WILL DELETE DATA):"
        echo "   docker-compose down"
        echo "   docker volume rm goozi_postgres_data"
        echo "   docker-compose up -d"
        exit 1
    fi
fi

# Verify
echo ""
echo "🔍 Verifying new password..."
sleep 2

if PGPASSWORD="$NEW_PASSWORD" docker exec -e PGPASSWORD="$NEW_PASSWORD" "$CONTAINER_DB" psql -U postgres -d "${DB_NAME:-goozi_db}" -c "SELECT 1;" &> /dev/null; then
    echo "✅ Password verified!"
    echo ""
    echo "🔄 Restarting backend..."
    docker-compose restart backend
    echo ""
    echo "✅ Done! Backend should now connect to database."
    echo ""
    echo "📝 Check logs: docker-compose logs -f backend"
else
    echo "⚠️  Password reset but verification failed"
    echo "   Please check manually or recreate volume"
    exit 1
fi
