@echo off
REM Batch script to test the SolarLogger backend system

set API_KEY=your-api-key-here
set BASE_URL=http://localhost:5023

echo === SolarLogger Backend System Test ===
echo.

REM Test 1: Health Check
echo Test 1: Health Check
curl -s %BASE_URL%/health >nul 2>&1
if errorlevel 1 (
    echo [X] Health check failed - Server may not be running
    pause
    exit /b 1
) else (
    echo [OK] Health check passed
)

echo.

REM Test 2: Get Devices
echo Test 2: Get Devices List
curl -s %BASE_URL%/api/v1/devices
echo.
echo.

REM Test 3: Upload Test Data (requires API key in .env)
echo Test 3: Upload Test Data
echo Note: This requires a valid API key. Update API_KEY variable in this script.
curl -X POST %BASE_URL%/api/v1/data ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d @..\test-data.json
echo.
echo.

echo === Test Complete ===
pause

