#!/bin/bash

# Script to fix PostgreSQL password mismatch issue
# This happens when database volume has old password but .env has different password

echo "🔧 Fixing PostgreSQL password mismatch..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating one with default values..."
    cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=goozi_db
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF
    echo "✅ Created .env file with default values"
fi

# Source .env file
source .env

echo ""
echo "📋 Current configuration:"
echo "   DB_USER: ${DB_USER:-postgres}"
echo "   DB_PASSWORD: ${DB_PASSWORD:-postgres}"
echo "   DB_NAME: ${DB_NAME:-goozi_db}"
echo ""

# Option 1: Reset database volume (WARNING: This will delete all data!)
read -p "Do you want to RESET database volume? This will DELETE ALL DATA! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing old database volume..."
    docker-compose down -v
    echo "✅ Database volume removed"
    echo ""
    echo "🚀 Starting fresh database..."
    docker-compose up -d postgres
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    echo "✅ Database is ready!"
    echo ""
    echo "🚀 Starting all services..."
    docker-compose up -d
    echo "✅ All services started!"
    exit 0
fi

# Option 2: Try to connect and update password
echo ""
echo "🔍 Checking database connection..."
docker-compose up -d postgres
sleep 5

# Try to connect with current password
if docker exec goozi-postgres psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-goozi_db}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful with current password!"
    echo "🚀 Starting all services..."
    docker-compose up -d
    exit 0
else
    echo "❌ Cannot connect with current password"
    echo ""
    echo "💡 Solutions:"
    echo "   1. If you know the OLD password, update .env file with that password"
    echo "   2. Or reset database volume (run this script again and choose 'y')"
    echo ""
    echo "📝 To manually reset password in existing database:"
    echo "   docker exec -it goozi-postgres psql -U postgres"
    echo "   ALTER USER postgres WITH PASSWORD '${DB_PASSWORD:-postgres}';"
    exit 1
fi

