@echo off
REM Batch script to start MongoDB Docker container

echo Starting MongoDB Docker container...

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Navigate to backend-system directory
cd /d "%~dp0\.."

REM Start MongoDB container
echo Starting MongoDB container...
docker-compose up -d mongodb

REM Wait for MongoDB to be ready
echo Waiting for MongoDB to be ready...
timeout /t 5 /nobreak >nul

REM Check if MongoDB is running
docker ps | findstr "solarlogger-mongodb" >nul
if errorlevel 1 (
    echo Error: MongoDB container failed to start. Check logs with: docker-compose logs mongodb
    pause
    exit /b 1
)

echo.
echo MongoDB is running successfully!
echo Connection string: mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
echo Mongo Express: http://localhost:8082 (admin/admin123)
echo.
echo To view logs: docker-compose logs -f mongodb
echo To stop: docker-compose down
echo.
pause

