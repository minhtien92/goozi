#!/bin/bash

echo "🔍 Checking Goozi Services..."
echo "=============================="

# Check if containers are running
echo ""
echo "📦 Container Status:"
docker-compose ps

# Check backend health
echo ""
echo "🏥 Backend Health Check:"
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is running"
    curl -s http://localhost:3001/health | jq .
else
    echo "❌ Backend is not accessible"
fi

# Check frontend
echo ""
echo "🌐 Frontend Web:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend Web is accessible"
else
    echo "❌ Frontend Web is not accessible"
fi

# Check CMS
echo ""
echo "🔧 CMS Admin:"
if curl -s http://localhost:3002 > /dev/null; then
    echo "✅ CMS Admin is accessible"
else
    echo "❌ CMS Admin is not accessible"
fi

# Check database
echo ""
echo "🗄️  Database:"
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
fi

echo ""
echo "📊 Recent Logs (last 20 lines):"
echo "Backend:"
docker-compose logs --tail=20 backend

