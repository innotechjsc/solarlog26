# Script to start server and open admin panel
# Usage: .\scripts\start-admin.ps1

Write-Host "Starting SolarLogger Admin Panel..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed!" -ForegroundColor Red
    exit 1
}

# Navigate to backend-system directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath ".."
Set-Location $backendPath

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "Created .env file. Please update with your settings." -ForegroundColor Yellow
    }
}

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoCheck = docker ps --filter "name=solarlogger-mongodb" --format "{{.Names}}" 2>&1
    if ($mongoCheck -match "solarlogger-mongodb") {
        Write-Host "MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "Warning: MongoDB container not found. Starting MongoDB..." -ForegroundColor Yellow
        docker-compose up -d mongodb
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "Warning: Cannot check MongoDB. Make sure Docker is running." -ForegroundColor Yellow
}

# Start server
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host "Server will run on: http://localhost:5023" -ForegroundColor Cyan
Write-Host "Admin Panel: http://localhost:5023/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start Node.js server
node server.js

