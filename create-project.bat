@echo off
setlocal enabledelayedexpansion

REM Goozi Project Template Generator for Windows
REM Usage: create-project.bat [project-name] [target-directory]

echo.
echo 🚀 Goozi Project Template Generator
echo ==================================
echo.

REM Get project name
if "%~1"=="" (
    set /p PROJECT_NAME="Enter project name (e.g., myapp): "
) else (
    set PROJECT_NAME=%~1
)

REM Validate project name
if "!PROJECT_NAME!"=="" (
    echo ❌ Project name cannot be empty
    exit /b 1
)

REM Convert to lowercase (basic)
set PROJECT_NAME=!PROJECT_NAME: =!
set PROJECT_NAME=!PROJECT_NAME: =!

REM Get target directory
if "%~2"=="" (
    set /p TARGET_DIR="Enter target directory (default: ..\%PROJECT_NAME%): "
    if "!TARGET_DIR!"=="" set TARGET_DIR=..\%PROJECT_NAME%
) else (
    set TARGET_DIR=%~2
)

REM Convert to absolute path
for %%F in ("%TARGET_DIR%") do set TARGET_DIR=%%~fF

REM Check if target directory exists
if exist "%TARGET_DIR%" (
    echo ⚠️  Target directory already exists: %TARGET_DIR%
    set /p CONFIRM="Do you want to remove it and create a new project? (y/N): "
    if /i not "!CONFIRM!"=="y" (
        echo ❌ Aborted
        exit /b 1
    )
    echo Removing existing directory...
    rmdir /s /q "%TARGET_DIR%"
)

REM Create project name variations
set PROJECT_NAME_UPPER=%PROJECT_NAME%
set PROJECT_NAME_CAPITALIZED=%PROJECT_NAME%
set PROJECT_NAME_DB=%PROJECT_NAME%_db
set PROJECT_NAME_NETWORK=%PROJECT_NAME%-network

echo.
echo 📦 Creating new project: %PROJECT_NAME%
echo    Target directory: %TARGET_DIR%
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0
set TEMPLATE_DIR=%SCRIPT_DIR%

REM Create target directory
mkdir "%TARGET_DIR%" 2>nul

REM Copy template files using robocopy (exclude node_modules, .git, .env, dist)
echo 📋 Copying template files...
robocopy "%TEMPLATE_DIR%" "%TARGET_DIR%" /E /XD node_modules .git dist build uploads .cache coverage .nyc_output /XF .env .env.* *.log .DS_Store *.pid /NFL /NDL /NJH /NJS /NP /NS /NC

REM Remove template-specific files
del /f /q "%TARGET_DIR%\create-project.sh" 2>nul
del /f /q "%TARGET_DIR%\create-project.bat" 2>nul
del /f /q "%TARGET_DIR%\.template" 2>nul

echo 🔄 Replacing placeholders...
echo    This may take a moment...

REM Function to replace in file (using PowerShell)
powershell -Command "& {
    $files = Get-ChildItem -Path '%TARGET_DIR%' -Recurse -File -Include *.js,*.ts,*.tsx,*.json,*.yml,*.yaml,*.md,*.sh,*.bat,*.html,*.css,Dockerfile*,nginx.conf | Where-Object { $_.FullName -notmatch 'node_modules|\.git|dist|build' }
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $content = $content -replace 'goozi', '%PROJECT_NAME%'
            $content = $content -replace 'Goozi', '%PROJECT_NAME_CAPITALIZED%'
            $content = $content -replace 'GOOZI', '%PROJECT_NAME_UPPER%'
            $content = $content -replace 'goozi_db', '%PROJECT_NAME_DB%'
            $content = $content -replace 'goozi-network', '%PROJECT_NAME_NETWORK%'
            $content = $content -replace 'goozi-postgres', '%PROJECT_NAME%-postgres'
            $content = $content -replace 'goozi-backend', '%PROJECT_NAME%-backend'
            $content = $content -replace 'goozi-web', '%PROJECT_NAME%-web'
            $content = $content -replace 'goozi-cms', '%PROJECT_NAME%-cms'
            Set-Content -Path $file.FullName -Value $content -NoNewline
        }
    }
}"

REM Initialize git repository
echo 🔧 Initializing git repository...
cd /d "%TARGET_DIR%"
if exist ".git" rmdir /s /q .git
git init
git add .
git commit -m "Initial commit: Generated from Goozi template"

echo.
echo ✅ Project created successfully!
echo.
echo 📁 Project location: %TARGET_DIR%
echo.
echo Next steps:
echo   1. cd %TARGET_DIR%
echo   2. Run install.bat
echo   3. Start developing!
echo.
echo Happy coding! 🎉

endlocal
