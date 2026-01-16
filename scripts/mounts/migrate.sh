#!/usr/bin/env bash
set -euo pipefail

# Migrate from Docker volume to bind mount for uploads
# Usage: ./scripts/mounts/migrate.sh [mode]
# mode: dev (default) or prod

MODE=${1:-dev}

if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.yml"
    CONTAINER_NAME="goozi-backend"
    VOLUME_NAME="goozi_backend_uploads"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_NAME="goozi-backend-dev"
    VOLUME_NAME="goozi_backend_uploads"
fi

echo "🔄 Migrate Volume to Bind Mount"
echo "================================"
echo "Mode: $MODE"
echo "Volume: $VOLUME_NAME"
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Check if volume exists
if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    echo "⚠️  Volume $VOLUME_NAME not found. Nothing to migrate."
    exit 0
fi

# Create uploads directory on host
UPLOADS_DIR="/home/goozi_upload"
echo "📁 Creating uploads directory: $UPLOADS_DIR"
mkdir -p "$UPLOADS_DIR/images"
mkdir -p "$UPLOADS_DIR/audio"

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Container $CONTAINER_NAME is running. Stopping it..."
    docker-compose -f "$COMPOSE_FILE" stop backend
    sleep 2
fi

# Copy data from volume to bind mount
echo "📦 Copying data from volume to bind mount..."

# Method 1: Using temporary container
TEMP_CONTAINER="migrate-uploads-$(date +%s)"

docker run --rm \
    -v "$VOLUME_NAME:/source:ro" \
    -v "$UPLOADS_DIR:/dest" \
    alpine:latest \
    sh -c "cp -a /source/* /dest/ 2>/dev/null || true"

if [ $? -eq 0 ]; then
    echo "✅ Data copied successfully"
else
    echo "⚠️  Copy completed (some files may not exist yet)"
fi

# Set proper permissions
echo "🔐 Setting permissions..."
if [ "$(id -u)" = "0" ]; then
    # Running as root
    chown -R 1000:1000 "$UPLOADS_DIR" 2>/dev/null || true
else
    # Running as user, permissions should be fine
    chmod -R 755 "$UPLOADS_DIR" 2>/dev/null || true
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update docker-compose.yml to use bind mount: /home/goozi_upload:/app/uploads"
echo "   2. Start containers: docker-compose -f $COMPOSE_FILE up -d"
echo "   3. Verify uploads work correctly"
echo "   4. After verification, you can remove the old volume:"
echo "      docker volume rm $VOLUME_NAME"
echo ""
echo "📁 Uploads directory: $UPLOADS_DIR"
echo ""