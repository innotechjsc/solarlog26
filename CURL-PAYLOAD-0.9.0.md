# 📤 CURL Examples cho Payload Schema 0.9.0

Tài liệu này cung cấp các ví dụ cURL để gửi payload schema 0.9.0 mới lên hệ thống.

## 📋 Thông tin cần thiết

- **Endpoint**: `/api/v1/data`
- **Method**: `POST`
- **Header**: `X-API-Key` (bắt buộc)
- **Content-Type**: `application/json`

## 🔑 Lấy API Key

Kiểm tra file `.env` trong thư mục `backend-system`:
```env
ALLOWED_API_KEYS=your-api-key-here,another-key
```

## 📝 Các ví dụ cURL

### Ví dụ 1: Windows CMD (Inline JSON)

```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: your-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d "{\"logger_id\":\"SL-2025-0001\",\"timestamp\":1703761800,\"timezone\":\"Asia/Ho_Chi_Minh\",\"fw_version\":\"0.9.0\",\"schema_version\":\"0.9.0\",\"data\":{\"system\":{\"total_ac_active_power_w\":450500,\"online_inverters\":1,\"total_inverters\":1},\"inverters\":[{\"info\":{\"modbus_address\":1,\"serial_number\":\"SN1234567890\",\"model_name\":\"GW10K-ET\",\"inverter_type\":\"hybrid_3_phase\",\"rated_power_w\":10000,\"hw_version\":\"H1.2\",\"protocol\":\"modbus_rtu\"},\"operating_state\":{\"work_mode\":\"normal\",\"grid_mode\":\"on_grid\"},\"ac_measurements\":{\"voltage_l1n_v\":230.5,\"voltage_l2n_v\":231.1,\"voltage_l3n_v\":229.9,\"current_l1_a\":4.12,\"current_l2_a\":4.05,\"current_l3_a\":4.2,\"inverter_ac_bus_active_power_w\":2850,\"inverter_ac_reactive_power_var\":120,\"inverter_ac_apparent_power_va\":2900},\"grid_interaction\":{\"exchange_active_power_w\":500,\"import_active_power_w\":500,\"export_active_power_w\":0,\"frequency_hz\":49.98},\"pv_input\":{\"dc_bus_voltage_v\":380.5,\"pv_inputs\":[{\"mppt\":1,\"voltage_v\":360.2,\"current_a\":4.5,\"dc_power_w\":1621}]},\"battery_storage\":{\"mode\":\"charge\",\"active_power_w\":640,\"voltage_v\":51.8,\"current_a\":12.4,\"soc_percent\":78,\"soh_percent\":96},\"load\":{\"active_power_w\":2350},\"performance\":{\"inverter_efficiency_percent\":97.8},\"alarm\":{\"count\":0,\"data\":[]}}]}}"
```

### Ví dụ 2: Linux/Mac/Git Bash (Multi-line)

```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
  "logger_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "timezone": "Asia/Ho_Chi_Minh",
  "fw_version": "0.9.0",
  "schema_version": "0.9.0",
  "data": {
    "system": {
      "total_ac_active_power_w": 450500,
      "online_inverters": 1,
      "total_inverters": 1
    },
    "inverters": [
      {
        "info": {
          "modbus_address": 1,
          "serial_number": "SN1234567890",
          "model_name": "GW10K-ET",
          "inverter_type": "hybrid_3_phase",
          "rated_power_w": 10000,
          "hw_version": "H1.2",
          "protocol": "modbus_rtu"
        },
        "operating_state": {
          "work_mode": "normal",
          "grid_mode": "on_grid"
        },
        "sign_convention": {
          "grid_exchange_active_power": "positive_import",
          "battery_dc_active_power": "positive_charge"
        },
        "ac_measurements": {
          "voltage_l1n_v": 230.5,
          "voltage_l2n_v": 231.1,
          "voltage_l3n_v": 229.9,
          "current_l1_a": 4.12,
          "current_l2_a": 4.05,
          "current_l3_a": 4.2,
          "inverter_ac_bus_active_power_w": 2850,
          "inverter_ac_reactive_power_var": 120,
          "inverter_ac_apparent_power_va": 2900,
          "inverter_ac_bus_active_power_l1_w": 930,
          "inverter_ac_bus_active_power_l2_w": 920,
          "inverter_ac_bus_active_power_l3_w": 1000
        },
        "grid_interaction": {
          "exchange_active_power_w": 500,
          "import_active_power_w": 500,
          "export_active_power_w": 0,
          "import_energy_today_kwh": 1.2,
          "import_energy_total_kwh": 356.4,
          "export_energy_today_kwh": 0.0,
          "export_energy_total_kwh": 1205.8,
          "zero_export_enabled": false,
          "export_power_limit_w": 0,
          "frequency_hz": 49.98
        },
        "pv_input": {
          "dc_bus_voltage_v": 380.5,
          "pv_inputs": [
            {
              "mppt": 1,
              "voltage_v": 360.2,
              "current_a": 4.5,
              "dc_power_w": 1621
            },
            {
              "mppt": 2,
              "voltage_v": 355.8,
              "current_a": 4.7,
              "dc_power_w": 1679
            }
          ]
        },
        "battery_storage": {
          "mode": "charge",
          "active_power_w": 640,
          "voltage_v": 51.8,
          "current_a": 12.4,
          "soc_percent": 78,
          "soh_percent": 96,
          "energy_charge_today_kwh": 1.5,
          "energy_discharge_today_kwh": 0.6,
          "charge_limit_w": 3000,
          "discharge_limit_w": 3000
        },
        "load": {
          "active_power_w": 2350
        },
        "performance": {
          "inverter_efficiency_percent": 97.8
        },
        "alarm": {
          "count": 2,
          "data": [
            {
              "type": "warning",
              "code": 102,
              "text": "Grid phase wrong",
              "first_seen_ts": 1703761600,
              "last_seen_ts": 1703761800
            },
            {
              "type": "error",
              "code": 2051,
              "text": "DC/DC Softstart Fault",
              "first_seen_ts": 1703761500,
              "last_seen_ts": 1703761800
            }
          ]
        },
        "thermal_hardware": {
          "inverter_temp_c": 42.3,
          "heatsink_temp_c": 48.7,
          "transformer_temp_c": null,
          "ambient_temp_c": 33.1
        },
        "quality": {
          "source": "modbus",
          "device_online": true,
          "poll_interval_ms": 1000
        }
      }
    ]
  }
}'
```

