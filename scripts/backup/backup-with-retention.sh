#!/usr/bin/env bash
set -euo pipefail

# Backup script with automatic retention
# Keeps last 7 days of backups, deletes older ones
# Usage: ./scripts/backup/backup-with-retention.sh [mode] [retention-days]

MODE=${1:-prod}
RETENTION_DAYS=${2:-7}
BACKUP_DIR="./backups"

echo "💾 Backup with Retention"
echo "========================="
echo "Mode: $MODE"
echo "Retention: $RETENTION_DAYS days"
echo ""

# Run full backup
"$(dirname "$0")/backup-all.sh" "$MODE"

# Cleanup old backups
echo ""
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."

# Cleanup uploads
DELETED_UPLOADS=$(find "$BACKUP_DIR/uploads" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)
if [ "$DELETED_UPLOADS" -gt 0 ]; then
    echo "  ✅ Deleted $DELETED_UPLOADS old upload backups"
fi

# Cleanup database
DELETED_DB=$(find "$BACKUP_DIR/database" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)
if [ "$DELETED_DB" -gt 0 ]; then
    echo "  ✅ Deleted $DELETED_DB old database backups"
fi

# Show remaining backups
echo ""
echo "📊 Remaining backups:"
echo "  Uploads: $(ls -1 "$BACKUP_DIR/uploads"/*.tar.gz 2>/dev/null | wc -l) files"
echo "  Database: $(ls -1 "$BACKUP_DIR/database"/*.sql.gz 2>/dev/null | wc -l) files"
