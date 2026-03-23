@echo off
echo ========================================
echo Starting SolarLogger API Server and Admin Panel
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
echo Server will start with:
echo   - API Server: http://localhost:5023
echo   - Admin Panel: http://localhost:5023/admin
echo   - Dashboard: http://localhost:5023/dashboard
echo   - API Docs: http://localhost:5023/api-docs
echo ========================================
echo.
echo Expected output:
echo   - Connected to MongoDB
echo   - SolarLogger Backend API server running on port 5023
echo.
echo Admin Panel will open in browser after server starts...
echo Press Ctrl+C to stop the server
echo.

REM Start server in new window and open browser after delay
start "SolarLogger API Server" cmd /k "node server.js"
timeout /t 4 /nobreak >nul
start http://localhost:5023/admin

echo.
echo Server is starting in a new window titled "SolarLogger API Server"
echo Admin Panel will open in your browser shortly...
echo.
echo To stop the server, close the "SolarLogger API Server" window
echo or press Ctrl+C in that window.
echo.
echo You can close this window now - server will continue running.
echo.
pause
