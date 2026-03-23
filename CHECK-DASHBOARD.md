# 🔍 Kiểm tra Dashboard có load được dữ liệu

## Các bước kiểm tra

### 1. Kiểm tra Server đang chạy

```powershell
Invoke-RestMethod -Uri "http://localhost:5023/health"
```

**Kết quả mong đợi:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

### 2. Kiểm tra có Devices trong Database

```powershell
Invoke-RestMethod -Uri "http://localhost:5023/api/v1/devices"
```

**Kết quả mong đợi:**
```json
{
  "status": "success",
  "count": 1,
  "devices": [
    {
      "device_id": "SL-2025-0001",
      "status": "online",
      ...
    }
  ]
}
```

**Nếu `count: 0`**: Database chưa có dữ liệu, cần upload data trước.

### 3. Kiểm tra Realtime Data

Nếu có device, test realtime data:

```powershell
$deviceId = "SL-2025-0001"
Invoke-RestMethod -Uri "http://localhost:5023/api/v1/devices/$deviceId/realtime"
```

**Kết quả mong đợi:**
```json
{
  "status": "success",
  "data": {
    "device_id": "SL-2025-0001",
    "system": {
      "total_ac_power": 450.5,
      ...
    }
  }
}
```

### 4. Kiểm tra Dashboard trong Browser

1. Mở: **http://localhost:5023/dashboard/**
2. Mở Developer Console (F12)
3. Xem tab **Console** và **Network**

**Kiểm tra:**
- Có lỗi CORS không?
- API calls có thành công không (status 200)?
- Có dữ liệu được trả về không?

## Nếu Dashboard không load được dữ liệu

### Vấn đề 1: Không có Devices

**Triệu chứng**: Dropdown "No devices found"

**Giải pháp**: Upload dữ liệu test:

```powershell
$headers = @{
    "X-API-Key" = "123"
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

Invoke-RestMethod -Uri "http://localhost:5023/api/v1/data" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

### Vấn đề 2: CORS Error

**Triệu chứng**: Console hiển thị "CORS policy" error

**Giải pháp**: Sửa file `.env`:
```env
CORS_ORIGIN=*
```

Sau đó restart server.

### Vấn đề 3: API không trả về dữ liệu

**Triệu chứng**: API trả về 404 hoặc empty

**Giải pháp**: 
1. Kiểm tra MongoDB đang chạy: `docker ps | findstr mongodb`
2. Kiểm tra connection string trong `.env`
3. Xem server logs để debug

### Vấn đề 4: Dashboard không kết nối được API

**Triệu chứng**: Network tab hiển thị failed requests

**Giải pháp**:
1. Kiểm tra API_BASE trong `dashboard/index.html` có đúng port không
2. Kiểm tra server đang chạy trên port đó
3. Kiểm tra firewall/antivirus

## Test nhanh với cURL

```bash
# Health
curl http://localhost:5023/health

# Devices
curl http://localhost:5023/api/v1/devices

# Realtime (nếu có device)
curl http://localhost:5023/api/v1/devices/SL-2025-0001/realtime
```

## Checklist

- [ ] Server đang chạy (`npm start`)
- [ ] MongoDB đang chạy (`docker ps`)
- [ ] Có ít nhất 1 device trong database
- [ ] Có dữ liệu realtime cho device
- [ ] CORS được cấu hình đúng (`CORS_ORIGIN=*`)
- [ ] Dashboard API_BASE đúng port
- [ ] Không có lỗi trong browser console

## Kết quả mong đợi

Khi mở **http://localhost:5023/dashboard/**:

1. ✅ Dropdown có danh sách devices
2. ✅ Chọn device và click "Tải dữ liệu"
3. ✅ Charts hiển thị dữ liệu
4. ✅ Statistics cards có giá trị
5. ✅ Alarms section hiển thị (nếu có)







