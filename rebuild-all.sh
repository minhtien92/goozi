#!/bin/bash
set -e

echo "🔧 Rebuild all services: backend → cms → web"

# Detect compose file
COMPOSE_FILE=""
if [ -f "docker-compose.dev.yml" ]; then
  COMPOSE_FILE="-f docker-compose.dev.yml"
elif [ -f "docker-compose.yml" ]; then
  COMPOSE_FILE="-f docker-compose.yml"
else
  echo "❌ Không tìm thấy docker-compose file."
  exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "❌ docker-compose chưa được cài đặt."
  exit 1
fi

echo "📦 Building backend..."
docker-compose $COMPOSE_FILE build backend

echo "📦 Building cms..."
docker-compose $COMPOSE_FILE build cms

echo "📦 Building web..."
docker-compose $COMPOSE_FILE build web

echo "✅ Done. Bạn có thể chạy: docker-compose $COMPOSE_FILE up -d"
