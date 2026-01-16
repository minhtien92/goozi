#!/usr/bin/env bash
set -euo pipefail

# Setup automated backup using cron
# Usage: ./scripts/backup/setup-auto-backup.sh [mode] [schedule] [retention-days]
# mode: dev (default) or prod
# schedule: daily (default), weekly, or custom cron expression
# retention-days: number of days to keep backups (default: 7)

MODE=${1:-prod}
SCHEDULE=${2:-daily}
RETENTION_DAYS=${3:-7}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-with-retention.sh"

echo "🤖 Setup Automated Backup"
echo "=========================="
echo "Mode: $MODE"
echo "Schedule: $SCHEDULE"
echo "Retention: $RETENTION_DAYS days"
echo ""

# Check if running as root (for system-wide cron)
if [ "$EUID" -eq 0 ]; then
    CRON_USER="root"
    CRON_FILE="/etc/cron.d/goozi-backup"
    echo "⚠️  Running as root - will create system-wide cron job"
else
    CRON_USER="$USER"
    CRON_FILE=""
    echo "ℹ️  Running as user - will create user cron job"
fi

# Determine cron schedule
case "$SCHEDULE" in
    daily)
        CRON_SCHEDULE="0 2 * * *"  # 2 AM daily
        SCHEDULE_DESC="Daily at 2:00 AM"
        ;;
    weekly)
        CRON_SCHEDULE="0 2 * * 0"  # 2 AM every Sunday
        SCHEDULE_DESC="Weekly on Sunday at 2:00 AM"
        ;;
    hourly)
        CRON_SCHEDULE="0 * * * *"  # Every hour
        SCHEDULE_DESC="Every hour"
        ;;
    *)
        # Custom cron expression
        CRON_SCHEDULE="$SCHEDULE"
        SCHEDULE_DESC="Custom: $SCHEDULE"
        ;;
esac

# Check if backup script exists and is executable
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

chmod +x "$BACKUP_SCRIPT"

# Create log directory
mkdir -p "$PROJECT_DIR/logs"

# Build cron command
CRON_CMD="cd $PROJECT_DIR && $BACKUP_SCRIPT $MODE $RETENTION_DAYS >> logs/backup.log 2>&1"

# Create cron entry
CRON_ENTRY="$CRON_SCHEDULE $CRON_CMD"

echo "📋 Cron Entry:"
echo "   $CRON_ENTRY"
echo ""
echo "   Schedule: $SCHEDULE_DESC"
echo "   Script: $BACKUP_SCRIPT"
echo "   Log: $PROJECT_DIR/logs/backup.log"
echo ""

read -p "Add this cron job? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Add to crontab
if [ -n "$CRON_FILE" ]; then
    # System-wide cron (requires root)
    echo "$CRON_ENTRY" | tee "$CRON_FILE" > /dev/null
    chmod 644 "$CRON_FILE"
    echo "✅ System-wide cron job created: $CRON_FILE"
    echo ""
    echo "📝 To remove: sudo rm $CRON_FILE"
else
    # User cron
    (crontab -l 2>/dev/null | grep -v "goozi.*backup-with-retention" || true; echo "$CRON_ENTRY") | crontab -
    echo "✅ User cron job added"
    echo ""
    echo "📝 To view: crontab -l"
    echo "📝 To remove: crontab -e (then delete the line)"
fi

echo ""
echo "✅ Automated backup setup complete!"
echo ""
echo "📊 To test backup manually:"
echo "   $BACKUP_SCRIPT $MODE $RETENTION_DAYS"
echo ""
echo "📝 To view logs:"
echo "   tail -f $PROJECT_DIR/logs/backup.log"
echo ""
