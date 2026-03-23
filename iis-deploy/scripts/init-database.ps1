# PowerShell script to initialize MongoDB database
# This script creates initial indexes and test data

Write-Host "=== MongoDB Database Initialization ===" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB container is running
$containerRunning = docker ps --filter "name=solarlogger-mongodb" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "Error: MongoDB container is not running!" -ForegroundColor Red
    Write-Host "Please start MongoDB first: .\start-mongodb.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "MongoDB container is running" -ForegroundColor Green
Write-Host ""

# Wait a bit for MongoDB to be fully ready
Start-Sleep -Seconds 2

# Execute MongoDB initialization script
Write-Host "Creating indexes..." -ForegroundColor Yellow

$initScript = @"
use solarlogger;

// Create indexes for data_points collection
db.data_points.createIndex({ device_id: 1, timestamp: -1 });
db.data_points.createIndex({ timestamp: 1 }, { expireAfterSeconds: 604800 }); // 7 days TTL

// Create indexes for hourly_summaries collection
db.hourly_summaries.createIndex({ device_id: 1, hour: -1 });
db.hourly_summaries.createIndex({ hour: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL

// Create indexes for daily_summaries collection
db.daily_summaries.createIndex({ device_id: 1, date: -1 });
db.daily_summaries.createIndex({ date: 1 }, { expireAfterSeconds: 157680000 }); // 5 years TTL

// Create indexes for alarms collection
db.alarms.createIndex({ device_id: 1, start_time: -1 });
db.alarms.createIndex({ status: 1, severity: 1 });
db.alarms.createIndex({ start_time: 1 }, { expireAfterSeconds: 63072000 }); // 2 years TTL

// Create indexes for devices collection
db.devices.createIndex({ device_id: 1 }, { unique: true });

print('Indexes created successfully!');
"@

try {
    $initScript | docker exec -i solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin --quiet
    
    Write-Host "✓ Indexes created successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create indexes: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Insert test device (optional)
Write-Host "Inserting test device..." -ForegroundColor Yellow

$testDeviceScript = @"
use solarlogger;

db.devices.updateOne(
    { device_id: "SL-2025-0001" },
    {
        `$set: {
            device_id: "SL-2025-0001",
            site_name: "Test Site",
            location: "Ho Chi Minh City",
            timezone: "Asia/Ho_Chi_Minh",
            version: "0.9.0",
            total_inverters: 8,
            status: "offline",
            last_seen: new Date()
        }
    },
    { upsert: true }
);

print('Test device created/updated');
"@

try {
    $testDeviceScript | docker exec -i solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin --quiet
    
    Write-Host "✓ Test device created" -ForegroundColor Green
} catch {
    Write-Host "⚠ Failed to create test device (may already exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Database Initialization Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now:" -ForegroundColor Green
Write-Host "  1. Start the backend API server" -ForegroundColor Gray
Write-Host "  2. Test with: .\scripts\test-system.ps1" -ForegroundColor Gray
Write-Host "  3. Access Mongo Express: http://localhost:8081" -ForegroundColor Gray







