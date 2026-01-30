#!/usr/bin/env bash
set -euo pipefail

# Restore PostgreSQL database from a backup file (.sql or .sql.gz)
# Usage: ./scripts/backup/restore-database.sh <backup-file> [mode]
# Example: ./scripts/backup/restore-database.sh backups/database/db_20240115_120000.sql.gz prod
#
# WARNING: This drops the current database and recreates it, then restores from backup.
# Ensure no critical connections are active. Back up current state first if needed.

if [ $# -lt 1 ]; then
    echo "❌ Usage: $0 <backup-file> [mode]"
    echo "   backup-file: path to .sql or .sql.gz (e.g. backups/database/db_20240115_120000.sql.gz)"
    echo "   mode: dev (default) or prod"
    echo ""
    echo "   List backups: ls -la backups/database/"
    exit 1
fi

BACKUP_FILE="$1"
MODE=${2:-dev}
DB_NAME="${DB_NAME:-goozi_db}"
DB_USER="${DB_USER:-postgres}"

if [ "$MODE" = "prod" ]; then
    CONTAINER_DB="goozi-postgres"
else
    CONTAINER_DB="goozi-postgres-dev"
fi

echo "📥 Restore Database"
echo "==================="
echo "Mode: $MODE"
echo "Backup file: $BACKUP_FILE"
echo "Container: $CONTAINER_DB"
echo "Database: $DB_NAME"
echo ""

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    echo "   List available: ls -la backups/database/"
    exit 1
fi

# Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_DB}$"; then
    echo "❌ Database container '$CONTAINER_DB' is not running. Start it first (e.g. docker compose up -d postgres)."
    exit 1
fi

echo "⚠️  This will DROP the current database '$DB_NAME' and restore from backup."
read -p "Continue? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🛑 Dropping and recreating database..."
# Use WITH (FORCE) on Postgres 13+ to drop even with active connections
docker exec "$CONTAINER_DB" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE);" 2>/dev/null || \
  docker exec "$CONTAINER_DB" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker exec "$CONTAINER_DB" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

echo "📦 Restoring from backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_DB" psql -U "$DB_USER" "$DB_NAME" > /dev/null
else
    docker exec -i "$CONTAINER_DB" psql -U "$DB_USER" "$DB_NAME" < "$BACKUP_FILE" > /dev/null
fi

echo "✅ Database restored successfully from $BACKUP_FILE"
echo ""
echo "💡 Restart backend if it's running: docker compose restart backend"
echo ""
