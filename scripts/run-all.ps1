# PowerShell script to start everything (MongoDB + Test)
# This is a convenience script to get everything running

Write-Host "=== SolarLogger Backend - Quick Start ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start MongoDB
Write-Host "Step 1: Starting MongoDB..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$startMongoScript = Join-Path $scriptPath "start-mongodb.ps1"
& $startMongoScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start MongoDB. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 3

# Step 2: Initialize Database
Write-Host "Step 2: Initializing Database..." -ForegroundColor Yellow
$initDbScript = Join-Path $scriptPath "init-database.ps1"
& $initDbScript

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the backend API:" -ForegroundColor White
Write-Host "     - For IIS: Follow DEPLOY-IIS.md" -ForegroundColor Gray
Write-Host "     - For development: npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test the system:" -ForegroundColor White
Write-Host "     .\scripts\test-system.ps1 -ApiKey 'your-api-key-here'" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Access Mongo Express:" -ForegroundColor White
Write-Host "     http://localhost:8081 (admin/admin123)" -ForegroundColor Gray
Write-Host ""







