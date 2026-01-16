#!/usr/bin/env bash
set -euo pipefail

# Restore script for uploads volume
# Usage: ./scripts/backup/restore-uploads.sh <backup-file> [mode]
# Example: ./scripts/backup/restore-uploads.sh backups/uploads/uploads_20240115_120000.tar.gz prod

if [ $# -lt 1 ]; then
    echo "❌ Usage: $0 <backup-file> [mode]"
    echo "   mode: dev (default) or prod"
    exit 1
fi

BACKUP_FILE="$1"
MODE=${2:-dev}
VOLUME_NAME="goozi_backend_uploads"

if [ "$MODE" = "prod" ]; then
    VOLUME_NAME="goozi_backend_uploads"
    COMPOSE_FILE="docker-compose.yml"
    CONTAINER_NAME="goozi-backend"
else
    VOLUME_NAME="goozi_backend_uploads"
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_NAME="goozi-backend-dev"
fi

echo "📥 Restore Uploads"
echo "==================="
echo "Mode: $MODE"
echo "Backup file: $BACKUP_FILE"
echo "Volume: $VOLUME_NAME"
echo ""

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Confirm before restore
echo "⚠️  WARNING: This will replace all current uploads!"
read -p "Are you sure you want to continue? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Check if using bind mount (Production only)
UPLOADS_DIR="/home/goozi_upload"
USE_BIND_MOUNT=false
if [ "$MODE" = "prod" ]; then
    USE_BIND_MOUNT=true
fi

if [ "$USE_BIND_MOUNT" = "true" ] && [ -d "$UPLOADS_DIR" ]; then
    echo "📁 Using bind mount: $UPLOADS_DIR"
    echo "🔨 Restoring to bind mount..."
    
    # Create directory if not exists
    sudo mkdir -p "$UPLOADS_DIR/images"
    sudo mkdir -p "$UPLOADS_DIR/audio"
    
    # Extract backup directly to bind mount
    tar -xzf "$(pwd)/$BACKUP_FILE" -C "$UPLOADS_DIR"
    
    # Set permissions
    sudo chown -R 1000:1000 "$UPLOADS_DIR" 2>/dev/null || true
    sudo chmod -R 755 "$UPLOADS_DIR" 2>/dev/null || true
    
    if [ $? -eq 0 ]; then
        echo "✅ Restore completed successfully!"
        
        # Set permissions
        chmod -R 755 "$UPLOADS_DIR" 2>/dev/null || true
        
        # Restart container if it was running
        if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "🔄 Restarting container..."
            docker-compose -f "$COMPOSE_FILE" start backend 2>/dev/null || \
            docker-compose -f "$COMPOSE_FILE" up -d backend
        fi
        exit 0
    else
        echo "❌ Restore failed!"
        exit 1
    fi
fi

# Fallback: Use volume (for migration period)
# Check if volume exists, create if not
if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    echo "📦 Creating volume $VOLUME_NAME..."
    docker volume create "$VOLUME_NAME"
fi

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Container $CONTAINER_NAME is running. Stopping it..."
    docker-compose -f "$COMPOSE_FILE" stop backend 2>/dev/null || true
    sleep 2
fi

echo "🔨 Restoring from backup to volume..."

# Method 1: Using temporary container (preferred)
TEMP_CONTAINER="restore-uploads-$(date +%s)"

docker run --rm \
    -v "$VOLUME_NAME:/data" \
    -v "$(pwd)/$BACKUP_FILE:/backup.tar.gz:ro" \
    alpine:latest \
    sh -c "rm -rf /data/* /data/.* 2>/dev/null; tar -xzf /backup.tar.gz -C /data"

if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully!"
    
    # Restart container if it was running
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "🔄 Restarting container..."
        docker-compose -f "$COMPOSE_FILE" start backend 2>/dev/null || \
        docker-compose -f "$COMPOSE_FILE" up -d backend
    fi
else
    echo "❌ Restore failed!"
    exit 1
fi
