@echo off
REM Batch script to start everything (MongoDB + Initialize)

echo === SolarLogger Backend - Quick Start ===
echo.

REM Step 1: Start MongoDB
echo Step 1: Starting MongoDB...
call scripts\start-mongodb.bat

REM Step 2: Initialize Database
echo.
echo Step 2: Initializing Database...
call scripts\init-database.bat

echo.
echo === Setup Complete ===
echo.
echo Next steps:
echo   1. Start the backend API:
echo      - For IIS: Follow DEPLOY-IIS.md
echo      - For development: npm start
echo.
echo   2. Test the system:
echo      scripts\test-system.bat
echo.
echo   3. Access Mongo Express:
echo      http://localhost:8081 (admin/admin123)
echo.
pause







