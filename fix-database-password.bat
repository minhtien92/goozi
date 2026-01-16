@echo off
REM Script to fix PostgreSQL password mismatch issue on Windows

echo 🔧 Fixing PostgreSQL password mismatch...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found. Creating one with default values...
    (
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo DB_NAME=goozi_db
        echo DB_PORT=5432
        echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
    ) > .env
    echo ✅ Created .env file with default values
)

echo.
echo 📋 Current configuration from .env:
type .env
echo.

REM Option 1: Reset database volume
set /p RESET="Do you want to RESET database volume? This will DELETE ALL DATA! (y/N): "
if /i "%RESET%"=="y" (
    echo 🗑️  Removing old database volume...
    docker-compose down -v
    echo ✅ Database volume removed
    echo.
    echo 🚀 Starting fresh database...
    docker-compose up -d postgres
    echo ⏳ Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
    echo ✅ Database is ready!
    echo.
    echo 🚀 Starting all services...
    docker-compose up -d
    echo ✅ All services started!
    exit /b 0
)

REM Option 2: Try to connect
echo.
echo 🔍 Checking database connection...
docker-compose up -d postgres
timeout /t 5 /nobreak >nul

echo.
echo 💡 If connection fails, you can:
echo    1. Update .env file with the CORRECT password that matches existing database
echo    2. Or reset database volume (run this script again and choose 'y')
echo.
echo 📝 To manually reset password in existing database:
echo    docker exec -it goozi-postgres psql -U postgres
echo    ALTER USER postgres WITH PASSWORD 'your_new_password';
echo.
echo 🚀 Starting all services...
docker-compose up -d
echo ✅ Done!

