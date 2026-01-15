#!/bin/bash
# Internal script to rebuild a single service
# Usage: rebuild-service.sh <service> <mode> <compose-file>

SERVICE=$1
MODE=$2
COMPOSE_FILE=$3

if [ -z "$SERVICE" ] || [ -z "$MODE" ] || [ -z "$COMPOSE_FILE" ]; then
    echo "❌ Missing arguments"
    exit 1
fi

SERVICE_NAME=$(echo "$SERVICE" | tr '[:lower:]' '[:upper:]')

echo "🔨 Rebuilding $SERVICE_NAME ($MODE mode)..."
if ! docker-compose -f "$COMPOSE_FILE" build --no-cache "$SERVICE"; then
    echo "❌ $SERVICE_NAME build failed!"
    exit 1
fi

echo "🔄 Restarting $SERVICE_NAME..."
if ! docker-compose -f "$COMPOSE_FILE" up -d "$SERVICE"; then
    echo "❌ Failed to restart $SERVICE_NAME!"
    exit 1
fi

echo "✅ $SERVICE_NAME rebuilt and restarted successfully!"
exit 0
