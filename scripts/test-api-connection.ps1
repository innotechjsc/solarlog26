# Script to test if API is running on port 5023
# Usage: .\scripts\test-api-connection.ps1

Write-Host "Testing API connection on localhost:5023..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Check if port is listening
Write-Host "[1] Checking if port 5023 is listening..." -ForegroundColor Cyan
$portCheck = Get-NetTCPConnection -LocalPort 5023 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "  [OK] Port 5023 is listening" -ForegroundColor Green
    Write-Host "    State: $($portCheck.State)" -ForegroundColor Gray
} else {
    Write-Host "  [ERROR] Port 5023 is NOT listening" -ForegroundColor Red
    Write-Host "    The application may not have started correctly" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Try to connect to health endpoint
Write-Host "[2] Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5023/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  [OK] Health endpoint responded" -ForegroundColor Green
    Write-Host "    Status Code: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "    Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "  [ERROR] Cannot connect to health endpoint" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check PM2 status
Write-Host "[3] Checking PM2 status..." -ForegroundColor Cyan
try {
    $pm2Status = pm2 jlist 2>&1
    if ($LASTEXITCODE -eq 0) {
        $apps = $pm2Status | ConvertFrom-Json
        $app = $apps | Where-Object { $_.name -eq "solarlogger-api" }
        if ($app) {
            Write-Host "  [OK] solarlogger-api found in PM2" -ForegroundColor Green
            Write-Host "    Status: $($app.pm2_env.status)" -ForegroundColor Gray
            Write-Host "    PID: $($app.pid)" -ForegroundColor Gray
            Write-Host "    Restarts: $($app.pm2_env.restart_time)" -ForegroundColor Gray
            Write-Host "    Uptime: $($app.pm2_env.pm_uptime)" -ForegroundColor Gray
        } else {
            Write-Host "  [WARNING] solarlogger-api not found in PM2" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [WARNING] Cannot get PM2 status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARNING] PM2 command not available" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Check MongoDB connection
Write-Host "[4] Checking MongoDB..." -ForegroundColor Cyan
try {
    $mongoCheck = docker ps --filter "name=solarlogger-mongodb" --format "{{.Names}}" 2>&1
    if ($mongoCheck -match "solarlogger-mongodb") {
        Write-Host "  [OK] MongoDB container is running" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] MongoDB container may not be running" -ForegroundColor Yellow
        Write-Host "    Run: .\scripts\start-mongodb-wrapper.bat" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [WARNING] Cannot check MongoDB (Docker may not be running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Troubleshooting Tips:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If port 5023 is not listening:" -ForegroundColor Yellow
Write-Host "1. Check PM2 logs: pm2 logs solarlogger-api" -ForegroundColor Gray
Write-Host "2. Check if .env file exists and has correct MONGODB_URI" -ForegroundColor Gray
Write-Host "3. Restart PM2: pm2 restart solarlogger-api" -ForegroundColor Gray
Write-Host "4. Check MongoDB is running: docker ps" -ForegroundColor Gray
Write-Host ""

