# 🔍 Debug Dashboard không hiển thị

## ⚠️ Vấn đề phát hiện

Từ kiểm tra database:
- ✅ Device `SL-2025-0003` đã được tạo
- ❌ **Data Points = 0** - Dữ liệu không được lưu!

## 🔍 Nguyên nhân có thể

### 1. POST request không thành công hoàn toàn

Mặc dù device được tạo, nhưng data point không được lưu. Có thể:
- Validation error
- Lỗi khi save data point
- Server error nhưng device vẫn được tạo

### 2. Kiểm tra Response từ POST

Khi POST dữ liệu, kiểm tra response:
- **200 OK**: Thành công
- **400 Bad Request**: Validation error
- **500 Internal Server Error**: Server error

### 3. Kiểm tra Server Logs

Xem console của server khi POST để thấy lỗi cụ thể.

## 🔧 Cách khắc phục

### Bước 1: Kiểm tra POST có thành công không

Trong Postman hoặc cURL, kiểm tra response:

**Response thành công:**
```json
{
  "status": "success",
  "message": "Data received",
  "server_time": 1703761801
}
```

**Response lỗi:**
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "..."
}
```

### Bước 2: Kiểm tra Server Logs

Khi POST, xem console của server (`npm start`) để thấy:
- Có lỗi gì không?
- Data point có được save không?

### Bước 3: Test lại với cURL

```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: 123" ^
  -H "Content-Type: application/json" ^
  -d "{\"device_id\":\"SL-2025-0003\",\"timestamp\":1703761800,\"timezone\":\"Asia/Ho_Chi_Minh\",\"version\":\"0.9.0\",\"data\":{\"system\":{\"total_ac_power\":450.5,\"total_reactive_power\":120.3,\"avg_power_factor\":0.97,\"avg_frequency\":50.02,\"online_inverters\":8,\"total_inverters\":8,\"energy_5min\":37.54,\"system_state\":\"all_online\"},\"inverters\":[{\"id\":1,\"slave_address\":1,\"model\":\"SUN2000-10KTL\",\"ac_power\":56.2}]},\"alarms\":[]}"
```

### Bước 4: Kiểm tra lại Database

Sau khi POST lại, kiểm tra:
```bash
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "print('Data Points: ' + db.data_points.countDocuments())"
```

## 📋 Checklist

- [ ] POST request trả về 200 OK
- [ ] Response có `"status": "success"`
- [ ] Server logs không có lỗi
- [ ] Database có data_points > 0
- [ ] Dashboard đã refresh (F5)
- [ ] CSP đã được sửa và server đã restart

## 🎯 Sau khi có Data Points

1. **Refresh Dashboard**: F5 hoặc Ctrl+R
2. **Chọn device**: SL-2025-0003 từ dropdown
3. **Click "Tải dữ liệu"**
4. **Xem charts**: Power Over Time, Energy Production
5. **Xem statistics**: Total Power, Energy, etc.

## 🔍 Debug trong Browser

1. Mở Dashboard: http://localhost:5023/dashboard/
2. Mở Developer Tools (F12)
3. Tab **Console**: Xem có lỗi không
4. Tab **Network**: 
   - Click "Tải dữ liệu"
   - Xem request `/api/v1/devices/SL-2025-0003/realtime`
   - Kiểm tra response có dữ liệu không

## ⚠️ Lưu ý

- **Device được tạo** nhưng **data point không được lưu** → Có lỗi trong quá trình save
- Cần kiểm tra server logs để xem lỗi cụ thể
- Có thể là lỗi validation hoặc lỗi database connection







