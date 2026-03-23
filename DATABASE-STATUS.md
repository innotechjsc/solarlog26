# 📊 Trạng thái Database MongoDB

## ✅ Kết quả kiểm tra

### Collections Summary:

| Collection | Số lượng | Trạng thái |
|------------|----------|------------|
| **devices** | **2** | ✅ Có dữ liệu |
| **data_points** | **0** | ❌ Chưa có dữ liệu |
| **alarms** | **0** | ✅ Không có alarms |
| **hourly_summaries** | **0** | ⚠️ Chưa có (tự động tạo từ data_points) |
| **daily_summaries** | **0** | ⚠️ Chưa có (tự động tạo từ hourly_summaries) |

## 📋 Chi tiết Devices

### Device 1:
- **Device ID**: `SL-2025-0001`
- **Site Name**: (trống)
- **Status**: `online`
- **Last Seen**: 2025-12-31T05:04:00.099Z

### Device 2:
- **Device ID**: `SL-2025-0002`
- **Site Name**: (trống)
- **Status**: `online`
- **Last Seen**: 2025-12-31T05:05:22.291Z

## ⚠️ Vấn đề

**Database có devices nhưng chưa có data points!**

Điều này có nghĩa:
- ✅ Devices đã được tạo (có thể từ lần upload trước)
- ❌ Chưa có dữ liệu thực tế (power, energy, etc.)
- ❌ Dashboard sẽ không hiển thị được charts vì không có dữ liệu

## 🔧 Giải pháp: Upload dữ liệu test

### Cách 1: Dùng Postman

1. **Method**: `POST`
2. **URL**: `http://localhost:5023/api/v1/data`
3. **Headers**:
   - `X-API-Key`: `123`
   - `Content-Type`: `application/json`
4. **Body**: Copy từ file `test-data.json`

### Cách 2: Dùng cURL

```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: 123" ^
  -H "Content-Type: application/json" ^
  -d @test-data.json
```

### Cách 3: Dùng PowerShell

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

## 📝 Sau khi upload

Sau khi upload dữ liệu thành công:

1. **Data Points** sẽ tăng lên
2. **Hourly Summaries** sẽ tự động được tạo (sau 1 giờ)
3. **Daily Summaries** sẽ tự động được tạo (sau 1 ngày)
4. **Dashboard** sẽ hiển thị được charts và dữ liệu

## 🔍 Kiểm tra lại sau khi upload

Chạy lại script:
```powershell
.\scripts\check-database.ps1
```

Hoặc query trực tiếp:
```bash
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "print('Data Points: ' + db.data_points.countDocuments())"
```

## 📊 Query MongoDB trực tiếp

### Xem tất cả devices:
```bash
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.devices.find().pretty()"
```

### Xem data points:
```bash
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.data_points.find().limit(5).pretty()"
```

### Xem data point mới nhất:
```bash
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "db.data_points.findOne({}, {sort: {timestamp: -1}}).pretty()"
```

## ✅ Tóm tắt

- ✅ **2 devices** đã được tạo
- ❌ **0 data points** - Cần upload dữ liệu
- ✅ Database hoạt động bình thường
- ⚠️ Dashboard sẽ không hiển thị charts cho đến khi có data points

**Bước tiếp theo**: Upload dữ liệu test để dashboard có thể hiển thị!







