@echo off
setlocal enabledelayedexpansion

:: Script to rebuild Docker containers individually
:: Usage: rebuild-docker.bat [service] [mode]
:: service: backend, web, cms, all (default: all)
:: mode: dev, prod (default: dev)

set SERVICE=%1
set MODE=%2

if "%SERVICE%"=="" set SERVICE=all
if "%MODE%"=="" set MODE=dev

if "%MODE%"=="dev" (
    set COMPOSE_FILE=docker-compose.dev.yml
    set COMPOSE_PREFIX=dev
) else (
    set COMPOSE_FILE=docker-compose.yml
    set COMPOSE_PREFIX=
)

echo ========================================
echo Rebuilding Docker Container(s)
echo ========================================
echo Service: %SERVICE%
echo Mode: %MODE%
echo Compose File: %COMPOSE_FILE%
echo ========================================
echo.

if "%SERVICE%"=="all" (
    echo Rebuilding ALL services...
    docker-compose -f %COMPOSE_FILE% build --no-cache
    if errorlevel 1 (
        echo.
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
    echo.
    echo Restarting all services...
    docker-compose -f %COMPOSE_FILE% up -d
    echo.
    echo [SUCCESS] All services rebuilt and restarted!
    goto :end
)

if "%SERVICE%"=="backend" (
    echo Rebuilding BACKEND service...
    docker-compose -f %COMPOSE_FILE% build --no-cache backend
    if errorlevel 1 (
        echo.
        echo [ERROR] Backend build failed!
        pause
        exit /b 1
    )
    echo.
    echo Restarting backend service...
    docker-compose -f %COMPOSE_FILE% up -d backend
    echo.
    echo [SUCCESS] Backend rebuilt and restarted!
    goto :end
)

if "%SERVICE%"=="web" (
    echo Rebuilding WEB service...
    docker-compose -f %COMPOSE_FILE% build --no-cache web
    if errorlevel 1 (
        echo.
        echo [ERROR] Web build failed!
        pause
        exit /b 1
    )
    echo.
    echo Restarting web service...
    docker-compose -f %COMPOSE_FILE% up -d web
    echo.
    echo [SUCCESS] Web rebuilt and restarted!
    goto :end
)

if "%SERVICE%"=="cms" (
    echo Rebuilding CMS service...
    docker-compose -f %COMPOSE_FILE% build --no-cache cms
    if errorlevel 1 (
        echo.
        echo [ERROR] CMS build failed!
        pause
        exit /b 1
    )
    echo.
    echo Restarting CMS service...
    docker-compose -f %COMPOSE_FILE% up -d cms
    echo.
    echo [SUCCESS] CMS rebuilt and restarted!
    goto :end
)

echo [ERROR] Invalid service: %SERVICE%
echo.
echo Usage: rebuild-docker.bat [service] [mode]
echo.
echo Services: backend, web, cms, all
echo Modes: dev (default), prod
echo.
echo Examples:
echo   rebuild-docker.bat backend dev
echo   rebuild-docker.bat web
echo   rebuild-docker.bat all prod
echo.
pause
exit /b 1

:end
echo.
echo ========================================
echo View logs with:
echo   docker-compose -f %COMPOSE_FILE% logs -f %SERVICE%
echo ========================================
pause

