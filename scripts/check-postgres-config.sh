#!/bin/bash
# Script to check PostgreSQL configuration in Docker

set -e

CONTAINER_NAME="goozi-postgres"

echo "🔍 Checking PostgreSQL Configuration in Docker"
echo "================================================"
echo ""

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container '${CONTAINER_NAME}' not found!"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Container '${CONTAINER_NAME}' is not running!"
    echo "   Starting container..."
    docker-compose up -d postgres
    sleep 5
fi

echo "📦 Container Information:"
echo "------------------------"
docker ps --filter name=${CONTAINER_NAME} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "🌍 Environment Variables:"
echo "-------------------------"
docker inspect ${CONTAINER_NAME} --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E "POSTGRES_|DB_" | sort
echo ""

echo "🔌 Network Configuration:"
echo "-------------------------"
echo "Network:"
docker inspect ${CONTAINER_NAME} --format '{{range $key, $value := .NetworkSettings.Networks}}{{$key}}{{end}}'
echo ""
echo "IP Address:"
docker inspect ${CONTAINER_NAME} --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
echo ""
echo "Port Mapping:"
docker port ${CONTAINER_NAME} 2>/dev/null || echo "No port mapping"
echo ""

echo "💾 Volume Configuration:"
echo "------------------------"
docker inspect ${CONTAINER_NAME} --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
echo ""

echo "🗄️  Database Configuration:"
echo "---------------------------"
echo "PostgreSQL Version:"
docker exec ${CONTAINER_NAME} psql --version
echo ""
echo "Data Directory:"
docker exec ${CONTAINER_NAME} psql -U postgres -c "SHOW data_directory;" 2>/dev/null || echo "Cannot connect"
echo ""
echo "Config File:"
docker exec ${CONTAINER_NAME} psql -U postgres -c "SHOW config_file;" 2>/dev/null || echo "Cannot connect"
echo ""

echo "👤 Users:"
echo "---------"
docker exec ${CONTAINER_NAME} psql -U postgres -c "\du" 2>/dev/null || echo "Cannot connect - password might be wrong"
echo ""

echo "📚 Databases:"
echo "-----------"
docker exec ${CONTAINER_NAME} psql -U postgres -c "\l" 2>/dev/null || echo "Cannot connect - password might be wrong"
echo ""

echo "⚙️  PostgreSQL Settings:"
echo "----------------------"
docker exec ${CONTAINER_NAME} psql -U postgres -c "
SELECT name, setting, unit, context 
FROM pg_settings 
WHERE name IN ('port', 'max_connections', 'shared_buffers', 'effective_cache_size', 'listen_addresses')
ORDER BY name;
" 2>/dev/null || echo "Cannot connect - password might be wrong"
echo ""

echo "🔐 Authentication Configuration (pg_hba.conf):"
echo "--------------------------------------------"
docker exec ${CONTAINER_NAME} cat /var/lib/postgresql/data/pg_hba.conf 2>/dev/null | grep -v "^#" | grep -v "^$" || echo "Cannot read pg_hba.conf"
echo ""

echo "✅ Check complete!"
echo ""
echo "💡 To connect manually:"
echo "   docker exec -it ${CONTAINER_NAME} psql -U postgres"

