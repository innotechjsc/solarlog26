@echo off
echo ========================================
echo Aggregate Existing Data Script
echo ========================================
echo.

cd /d "%~dp0\.."

echo Running aggregation script...
node scripts/aggregate-existing-data.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Script completed successfully!
    echo ========================================
    echo.
    echo You can now view reports at: http://localhost:5023/reports
) else (
    echo.
    echo ========================================
    echo Script failed with error code: %ERRORLEVEL%
    echo ========================================
)

pause





