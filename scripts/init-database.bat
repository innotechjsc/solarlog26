@echo off
REM Batch script to initialize MongoDB database

echo === MongoDB Database Initialization ===
echo.

REM Check if MongoDB container is running
docker ps --filter "name=solarlogger-mongodb" --format "{{.Names}}" | findstr "solarlogger-mongodb" >nul
if errorlevel 1 (
    echo Error: MongoDB container is not running!
    echo Please start MongoDB first: start-mongodb.bat
    pause
    exit /b 1
)

echo MongoDB container is running
echo.

REM The initialization is already done by docker-compose via mongodb-init/init.js
echo Database indexes are created automatically on first startup.
echo.
echo You can verify by accessing Mongo Express: http://localhost:8081
echo Username: admin
echo Password: admin123
echo.
pause







