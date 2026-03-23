# 📝 CURL Examples với API Key

## Cách thêm API Key vào cURL

API Key được thêm vào **header** của request với tên `X-API-Key`.

## Cú pháp cơ bản

```bash
curl -X 'POST' \
  'http://localhost:5023/api/v1/data' \
  -H 'X-API-Key: your-api-key-here' \
  -H 'Content-Type: application/json' \
  -d '{...}'
```

## Ví dụ đầy đủ với API Key

### Ví dụ 1: Upload Data (Windows CMD)

```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: your-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d "{\"device_id\":\"SL-2025-0001\",\"timestamp\":1703761800,\"data\":{\"system\":{\"total_ac_power\":450.5}}}"
```

### Ví dụ 2: Upload Data (Linux/Mac/Git Bash)

```bash
curl -X 'POST' \
  'http://localhost:5023/api/v1/data' \
  -H 'X-API-Key: your-api-key-here' \
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

### Ví dụ 3: Sử dụng file JSON (Windows)

Tạo file `test-data.json`:
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
}
```

Sau đó chạy:
```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: your-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d @test-data.json
```

## Các cách khác để thêm API Key

### Cách 1: Trong header (Recommended)
```bash
-H 'X-API-Key: your-api-key-here'
```

### Cách 2: Sử dụng Bearer Token (cũng được hỗ trợ)
```bash
-H 'Authorization: Bearer your-api-key-here'
```

## Lấy API Key từ đâu?

### Bước 1: Kiểm tra file `.env`

Mở file `backend-system\.env` và tìm dòng:
```env
ALLOWED_API_KEYS=your-api-key-here,another-key
```

### Bước 2: Sử dụng một trong các keys

Nếu có nhiều keys, bạn có thể dùng bất kỳ key nào trong danh sách.

### Bước 3: Nếu chưa có `.env`

1. Copy `env.example` thành `.env`:
   ```cmd
   copy env.example .env
   ```

2. Mở `.env` và sửa:
   ```env
   ALLOWED_API_KEYS=my-secret-key-123
   ```

3. Sử dụng key đó trong cURL:
   ```bash
   -H 'X-API-Key: my-secret-key-123'
   ```

## Ví dụ đầy đủ với API Key

### Command hoàn chỉnh:

```bash
curl -X 'POST' \
  'http://localhost:5023/api/v1/data' \
  -H 'X-API-Key: your-api-key-here' \
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

## Test nhanh

### 1. Test không có API Key (sẽ lỗi)
```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test"}'
```
**Kết quả**: `401 Unauthorized` - "API key is required"

### 2. Test với API Key sai (sẽ lỗi)
```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test"}'
```
**Kết quả**: `401 Unauthorized` - "API key is invalid or expired"

### 3. Test với API Key đúng (sẽ thành công)
```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"SL-2025-0001","timestamp":1703761800,"data":{"system":{"total_ac_power":450.5}}}'
```
**Kết quả**: `200 OK` - "Data received"

## Lưu ý

1. **Thay `your-api-key-here`** bằng API key thực tế từ file `.env`
2. **Windows CMD**: Dùng `^` thay vì `\` để xuống dòng
3. **Git Bash/PowerShell**: Có thể dùng `\` để xuống dòng
4. **API Key phải khớp** với một trong các keys trong `ALLOWED_API_KEYS` trong `.env`

## Troubleshooting

### Lỗi: "API key is required"
→ Thiếu header `X-API-Key`

### Lỗi: "API key is invalid or expired"
→ API key không đúng hoặc chưa có trong `ALLOWED_API_KEYS` trong `.env`

### Giải pháp:
1. Kiểm tra file `.env` có đúng API key không
2. Đảm bảo đã thêm `-H "X-API-Key: your-key"` vào cURL
3. Restart server sau khi sửa `.env`







