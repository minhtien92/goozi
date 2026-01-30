#!/usr/bin/env bash
set -euo pipefail

# Backup PostgreSQL database only (no uploads)
# Usage: ./scripts/backup/backup-database.sh [mode]
# mode: dev (default) or prod
# Output: backups/database/db_YYYYMMDD_HHMMSS.sql.gz

MODE=${1:-dev}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_BACKUP_DIR="$BACKUP_DIR/database"
DB_NAME="${DB_NAME:-goozi_db}"
DB_USER="${DB_USER:-postgres}"

if [ "$MODE" = "prod" ]; then
    CONTAINER_DB="goozi-postgres"
else
    CONTAINER_DB="goozi-postgres-dev"
fi

echo "💾 Database Backup Only"
echo "======================="
echo "Mode: $MODE"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    exit 1
fi

mkdir -p "$DB_BACKUP_DIR"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_DB}$"; then
    echo "❌ Database container '$CONTAINER_DB' is not running."
    exit 1
fi

echo "📦 Backing up database..."
docker exec "$CONTAINER_DB" pg_dump -U "$DB_USER" "$DB_NAME" > "$DB_BACKUP_DIR/db_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    gzip "$DB_BACKUP_DIR/db_${TIMESTAMP}.sql"
    SIZE=$(du -h "$DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz" | cut -f1)
    echo "✅ Database backup: $DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz ($SIZE)"
    echo ""
    echo "💡 Restore: ./scripts/backup/restore-database.sh $DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz $MODE"
else
    echo "❌ Database backup failed!"
    exit 1
fi
