# Script to check MongoDB container status and connection
# Usage: .\scripts\check-mongodb.ps1

Write-Host "Checking MongoDB container..." -ForegroundColor Yellow
Write-Host ""

# Check if Docker is running
try {
    $containers = docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[1] Docker is running" -ForegroundColor Green
        Write-Host ""
        
        # Find solarlogger-mongodb
        $mongoContainer = $containers | Select-String "solarlogger-mongodb"
        
        if ($mongoContainer) {
            Write-Host "[2] MongoDB container found:" -ForegroundColor Green
            Write-Host "    $mongoContainer" -ForegroundColor Gray
            Write-Host ""
            
            # Extract port from output
            if ($mongoContainer -match "(\d+):27017") {
                $port = $matches[1]
                Write-Host "[3] MongoDB port detected: $port" -ForegroundColor Cyan
                Write-Host ""
                
                Write-Host "[4] Connection string should be:" -ForegroundColor Yellow
                Write-Host "    mongodb://admin:solarlogger123@localhost:$port/solarlogger?authSource=admin" -ForegroundColor Green
                Write-Host ""
                
                # Test connection
                Write-Host "[5] Testing MongoDB connection..." -ForegroundColor Cyan
                try {
                    $testResult = docker exec solarlogger-mongodb mongosh --eval "db.runCommand('ping')" --quiet 2>&1
                    if ($testResult -match "ok.*1") {
                        Write-Host "    [OK] MongoDB is accessible and responding" -ForegroundColor Green
                    } else {
                        Write-Host "    [WARNING] MongoDB may not be fully ready" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "    [ERROR] Cannot connect to MongoDB container" -ForegroundColor Red
                }
            } else {
                Write-Host "[3] [WARNING] Cannot detect port from container output" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[2] [ERROR] solarlogger-mongodb container not found!" -ForegroundColor Red
            Write-Host "    Run: .\scripts\start-mongodb-wrapper.bat" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[1] [ERROR] Docker is not running or cannot access" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Cannot check Docker: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Container name: solarlogger-mongodb" -ForegroundColor Gray
Write-Host "Expected port: 27019" -ForegroundColor Gray
Write-Host "Actual port: Check output above" -ForegroundColor Gray
Write-Host ""
Write-Host "If port is different, update .env file:" -ForegroundColor Yellow
Write-Host "  MONGODB_URI=mongodb://admin:solarlogger123@localhost:<ACTUAL_PORT>/solarlogger?authSource=admin" -ForegroundColor Gray
Write-Host ""