### Ví dụ 3: Sử dụng file JSON (Khuyên dùng)

**Bước 1**: Tạo file `payload-0.9.0.json` trong thư mục `backend-system`:

```json
{
  "logger_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "timezone": "Asia/Ho_Chi_Minh",
  "fw_version": "0.9.0",
  "schema_version": "0.9.0",
  "data": {
    "system": {
      "total_ac_active_power_w": 450500,
      "online_inverters": 1,
      "total_inverters": 1
    },
    "inverters": [
      {
        "info": {
          "modbus_address": 1,
          "serial_number": "SN1234567890",
          "model_name": "GW10K-ET",
          "inverter_type": "hybrid_3_phase",
          "rated_power_w": 10000,
          "hw_version": "H1.2",
          "protocol": "modbus_rtu"
        },
        "operating_state": {
          "work_mode": "normal",
          "grid_mode": "on_grid"
        },
        "sign_convention": {
          "grid_exchange_active_power": "positive_import",
          "battery_dc_active_power": "positive_charge"
        },
        "ac_measurements": {
          "voltage_l1n_v": 230.5,
          "voltage_l2n_v": 231.1,
          "voltage_l3n_v": 229.9,
          "current_l1_a": 4.12,
          "current_l2_a": 4.05,
          "current_l3_a": 4.2,
          "inverter_ac_bus_active_power_w": 2850,
          "inverter_ac_reactive_power_var": 120,
          "inverter_ac_apparent_power_va": 2900,
          "inverter_ac_bus_active_power_l1_w": 930,
          "inverter_ac_bus_active_power_l2_w": 920,
          "inverter_ac_bus_active_power_l3_w": 1000
        },
        "grid_interaction": {
          "exchange_active_power_w": 500,
          "import_active_power_w": 500,
          "export_active_power_w": 0,
          "import_energy_today_kwh": 1.2,
          "import_energy_total_kwh": 356.4,
          "export_energy_today_kwh": 0.0,
          "export_energy_total_kwh": 1205.8,
          "zero_export_enabled": false,
          "export_power_limit_w": 0,
          "frequency_hz": 49.98
        },
        "pv_input": {
          "dc_bus_voltage_v": 380.5,
          "pv_inputs": [
            {
              "mppt": 1,
              "voltage_v": 360.2,
              "current_a": 4.5,
              "dc_power_w": 1621
            },
            {
              "mppt": 2,
              "voltage_v": 355.8,
              "current_a": 4.7,
              "dc_power_w": 1679
            },
            {
              "mppt": 3,
              "voltage_v": 0.0,
              "current_a": 0,
              "dc_power_w": 0
            },
            {
              "mppt": 4,
              "voltage_v": 0.0,
              "current_a": 0,
              "dc_power_w": 0
            }
          ]
        },
        "battery_storage": {
          "mode": "charge",
          "active_power_w": 640,
          "voltage_v": 51.8,
          "current_a": 12.4,
          "soc_percent": 78,
          "soh_percent": 96,
          "energy_charge_today_kwh": 1.5,
          "energy_discharge_today_kwh": 0.6,
          "charge_limit_w": 3000,
          "discharge_limit_w": 3000
        },
        "load": {
          "active_power_w": 2350
        },
        "performance": {
          "inverter_efficiency_percent": 97.8
        },
        "alarm": {
          "count": 2,
          "data": [
            {
              "type": "warning",
              "code": 102,
              "text": "Grid phase wrong",
              "first_seen_ts": 1703761600,
              "last_seen_ts": 1703761800
            },
            {
              "type": "error",
              "code": 2051,
              "text": "DC/DC Softstart Fault",
              "first_seen_ts": 1703761500,
              "last_seen_ts": 1703761800
            }
          ]
        },
        "thermal_hardware": {
          "inverter_temp_c": 42.3,
          "heatsink_temp_c": 48.7,
          "transformer_temp_c": null,
          "ambient_temp_c": 33.1
        },
        "quality": {
          "source": "modbus",
          "device_online": true,
          "poll_interval_ms": 1000
        }
      }
    ]
  }
}
```

