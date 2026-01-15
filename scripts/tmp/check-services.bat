@echo off
echo 🔍 Checking Goozi Services...
echo ==============================

echo.
echo 📦 Container Status:
docker-compose ps

echo.
echo 🏥 Backend Health Check:
curl -s http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is running
    curl -s http://localhost:3001/health
) else (
    echo ❌ Backend is not accessible
)

echo.
echo 🌐 Frontend Web:
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend Web is accessible
) else (
    echo ❌ Frontend Web is not accessible
)

echo.
echo 🔧 CMS Admin:
curl -s http://localhost:3002 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ CMS Admin is accessible
) else (
    echo ❌ CMS Admin is not accessible
)

echo.
echo 🗄️  Database:
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Database is ready
) else (
    echo ❌ Database is not ready
)

echo.
echo 📊 Recent Backend Logs:
docker-compose logs --tail=20 backend

