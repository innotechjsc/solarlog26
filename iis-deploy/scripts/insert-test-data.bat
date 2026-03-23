@echo off
echo ========================================
echo Insert Test Data Script
echo ========================================
echo.

cd /d "%~dp0\.."

echo Running script...
node scripts/insert-test-data.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Script completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Script failed with error code: %ERRORLEVEL%
    echo ========================================
)

pause