**Bước 2**: Gửi request với file JSON

**Windows CMD:**
```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: your-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d @payload-0.9.0.json
```

**Linux/Mac/Git Bash:**
```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d @payload-0.9.0.json
```

**PowerShell:**
```powershell
$apiKey = "your-api-key-here"
$url = "http://localhost:5023/api/v1/data"
$headers = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}
$body = Get-Content -Path "payload-0.9.0.json" -Raw

Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
```

### Ví dụ 4: Sử dụng file payload có sẵn

Nếu bạn đã có file `payload/payload/basic_payload.json`:

**Windows CMD:**
```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: your-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d @../payload/payload/basic_payload.json
```

**Linux/Mac/Git Bash:**
```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d @../payload/payload/basic_payload.json
```

**Hoặc từ thư mục root:**
```bash
cd backend-system
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d @../payload/payload/basic_payload.json
```

### Ví dụ 5: PowerShell Script hoàn chỉnh

Tạo file `test-payload-0.9.0.ps1`:

```powershell
# Configuration
$apiKey = "your-api-key-here"
$baseUrl = "http://localhost:5023"
$payloadFile = "../payload/payload/basic_payload.json"

# Read payload
$payload = Get-Content -Path $payloadFile -Raw

# Update timestamp to current time
$payloadObj = $payload | ConvertFrom-Json
$payloadObj.timestamp = [math]::Floor([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
$payload = $payloadObj | ConvertTo-Json -Depth 20

# Headers
$headers = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

# Send request
try {
    Write-Host "Sending payload to $baseUrl/api/v1/data..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/data" -Method Post -Headers $headers -Body $payload
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
```

Chạy script:
```powershell
.\test-payload-0.9.0.ps1
```

## 🔍 Test và kiểm tra

### 1. Test với timestamp hiện tại

**Windows CMD:**
```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: your-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d "{\"logger_id\":\"SL-2025-0001\",\"timestamp\":%time%,...}"
```

**Hoặc sử dụng PowerShell để tự động:**
```powershell
$timestamp = [math]::Floor([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
# Sau đó thay thế trong payload
```

### 2. Kiểm tra response

Response thành công sẽ có dạng:
```json
{
  "status": "success",
  "message": "Data received",
  "server_time": 1703761800
}
```

### 3. Test alarm processing

Payload có alarm sẽ tự động được xử lý:
```json
"alarm": {
  "count": 2,
  "data": [
    {
      "type": "warning",
      "code": 102,
      "text": "Grid phase wrong",
      "first_seen_ts": 1703761600,
      "last_seen_ts": 1703761800
    }
  ]
}
```

Backend sẽ tự động:
- Tạo Alarm record trong database
- Map `type: "warning"` → `severity: "MINOR"`
- Map `type: "error"` → `severity: "CRITICAL"`
- Gửi notification nếu device có area

## ⚙️ Cấu hình

### Thay đổi port

Nếu server chạy ở port khác (ví dụ: 3000):

```bash
# Thay đổi URL
http://localhost:3000/api/v1/data
```

### Thay đổi host

Nếu deploy trên server:

```bash
# Production
https://your-domain.com/api/v1/data

# Development
http://192.168.1.100:5023/api/v1/data
```

## 📋 Checklist trước khi gửi

- [ ] Đã có API key trong `.env`
- [ ] API key được thêm vào header `X-API-Key`
- [ ] `logger_id` hoặc `device_id` đã được điền
- [ ] `timestamp` là Unix timestamp (seconds)
- [ ] `schema_version` = "0.9.0" (nếu dùng schema mới)
- [ ] Server đang chạy
- [ ] MongoDB đã kết nối

## 🐛 Troubleshooting

### Lỗi: "API key is required"
→ Thiếu header `X-API-Key`

### Lỗi: "API key is invalid"
→ Kiểm tra API key trong `.env` và đảm bảo đúng

### Lỗi: "Validation error"
→ Kiểm tra:
- `timestamp` có phải là number không
- `data.system` có tồn tại không
- `logger_id` hoặc `device_id` có tồn tại không

### Lỗi: "Connection refused"
→ Server chưa chạy hoặc sai port

### Lỗi: "MongoDB connection error"
→ Kiểm tra MongoDB đã khởi động chưa

## 📚 Tài liệu liên quan

- `PAYLOAD-UPDATE-0.9.0.md` - Chi tiết thay đổi schema
- `PAYLOAD-SYNC-COMPLETE.md` - Tóm tắt cập nhật backend
- `CURL-EXAMPLES.md` - Ví dụ cURL cho schema cũ
- `API-KEY-GUIDE.md` - Hướng dẫn sử dụng API key

---

**Lưu ý**: Nhớ thay `your-api-key-here` bằng API key thực tế từ file `.env`!

