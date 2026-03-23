# PowerShell script to test the SolarLogger backend system

param(
    [string]$ApiKey = "your-api-key-here",
    [string]$BaseUrl = "http://localhost:5023"
)

Write-Host "=== SolarLogger Backend System Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
    Write-Host "  Uptime: $([math]::Round($response.uptime, 2)) seconds" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Devices
Write-Host "Test 2: Get Devices List" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices" -Method Get
    Write-Host "✓ Get devices passed" -ForegroundColor Green
    Write-Host "  Found $($response.count) device(s)" -ForegroundColor Gray
    if ($response.devices.Count -gt 0) {
        $response.devices | ForEach-Object {
            Write-Host "    - $($_.device_id): $($_.site_name) [$($_.status)]" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ Get devices failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Upload Test Data
Write-Host "Test 3: Upload Test Data" -ForegroundColor Yellow
$testData = @{
    device_id = "SL-2025-0001"
    timestamp = [math]::Floor([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
    timezone = "Asia/Ho_Chi_Minh"
    version = "0.9.0"
    data = @{
        system = @{
            total_ac_power = 450.5
            total_reactive_power = 120.3
            avg_power_factor = 0.97
            avg_frequency = 50.02
            online_inverters = 8
            total_inverters = 8
            energy_5min = 37.54
            system_state = "all_online"
        }
        inverters = @(
            @{
                id = 1
                slave_address = 1
                model = "SUN2000-10KTL"
                ac_power = 56.2
                ac_voltage_l1 = 230.5
                ac_current_l1 = 81.7
                power_factor = 0.98
                grid_frequency = 50.02
                daily_yield = 45.3
                device_state = "running"
                alarm_code = 0
                efficiency = 97.8
                internal_temp = 42.5
            }
        )
    }
    alarms = @()
} | ConvertTo-Json -Depth 10

try {
    $headers = @{
        "X-API-Key" = $ApiKey
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/data" -Method Post -Headers $headers -Body $testData
    Write-Host "✓ Data upload passed" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
    Write-Host "  Message: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Data upload failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Get Realtime Data
Write-Host "Test 4: Get Realtime Data" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/SL-2025-0001/realtime" -Method Get
    Write-Host "✓ Get realtime data passed" -ForegroundColor Green
    if ($response.data -and $response.data.system) {
        Write-Host "  Total Power: $($response.data.system.total_ac_power) kW" -ForegroundColor Gray
        Write-Host "  Online Inverters: $($response.data.system.online_inverters)/$($response.data.system.total_inverters)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Get realtime data failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Energy Analytics
Write-Host "Test 5: Get Energy Analytics" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/analytics/energy?deviceId=SL-2025-0001&period=7days" -Method Get
    Write-Host "✓ Get energy analytics passed" -ForegroundColor Green
    if ($response.analytics) {
        Write-Host "  Total Energy: $($response.analytics.total_energy) kWh" -ForegroundColor Gray
        Write-Host "  Avg Daily Energy: $([math]::Round($response.analytics.avg_daily_energy, 2)) kWh" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Get energy analytics failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

