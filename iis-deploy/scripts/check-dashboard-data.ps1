# PowerShell script to check if dashboard can load data from database

param(
    [string]$BaseUrl = "http://localhost:5023"
)

Write-Host "=== Kiểm tra Dashboard Data ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "✓ Server đang chạy" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Server không chạy hoặc không truy cập được" -ForegroundColor Red
    Write-Host "  Lỗi: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Devices
Write-Host "Test 2: Kiểm tra Devices trong Database" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices" -Method Get
    Write-Host "✓ API Devices hoạt động" -ForegroundColor Green
    Write-Host "  Số lượng devices: $($response.count)" -ForegroundColor Gray
    
    if ($response.devices -and $response.devices.Count -gt 0) {
        Write-Host "  Danh sách devices:" -ForegroundColor Gray
        $response.devices | ForEach-Object {
            Write-Host "    - $($_.device_id): $($_.site_name) [$($_.status)]" -ForegroundColor Gray
        }
        
        $firstDevice = $response.devices[0].device_id
        Write-Host ""
        Write-Host "Test 3: Kiểm tra Realtime Data cho device đầu tiên" -ForegroundColor Yellow
        try {
            $realtimeResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$firstDevice/realtime" -Method Get
            Write-Host "✓ Có dữ liệu realtime" -ForegroundColor Green
            if ($realtimeResponse.data -and $realtimeResponse.data.system) {
                Write-Host "  Total Power: $($realtimeResponse.data.system.total_ac_power) kW" -ForegroundColor Gray
                Write-Host "  Online Inverters: $($realtimeResponse.data.system.online_inverters)/$($realtimeResponse.data.system.total_inverters)" -ForegroundColor Gray
                Write-Host "  Timestamp: $($realtimeResponse.data.timestamp)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "✗ Không có dữ liệu realtime cho device này" -ForegroundColor Yellow
            Write-Host "  Lỗi: $_" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "Test 4: Kiểm tra History Data" -ForegroundColor Yellow
        $end = [math]::Floor([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
        $start = $end - (24 * 60 * 60) # Last 24 hours
        try {
            $historyResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$firstDevice/history?start=$start&end=$end&interval=5min" -Method Get
            Write-Host "✓ Có dữ liệu history" -ForegroundColor Green
            Write-Host "  Số data points: $($historyResponse.count)" -ForegroundColor Gray
        } catch {
            Write-Host "✗ Không có dữ liệu history" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Test 5: Kiểm tra Alarms" -ForegroundColor Yellow
        try {
            $alarmsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$firstDevice/alarms?status=ACTIVE&limit=10" -Method Get
            Write-Host "✓ API Alarms hoạt động" -ForegroundColor Green
            Write-Host "  Số alarms active: $($alarmsResponse.count)" -ForegroundColor Gray
        } catch {
            Write-Host "✗ Không có alarms hoặc lỗi" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "⚠ Không có devices trong database" -ForegroundColor Yellow
        Write-Host "  Cần upload dữ liệu từ SolarLogger device trước" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ API Devices không hoạt động" -ForegroundColor Red
    Write-Host "  Lỗi: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Kết luận ===" -ForegroundColor Cyan

# Check if dashboard can access API
Write-Host ""
Write-Host "Để kiểm tra Dashboard:" -ForegroundColor Yellow
Write-Host "  1. Mở browser: $BaseUrl/dashboard/" -ForegroundColor Gray
Write-Host "  2. Mở Developer Console (F12)" -ForegroundColor Gray
Write-Host "  3. Xem tab Console và Network để kiểm tra lỗi" -ForegroundColor Gray
Write-Host ""
Write-Host "Nếu không có dữ liệu:" -ForegroundColor Yellow
Write-Host "  - Kiểm tra MongoDB có đang chạy không" -ForegroundColor Gray
Write-Host "  - Upload dữ liệu test bằng cURL hoặc Postman" -ForegroundColor Gray
Write-Host "  - Kiểm tra CORS settings trong .env" -ForegroundColor Gray







