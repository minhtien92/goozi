#!/bin/bash

# Goozi Installation Script
echo "🚀 Goozi Installation Script"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=goozi_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# CORS
FRONTEND_URL=http://localhost:3000
CMS_URL=http://localhost:3002
EOF
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

# Ask user for environment
echo ""
echo "Select environment:"
echo "1) Production"
echo "2) Development"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo "🏗️  Building production images..."
        docker-compose build
        
        echo "🚀 Starting production containers..."
        docker-compose up -d
        
        echo "⏳ Waiting for database to be ready..."
        sleep 10
        
        echo "📦 Running database migrations..."
        docker-compose exec backend npm run migrate
        
        echo "👤 Creating admin user..."
        docker-compose exec backend npm run create-admin
        
        echo ""
        echo "✅ Installation complete!"
        echo ""
        echo "🌐 Services are running at:"
        echo "   - Frontend Web: http://localhost:3000"
        echo "   - CMS Admin:    http://localhost:3002"
        echo "   - Backend API:  http://localhost:3001"
        echo ""
        echo "📊 View logs: docker-compose logs -f"
        echo "🛑 Stop services: docker-compose down"
        ;;
    2)
        echo "🏗️  Building development images..."
        docker-compose -f docker-compose.dev.yml build
        
        echo "🚀 Starting development containers..."
        docker-compose -f docker-compose.dev.yml up -d
        
        echo "⏳ Waiting for database to be ready..."
        sleep 10
        
        echo "📦 Running database migrations..."
        docker-compose -f docker-compose.dev.yml exec backend npm run migrate
        
        echo "👤 Creating admin user..."
        docker-compose -f docker-compose.dev.yml exec backend npm run create-admin
        
        echo ""
        echo "✅ Development environment is ready!"
        echo ""
        echo "🌐 Services are running at:"
        echo "   - Frontend Web: http://localhost:3000"
        echo "   - CMS Admin:    http://localhost:3002"
        echo "   - Backend API:  http://localhost:3001"
        echo ""
        echo "📊 View logs: docker-compose -f docker-compose.dev.yml logs -f"
        echo "🛑 Stop services: docker-compose -f docker-compose.dev.yml down"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

