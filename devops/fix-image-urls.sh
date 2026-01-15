#!/usr/bin/env bash
set -euo pipefail

# Fix incorrect image URLs in database
# Usage: sudo bash devops/fix-image-urls.sh

echo "==> Fixing incorrect image URLs in database..."

cd "$(dirname "$0")/.." || exit 1

# Check if docker-compose is available
if ! command -v docker-compose &>/dev/null; then
  echo "[ERROR] docker-compose not found"
  exit 1
fi

# Check if postgres container is running
if ! docker-compose ps postgres | grep -q "Up"; then
  echo "[ERROR] PostgreSQL container is not running"
  exit 1
fi

# Run SQL fix script
echo "==> Running SQL fix script..."
docker-compose exec -T postgres psql -U postgres -d goozi_db < devops/fix-image-urls.sql

echo ""
echo "[OK] Image URLs have been fixed in database."
echo "Please refresh your CMS/Web pages to see the updated images."
