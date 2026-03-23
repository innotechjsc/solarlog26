# 📝 CURL Command với API Key = 123

## ✅ API Key đã được cấu hình

File `.env` đã được cập nhật với:
```env
ALLOWED_API_KEYS=123
```

## 🚀 CURL Command với API Key "123"

### Linux/Mac/Git Bash:

```bash
curl -X 'POST' \
  'http://localhost:5023/api/v1/data' \
  -H 'X-API-Key: 123' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
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
    "inverters": [
      {
        "id": 1,
        "slave_address": 1,
        "model": "SUN2000-10KTL",
        "ac_power": 56.2,
        "ac_voltage_l1": 230.5,
        "ac_current_l1": 81.7,
        "power_factor": 0.98,
        "grid_frequency": 50.02,
        "daily_yield": 45.3,
        "device_state": "running",
        "alarm_code": 0,
        "efficiency": 97.8,
        "internal_temp": 42.5
      }
    ]
  },
  "alarms": []
}'
```

### Windows CMD (một dòng):

```cmd
curl -X POST http://localhost:5023/api/v1/data -H "X-API-Key: 123" -H "Content-Type: application/json" -d "{\"device_id\":\"SL-2025-0001\",\"timestamp\":1703761800,\"timezone\":\"Asia/Ho_Chi_Minh\",\"version\":\"0.9.0\",\"data\":{\"system\":{\"total_ac_power\":450.5,\"total_reactive_power\":120.3,\"avg_power_factor\":0.97,\"avg_frequency\":50.02,\"online_inverters\":8,\"total_inverters\":8,\"energy_5min\":37.54,\"system_state\":\"all_online\"},\"inverters\":[{\"id\":1,\"slave_address\":1,\"model\":\"SUN2000-10KTL\",\"ac_power\":56.2,\"ac_voltage_l1\":230.5,\"ac_current_l1\":81.7,\"power_factor\":0.98,\"grid_frequency\":50.02,\"daily_yield\":45.3,\"device_state\":\"running\",\"alarm_code\":0,\"efficiency\":97.8,\"internal_temp\":42.5}]},\"alarms\":[]}"
```

### Windows CMD (nhiều dòng với file JSON):

```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: 123" ^
  -H "Content-Type: application/json" ^
  -d @test-data.json
```

### PowerShell:

```powershell
$headers = @{
    "X-API-Key" = "123"
    "Content-Type" = "application/json"
}

$body = Get-Content test-data.json -Raw

Invoke-RestMethod -Uri "http://localhost:5023/api/v1/data" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

## 📋 Test nhanh

### 1. Test Health Check (không cần API key):

```bash
curl http://localhost:5023/health
```

### 2. Test Upload Data (với API key "123"):

```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: 123" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"SL-2025-0001","timestamp":1703761800,"data":{"system":{"total_ac_power":450.5}}}'
```

## ⚠️ Lưu ý quan trọng

1. **Phải restart server** sau khi sửa `.env`:
   ```cmd
   # Dừng server (Ctrl+C)
   # Khởi động lại
   npm start
   ```

2. **API key "123"** phải khớp chính xác (case-sensitive)

3. **Nếu lỗi 401**: Kiểm tra:
   - Server đã restart chưa?
   - API key có đúng "123" không?
   - Header có đúng `X-API-Key: 123` không?

## ✅ Kết quả mong đợi

Nếu thành công, bạn sẽ nhận được:
```json
{
  "status": "success",
  "message": "Data received",
  "server_time": 1703761801
}
```

## 🔧 Thêm nhiều API keys

Nếu muốn thêm nhiều keys, phân cách bằng dấu phẩy:
```env
ALLOWED_API_KEYS=123,abc-456,device-001-key
```

Sau đó có thể dùng bất kỳ key nào trong danh sách.







