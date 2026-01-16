#!/usr/bin/env bash
set -euo pipefail

# Check backup status and show recent backups
# Usage: ./scripts/backup/check-backup-status.sh

echo "📊 Backup Status"
echo "================"
echo ""

# Check if cron job exists
echo "🤖 Automated Backup:"
if [ -f "/etc/cron.d/goozi-backup" ]; then
    echo "   ✅ System-wide cron job found"
    echo "   📋 Schedule:"
    cat /etc/cron.d/goozi-backup | grep -v "^#" | sed 's/^/      /'
elif crontab -l 2>/dev/null | grep -q "goozi.*backup-with-retention"; then
    echo "   ✅ User cron job found"
    echo "   📋 Schedule:"
    crontab -l 2>/dev/null | grep "goozi.*backup-with-retention" | sed 's/^/      /'
else
    echo "   ⚠️  No automated backup configured"
    echo "   💡 Setup: ./scripts/backup/setup-auto-backup.sh"
fi

echo ""

# Check backup directory
BACKUP_DIR="./backups"
if [ ! -d "$BACKUP_DIR" ]; then
    echo "⚠️  Backup directory not found: $BACKUP_DIR"
    exit 0
fi

# Database backups
echo "💾 Database Backups:"
DB_DIR="$BACKUP_DIR/database"
if [ -d "$DB_DIR" ] && [ "$(ls -A $DB_DIR/*.sql.gz 2>/dev/null)" ]; then
    COUNT=$(ls -1 "$DB_DIR"/*.sql.gz 2>/dev/null | wc -l)
    LATEST=$(ls -t "$DB_DIR"/*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
        SIZE=$(du -h "$LATEST" | cut -f1)
        DATE=$(stat -c %y "$LATEST" 2>/dev/null || stat -f "%Sm" "$LATEST" 2>/dev/null || echo "unknown")
        echo "   Total: $COUNT backups"
        echo "   Latest: $(basename "$LATEST") ($SIZE, $DATE)"
    fi
else
    echo "   ⚠️  No database backups found"
fi

echo ""

# Uploads backups
echo "📦 Uploads Backups:"
UPLOADS_DIR="$BACKUP_DIR/uploads"
if [ -d "$UPLOADS_DIR" ] && [ "$(ls -A $UPLOADS_DIR/*.tar.gz 2>/dev/null)" ]; then
    COUNT=$(ls -1 "$UPLOADS_DIR"/*.tar.gz 2>/dev/null | wc -l)
    LATEST=$(ls -t "$UPLOADS_DIR"/*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
        SIZE=$(du -h "$LATEST" | cut -f1)
        DATE=$(stat -c %y "$LATEST" 2>/dev/null || stat -f "%Sm" "$LATEST" 2>/dev/null || echo "unknown")
        echo "   Total: $COUNT backups"
        echo "   Latest: $(basename "$LATEST") ($SIZE, $DATE)"
    fi
else
    echo "   ⚠️  No uploads backups found"
fi

echo ""

# Check backup log
LOG_FILE="./logs/backup.log"
if [ -f "$LOG_FILE" ]; then
    echo "📝 Recent Backup Logs:"
    if [ -s "$LOG_FILE" ]; then
        tail -5 "$LOG_FILE" | sed 's/^/   /'
    else
        echo "   (empty)"
    fi
else
    echo "📝 Backup Log: Not found"
fi

echo ""
