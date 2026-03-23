@echo off
REM Wrapper script to run PowerShell script with ExecutionPolicy Bypass
REM This avoids Execution Policy errors

powershell.exe -ExecutionPolicy Bypass -File "%~dp0init-database.ps1"

if errorlevel 1 (
    echo.
    echo Error occurred. Check the error message above.
    pause
    exit /b 1
)

