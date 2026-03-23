# PowerShell script to check MongoDB database records

Write-Host "=== Kiểm tra Database MongoDB ===" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB container is running
$containerRunning = docker ps --filter "name=solarlogger-mongodb" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "❌ MongoDB container không chạy!" -ForegroundColor Red
    Write-Host "Khởi động MongoDB: docker-compose up -d mongodb" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ MongoDB container đang chạy" -ForegroundColor Green
Write-Host ""

# Check devices collection
Write-Host "=== Collection: devices ===" -ForegroundColor Yellow
$devices = docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.devices.countDocuments()"
Write-Host "Số lượng devices: $devices" -ForegroundColor Cyan

if ([int]$devices -gt 0) {
    Write-Host "Danh sách devices:" -ForegroundColor Gray
    docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.devices.find().forEach(d => print(d.device_id + ' - ' + (d.site_name || 'N/A') + ' [' + d.status + ']'))"
}

Write-Host ""

# Check data_points collection
Write-Host "=== Collection: data_points ===" -ForegroundColor Yellow
$dataPoints = docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.data_points.countDocuments()"
Write-Host "Số lượng data points: $dataPoints" -ForegroundColor Cyan

if ([int]$dataPoints -gt 0) {
    Write-Host "Data point mới nhất:" -ForegroundColor Gray
    docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "var latest = db.data_points.findOne({}, {sort: {timestamp: -1}}); if (latest) { print('Device: ' + latest.device_id); print('Timestamp: ' + latest.timestamp); print('Power: ' + (latest.system?.total_ac_power || 'N/A') + ' kW'); }"
}

Write-Host ""

# Check alarms collection
Write-Host "=== Collection: alarms ===" -ForegroundColor Yellow
$alarms = docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.alarms.countDocuments()"
Write-Host "Số lượng alarms: $alarms" -ForegroundColor Cyan

$activeAlarms = docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.alarms.countDocuments({status: 'ACTIVE'})"
Write-Host "Alarms đang active: $activeAlarms" -ForegroundColor Cyan

Write-Host ""

# Check hourly_summaries collection
Write-Host "=== Collection: hourly_summaries ===" -ForegroundColor Yellow
$hourly = docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.hourly_summaries.countDocuments()"
Write-Host "Số lượng hourly summaries: $hourly" -ForegroundColor Cyan

Write-Host ""

# Check daily_summaries collection
Write-Host "=== Collection: daily_summaries ===" -ForegroundColor Yellow
$daily = docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.daily_summaries.countDocuments()"
Write-Host "Số lượng daily summaries: $daily" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== Tổng kết ===" -ForegroundColor Cyan
Write-Host "Devices: $devices" -ForegroundColor White
Write-Host "Data Points: $dataPoints" -ForegroundColor White
Write-Host "Alarms: $alarms (Active: $activeAlarms)" -ForegroundColor White
Write-Host "Hourly Summaries: $hourly" -ForegroundColor White
Write-Host "Daily Summaries: $daily" -ForegroundColor White

if ([int]$devices -eq 0 -and [int]$dataPoints -eq 0) {
    Write-Host ""
    Write-Host "⚠ Database chưa có dữ liệu!" -ForegroundColor Yellow
    Write-Host "Cần upload dữ liệu từ SolarLogger device hoặc dùng test data." -ForegroundColor Yellow
}







