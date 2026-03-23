# PowerShell script to start MongoDB Docker container
# Run this script as Administrator if needed

Write-Host "Starting MongoDB Docker container..." -ForegroundColor Green

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Navigate to backend-system directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath ".."
Set-Location $backendPath

# Start MongoDB container
Write-Host "Starting MongoDB container..." -ForegroundColor Yellow
docker-compose up -d mongodb

# Wait for MongoDB to be ready
Write-Host "Waiting for MongoDB to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $result = docker exec solarlogger-mongodb mongosh --eval "db.runCommand('ping')" --quiet 2>&1
        if ($result -match "ok.*1") {
            $ready = $true
            Write-Host "MongoDB is ready!" -ForegroundColor Green
        }
    } catch {
        Write-Host "Attempt $attempt/$maxAttempts - Waiting..." -ForegroundColor Gray
    }
}

if ($ready) {
    Write-Host "`nMongoDB is running successfully!" -ForegroundColor Green
    Write-Host "Connection string: mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin" -ForegroundColor Cyan
    Write-Host "Mongo Express: http://localhost:8082 (admin/admin123)" -ForegroundColor Cyan
    Write-Host "`nTo view logs: docker-compose logs -f mongodb" -ForegroundColor Yellow
    Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "`nWarning: MongoDB may not be fully ready. Please check logs:" -ForegroundColor Yellow
    Write-Host "docker-compose logs mongodb" -ForegroundColor Yellow
}

