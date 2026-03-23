# PowerShell script to start server with WebSocket support

Write-Host "Starting SolarLogger Backend Server with WebSocket..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start server
Write-Host "Starting server on port 5023..." -ForegroundColor Cyan
node server.js

