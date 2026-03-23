@echo off
echo ========================================
echo Starting SolarLogger API Server with PM2
echo ========================================
echo.

cd /d "%~dp0"

echo Checking PM2 installation...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo PM2 is not installed!
    echo.
    echo Installing PM2 globally...
    npm install -g pm2
    if errorlevel 1 (
        echo ERROR: Failed to install PM2
        pause
        exit /b 1
    )
)

echo.
echo Checking ecosystem.config.js...
if not exist ecosystem.config.js (
    echo ERROR: ecosystem.config.js not found!
    pause
    exit /b 1
)

echo.
echo Stopping existing PM2 process (if any)...
pm2 stop solarlogger-api 2>nul
pm2 delete solarlogger-api 2>nul

echo.
echo Starting server with PM2...
pm2 start ecosystem.config.js

echo.
echo ========================================
echo Server started with PM2
echo ========================================
echo.
echo Useful PM2 commands:
echo   pm2 list              - View running processes
echo   pm2 logs solarlogger-api - View logs
echo   pm2 stop solarlogger-api  - Stop server
echo   pm2 restart solarlogger-api - Restart server
echo   pm2 delete solarlogger-api - Delete process
echo   pm2 save              - Save current process list
echo   pm2 startup           - Setup PM2 to start on boot
echo.
echo To view logs in real-time:
echo   pm2 logs solarlogger-api --lines 100
echo.
pause
