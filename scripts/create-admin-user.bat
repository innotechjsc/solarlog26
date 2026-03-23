@echo off
echo ========================================
echo Tao tai khoan Admin User
echo ========================================
echo.

cd /d "%~dp0\.."

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Dang tao tai khoan admin...
echo.

node scripts/create-admin-user.js

echo.
pause
