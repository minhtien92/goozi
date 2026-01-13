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

# Ask user for environment first
echo ""
echo "Select environment:"
echo "1) Production"
echo "2) Development"
read -p "Enter choice [1-2]: " choice

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    
    # Ask for production URLs if production mode
    if [ "$choice" = "1" ]; then
        echo ""
        echo "Please provide production URLs:"
        read -p "Frontend Web URL (e.g., https://yourdomain.com): " FRONTEND_URL
        read -p "CMS Admin URL (e.g., https://cms.yourdomain.com): " CMS_URL
        read -p "Backend API URL (e.g., https://api.yourdomain.com): " API_URL
        
        # Set defaults if empty
        FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
        CMS_URL=${CMS_URL:-http://localhost:3002}
        API_URL=${API_URL:-http://localhost:3001}
    else
        FRONTEND_URL="http://localhost:3000"
        CMS_URL="http://localhost:3002"
        API_URL="http://localhost:3001"
    fi
    
    # Ask for Google OAuth Client ID (optional)
    echo ""
    read -p "Google OAuth Client ID (optional, press Enter to skip): " GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
    
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
FRONTEND_URL=${FRONTEND_URL}
CMS_URL=${CMS_URL}

# Google OAuth
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}

# Frontend Build Args
VITE_API_URL=${API_URL}/api
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
EOF
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists, skipping..."
    echo "⚠️  Please ensure your .env file has all required variables:"
    echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    echo "   - JWT_SECRET, JWT_EXPIRES_IN"
    echo "   - FRONTEND_URL, CMS_URL"
    echo "   - GOOGLE_CLIENT_ID (optional)"
    echo "   - VITE_API_URL, VITE_GOOGLE_CLIENT_ID"
fi

case $choice in
    1)
        echo "🏗️  Building production images..."
        docker-compose build
        
        echo "🚀 Starting production containers..."
        docker-compose up -d
        
        echo "⏳ Waiting for database to be ready..."
        sleep 15
        
        echo "📦 Running database migrations..."
        docker-compose exec backend npm run migrate
        
        echo "👤 Creating admin user..."
        docker-compose exec backend npm run create-admin
        
        # Load .env to display URLs
        if [ -f .env ]; then
            source .env
        fi
        
        echo ""
        echo "✅ Installation complete!"
        echo ""
        echo "🌐 Services are running at:"
        echo "   - Frontend Web: ${FRONTEND_URL:-http://localhost:3000}"
        echo "   - CMS Admin:    ${CMS_URL:-http://localhost:3002}"
        echo "   - Backend API:  ${VITE_API_URL:-http://localhost:3001/api}"
        echo ""
        echo "📊 View logs: docker-compose logs -f"
        echo "🛑 Stop services: docker-compose down"
        echo ""
        echo "⚠️  Important for Production:"
        echo "   1. Configure reverse proxy (nginx/traefik) if using custom domains"
        echo "   2. Set up SSL certificates for HTTPS"
        echo "   3. Update Google OAuth redirect URIs in Google Cloud Console"
        echo "   4. Configure firewall rules to allow traffic on ports 3000, 3001, 3002"
        echo "   5. Change default database password in .env file"
        echo "   6. Keep JWT_SECRET secure and never commit .env to version control"
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

