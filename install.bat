@echo off
REM Goozi Installation Script for Windows

echo 🚀 Goozi Installation Script
echo ==============================

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

REM Check if Docker Compose is installed
where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Database
        echo DB_HOST=postgres
        echo DB_PORT=5432
        echo DB_NAME=goozi_db
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo.
        echo # JWT
        echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
        echo JWT_EXPIRES_IN=7d
        echo.
        echo # Server
        echo PORT=3001
        echo NODE_ENV=production
        echo.
        echo # CORS
        echo FRONTEND_URL=http://localhost:3000
        echo CMS_URL=http://localhost:3002
    ) > .env
    echo ✅ .env file created
) else (
    echo ℹ️  .env file already exists, skipping...
)

REM Ask user for environment
echo.
echo Select environment:
echo 1^) Production
echo 2^) Development
set /p choice="Enter choice [1-2]: "

if "%choice%"=="1" (
    echo 🏗️  Building production images...
    docker-compose build
    
    echo 🚀 Starting production containers...
    docker-compose up -d
    
    echo ⏳ Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
    
    echo 📦 Running database migrations...
    docker-compose exec backend npm run migrate
    
    echo 👤 Creating admin user...
    docker-compose exec backend npm run create-admin
    
    echo.
    echo ✅ Installation complete!
    echo.
    echo 🌐 Services are running at:
    echo    - Frontend Web: http://localhost:3000
    echo    - CMS Admin:    http://localhost:3002
    echo    - Backend API:  http://localhost:3001
    echo.
    echo 📊 View logs: docker-compose logs -f
    echo 🛑 Stop services: docker-compose down
) else if "%choice%"=="2" (
    echo 🏗️  Building development images...
    docker-compose -f docker-compose.dev.yml build
    
    echo 🚀 Starting development containers...
    docker-compose -f docker-compose.dev.yml up -d
    
    echo ⏳ Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
    
    echo 📦 Running database migrations...
    docker-compose -f docker-compose.dev.yml exec backend npm run migrate
    
    echo 👤 Creating admin user...
    docker-compose -f docker-compose.dev.yml exec backend npm run create-admin
    
    echo.
    echo ✅ Development environment is ready!
    echo.
    echo 🌐 Services are running at:
    echo    - Frontend Web: http://localhost:3000
    echo    - CMS Admin:    http://localhost:3002
    echo    - Backend API:  http://localhost:3001
    echo.
    echo 📊 View logs: docker-compose -f docker-compose.dev.yml logs -f
    echo 🛑 Stop services: docker-compose -f docker-compose.dev.yml down
) else (
    echo ❌ Invalid choice
    exit /b 1
)

