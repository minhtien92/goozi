#!/usr/bin/env bash
set -euo pipefail

# Remove automated backup cron job
# Usage: ./scripts/backup/remove-auto-backup.sh

echo "🗑️  Remove Automated Backup"
echo "==========================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    CRON_FILE="/etc/cron.d/goozi-backup"
    if [ -f "$CRON_FILE" ]; then
        echo "Found system-wide cron job: $CRON_FILE"
        read -p "Remove it? [y/N]: " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            rm -f "$CRON_FILE"
            echo "✅ Removed system-wide cron job"
        else
            echo "❌ Cancelled"
        fi
    else
        echo "ℹ️  No system-wide cron job found"
    fi
else
    # User cron
    if crontab -l 2>/dev/null | grep -q "goozi.*backup-with-retention"; then
        echo "Found user cron job"
        read -p "Remove it? [y/N]: " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            crontab -l 2>/dev/null | grep -v "goozi.*backup-with-retention" | crontab -
            echo "✅ Removed user cron job"
        else
            echo "❌ Cancelled"
        fi
    else
        echo "ℹ️  No user cron job found"
    fi
fi

echo ""
