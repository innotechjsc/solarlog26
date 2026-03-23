@echo off
REM Test script for payload schema 0.9.0 (Windows CMD)
REM Usage: test-payload-0.9.0.bat [API_KEY] [BASE_URL]

setlocal enabledelayedexpansion

REM Configuration
set API_KEY=%~1
if "!API_KEY!"=="" set API_KEY=your-api-key-here

set BASE_URL=%~2
if "!BASE_URL!"=="" set BASE_URL=http://localhost:5023

set PAYLOAD_FILE=..\payload\payload\basic_payload.json

REM Check if payload file exists
if not exist "%PAYLOAD_FILE%" (
    echo Error: Payload file not found: %PAYLOAD_FILE%
    echo Please run this script from backend-system\scripts directory
    exit /b 1
)

echo Sending payload to %BASE_URL%/api/v1/data...
echo API Key: %API_KEY%
echo.

REM Send request
curl -X POST "%BASE_URL%/api/v1/data" ^
  -H "X-API-Key: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d @"%PAYLOAD_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success!
) else (
    echo.
    echo Error: Request failed with error code %ERRORLEVEL%
    exit /b 1
)

