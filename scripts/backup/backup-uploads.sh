#!/usr/bin/env bash
set -euo pipefail

# Backup script for uploads (supports both bind mount and volume)
# Usage: ./scripts/backup/backup-uploads.sh [mode]
# mode: dev (default) or prod

MODE=${1:-dev}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/uploads"
UPLOADS_DIR="/home/goozi_upload"

if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.yml"
    CONTAINER_NAME="goozi-backend"
    USE_BIND_MOUNT=true  # Production uses bind mount
else
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_NAME="goozi-backend-dev"
    USE_BIND_MOUNT=false  # Development uses volume
fi

# Detect volume name from docker-compose
# Docker Compose creates volumes as: <project>_<volume_name>
# Try to find the actual volume name
PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]_')
VOLUME_NAME="${PROJECT_NAME}_backend_uploads"

# Alternative: try to find volume from container
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Get volume name from running container
    ACTUAL_VOLUME=$(docker inspect "${CONTAINER_NAME}" --format '{{range .Mounts}}{{if eq .Destination "/app/uploads"}}{{.Name}}{{end}}{{end}}' 2>/dev/null)
    if [ -n "$ACTUAL_VOLUME" ]; then
        VOLUME_NAME="$ACTUAL_VOLUME"
    fi
fi

echo "📦 Backup Uploads"
echo "=================="
echo "Mode: $MODE"
echo "Volume: $VOLUME_NAME"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Check if using bind mount (Production only)
if [ "$USE_BIND_MOUNT" = "true" ] && [ -d "$UPLOADS_DIR" ]; then
    echo "📁 Using bind mount: $UPLOADS_DIR"
    echo "📦 Creating backup from bind mount..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Create tar archive directly from bind mount
    cd "$(dirname "$UPLOADS_DIR")"
    tar -czf "$(pwd)/$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C "$(basename "$UPLOADS_DIR")" .
    cd - > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup created successfully!"
        echo "📁 Location: $BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
        
        if [ -f "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" ]; then
            SIZE=$(du -h "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" | cut -f1)
            echo "📊 Size: $SIZE"
        fi
        
        # List recent backups
        echo ""
        echo "📋 Recent backups:"
        ls -lht "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -5 || echo "  No previous backups"
        exit 0
    else
        echo "❌ Backup failed!"
        exit 1
    fi
fi

# Fallback: Check if volume exists (for migration period)
if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    echo "⚠️  Volume $VOLUME_NAME not found. Creating backup from container..."
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "📦 Creating backup from container $CONTAINER_NAME..."
        mkdir -p "$BACKUP_DIR"
        
        docker cp "${CONTAINER_NAME}:/app/uploads" "$BACKUP_DIR/uploads_${TIMESTAMP}"
        
        # Create tar archive
        cd "$BACKUP_DIR"
        tar -czf "uploads_${TIMESTAMP}.tar.gz" "uploads_${TIMESTAMP}"
        rm -rf "uploads_${TIMESTAMP}"
        cd - > /dev/null
        
        echo "✅ Backup created: $BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
        exit 0
    else
        echo "❌ Container $CONTAINER_NAME is not running!"
        exit 1
    fi
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create temporary container to access volume
TEMP_CONTAINER="backup-uploads-${TIMESTAMP}"

echo "🔨 Creating temporary container..."
docker run --rm \
    -v "$VOLUME_NAME:/data" \
    -v "$(pwd)/$BACKUP_DIR:/backup" \
    alpine:latest \
    tar -czf "/backup/uploads_${TIMESTAMP}.tar.gz" -C /data .

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully!"
    echo "📁 Location: $BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
    
    # Show backup size
    if [ -f "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" ]; then
        SIZE=$(du -h "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" | cut -f1)
        echo "📊 Size: $SIZE"
    fi
    
    # List recent backups
    echo ""
    echo "📋 Recent backups:"
    ls -lht "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -5 || echo "  No previous backups"
else
    echo "❌ Backup failed!"
    exit 1
fi
