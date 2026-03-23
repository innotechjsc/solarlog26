@echo off
echo ========================================
echo Starting SolarLogger API Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Stopping any existing Node processes on port 5023...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5023 ^| findstr LISTENING') do (
    echo Stopping process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo Starting server...
echo.
echo ========================================
echo Server will start with WebSocket support
echo ========================================
echo.
echo Available endpoints:
echo   - API Server: http://localhost:5023
echo   - Admin Panel: http://localhost:5023/admin
echo   - Dashboard: http://localhost:5023/dashboard
echo   - API Docs: http://localhost:5023/api-docs
echo.
echo Expected output:
echo   - Connected to MongoDB
echo   - [WebSocket] Socket.IO server initialized
echo   - SolarLogger Backend API server running on port 5023
echo   - WebSocket server initialized
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
