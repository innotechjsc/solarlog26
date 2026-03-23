# Ví dụ sử dụng API Key

## Tình huống thực tế

Giả sử bạn đã cấu hình trong `.env`:
```env
ALLOWED_API_KEYS=sk_solarlogger_2025_abc123xyz789
```

## Ví dụ 1: Test với cURL (Windows CMD)

```cmd
curl -X POST http://localhost:3000/api/v1/data ^
  -H "X-API-Key: sk_solarlogger_2025_abc123xyz789" ^
  -H "Content-Type: application/json" ^
  -d "{\"device_id\":\"SL-2025-0001\",\"timestamp\":1703761800,\"data\":{\"system\":{\"total_ac_power\":450.5}}}"
```

## Ví dụ 2: Test với PowerShell

```powershell
$apiKey = "sk_solarlogger_2025_abc123xyz789"
$url = "http://localhost:3000/api/v1/data"

$headers = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

$body = @{
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
        inverters = @()
    }
    alarms = @()
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "Success: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
```

## Ví dụ 3: Test với file JSON

Tạo file `test-request.json`:
```json
{
  "device_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "timezone": "Asia/Ho_Chi_Minh",
  "version": "0.9.0",
  "data": {
    "system": {
      "total_ac_power": 450.5,
      "total_reactive_power": 120.3,
      "avg_power_factor": 0.97,
      "avg_frequency": 50.02,
      "online_inverters": 8,
      "total_inverters": 8,
      "energy_5min": 37.54,
      "system_state": "all_online"
    },
    "inverters": []
  },
  "alarms": []
}
```

Sau đó chạy:
```cmd
curl -X POST http://localhost:3000/api/v1/data ^
  -H "X-API-Key: sk_solarlogger_2025_abc123xyz789" ^
  -H "Content-Type: application/json" ^
  -d @test-request.json
```

## Ví dụ 4: Từ ESP32 (Arduino/ESP-IDF)

```cpp
// Trong code ESP32
const char* apiKey = "sk_solarlogger_2025_abc123xyz789";
const char* serverUrl = "http://your-server.com/api/v1/data";

HTTPClient http;
http.begin(serverUrl);
http.addHeader("X-API-Key", apiKey);
http.addHeader("Content-Type", "application/json");

String jsonPayload = "{\"device_id\":\"SL-2025-0001\",...}";
int httpResponseCode = http.POST(jsonPayload);

if (httpResponseCode == 200) {
    Serial.println("Data uploaded successfully");
} else {
    Serial.printf("Error: %d\n", httpResponseCode);
}
http.end();
```

## Kiểm tra API Key có hoạt động không

### Test 1: Không có API Key (sẽ lỗi)
```cmd
curl -X POST http://localhost:3000/api/v1/data ^
  -H "Content-Type: application/json" ^
  -d "{\"device_id\":\"test\"}"
```
**Kết quả**: `401 Unauthorized` với message "API key is required"

### Test 2: API Key sai (sẽ lỗi)
```cmd
curl -X POST http://localhost:3000/api/v1/data ^
  -H "X-API-Key: wrong-key" ^
  -H "Content-Type: application/json" ^
  -d "{\"device_id\":\"test\"}"
```
**Kết quả**: `401 Unauthorized` với message "API key is invalid or expired"

### Test 3: API Key đúng (sẽ thành công)
```cmd
curl -X POST http://localhost:3000/api/v1/data ^
  -H "X-API-Key: sk_solarlogger_2025_abc123xyz789" ^
  -H "Content-Type: application/json" ^
  -d @test-data.json
```
**Kết quả**: `200 OK` với message "Data received"







