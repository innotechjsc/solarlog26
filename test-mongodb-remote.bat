@echo off
echo ========================================
echo Test ket noi MongoDB Remote
echo ========================================
echo.

cd /d "%~dp0"

echo MongoDB URI can test:
echo mongodb://admin:solarlogger123@42.118.102.108:20719/solarlogger?authSource=admin
echo.

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Dang test ket noi...
echo.

node scripts/test-mongodb-connection.js mongodb://admin:solarlogger123@42.118.102.108:20719/solarlogger?authSource=admin

echo.
pause
