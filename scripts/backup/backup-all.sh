#!/usr/bin/env bash
set -euo pipefail

# Backup script for database and uploads
# Usage: ./scripts/backup/backup-all.sh [mode]
# mode: dev (default) or prod

MODE=${1:-dev}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_BACKUP_DIR="$BACKUP_DIR/database"
UPLOADS_BACKUP_DIR="$BACKUP_DIR/uploads"

if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.yml"
    DB_NAME="${DB_NAME:-goozi_db}"
    DB_USER="${DB_USER:-postgres}"
    CONTAINER_DB="goozi-postgres"
    CONTAINER_BACKEND="goozi-backend"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    DB_NAME="${DB_NAME:-goozi_db}"
    DB_USER="${DB_USER:-postgres}"
    CONTAINER_DB="goozi-postgres-dev"
    CONTAINER_BACKEND="goozi-backend-dev"
fi

echo "💾 Full Backup (Database + Uploads)"
echo "====================================="
echo "Mode: $MODE"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Create backup directories
mkdir -p "$DB_BACKUP_DIR" "$UPLOADS_BACKUP_DIR"

# Backup Database
echo "📦 Backing up database..."
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_DB}$"; then
    docker exec "$CONTAINER_DB" pg_dump -U "$DB_USER" "$DB_NAME" > "$DB_BACKUP_DIR/db_${TIMESTAMP}.sql"
    
    if [ $? -eq 0 ]; then
        # Compress database backup
        gzip "$DB_BACKUP_DIR/db_${TIMESTAMP}.sql"
        echo "✅ Database backup: $DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
    else
        echo "❌ Database backup failed!"
        exit 1
    fi
else
    echo "⚠️  Database container not running, skipping database backup"
fi

# Backup Uploads
echo ""
echo "📦 Backing up uploads..."
"$(dirname "$0")/backup-uploads.sh" "$MODE"

# Create summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Backup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Timestamp: $TIMESTAMP"
echo ""

if [ -f "$DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz" ]; then
    DB_SIZE=$(du -h "$DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz" | cut -f1)
    echo "✅ Database: $DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz ($DB_SIZE)"
fi

LATEST_UPLOADS=$(ls -t "$UPLOADS_BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1)
if [ -n "$LATEST_UPLOADS" ]; then
    UPLOADS_SIZE=$(du -h "$LATEST_UPLOADS" | cut -f1)
    echo "✅ Uploads: $LATEST_UPLOADS ($UPLOADS_SIZE)"
fi

echo ""
echo "💡 To restore:"
echo "   Database: ./scripts/backup/restore-database.sh $DB_BACKUP_DIR/db_${TIMESTAMP}.sql.gz $MODE"
echo "   Uploads:  ./scripts/backup/restore-uploads.sh $LATEST_UPLOADS $MODE"
echo ""
