# 🔧 Sửa lỗi Dashboard không hiển thị dữ liệu

## ⚠️ Vấn đề

- ✅ Device `SL-2025-0003` đã được tạo
- ❌ **Data Points = 0** - Dữ liệu không được lưu vào database
- ❌ Dashboard không hiển thị vì không có data points

## 🔍 Nguyên nhân

Có thể do:
1. Lỗi khi save data point (nhưng không được log)
2. Validation error trong DataPoint model
3. Exception bị catch nhưng không xử lý

## ✅ Đã sửa

Đã thêm error handling và logging trong `routes/data.js` để:
- Log khi save thành công
- Log lỗi nếu save thất bại
- Tiếp tục xử lý ngay cả khi có lỗi

## 🔄 Các bước tiếp theo

### Bước 1: Restart Server

```cmd
# Dừng server (Ctrl+C)
# Khởi động lại
npm start
```

### Bước 2: POST lại dữ liệu

Sử dụng Postman hoặc cURL:

**Postman:**
- POST `http://localhost:5023/api/v1/data`
- Header: `X-API-Key: 123`
- Body: JSON data (device_id: SL-2025-0003)

**cURL:**
```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: 123" ^
  -H "Content-Type: application/json" ^
  -d "{\"device_id\":\"SL-2025-0003\",\"timestamp\":1703761800,\"timezone\":\"Asia/Ho_Chi_Minh\",\"version\":\"0.9.0\",\"data\":{\"system\":{\"total_ac_power\":450.5,\"total_reactive_power\":120.3,\"avg_power_factor\":0.97,\"avg_frequency\":50.02,\"online_inverters\":8,\"total_inverters\":8,\"energy_5min\":37.54,\"system_state\":\"all_online\"},\"inverters\":[{\"id\":1,\"slave_address\":1,\"model\":\"SUN2000-10KTL\",\"ac_power\":56.2,\"ac_voltage_l1\":230.5,\"ac_current_l1\":81.7,\"power_factor\":0.98,\"grid_frequency\":50.02,\"daily_yield\":45.3,\"device_state\":\"running\",\"alarm_code\":0,\"efficiency\":97.8,\"internal_temp\":42.5}]},\"alarms\":[]}"
```

### Bước 3: Xem Server Logs

Sau khi POST, xem console của server:
- ✅ Nếu thấy: `Data point saved for device SL-2025-0003 at ...` → Thành công
- ❌ Nếu thấy: `Error saving data point: ...` → Có lỗi, xem chi tiết

### Bước 4: Kiểm tra Database

```bash
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin solarlogger --quiet --eval "print('Data Points: ' + db.data_points.countDocuments())"
```

**Kết quả mong đợi**: `Data Points: 1` (hoặc nhiều hơn)

### Bước 5: Refresh Dashboard

1. Mở: http://localhost:5023/dashboard/
2. **Hard refresh**: Ctrl+Shift+R (hoặc Ctrl+F5)
3. Chọn device: `SL-2025-0003`
4. Click "Tải dữ liệu"
5. Xem charts và statistics

## 🧪 Test nhanh

Sau khi POST lại, test API:

```powershell
# Test realtime data
Invoke-RestMethod -Uri "http://localhost:5023/api/v1/devices/SL-2025-0003/realtime"
```

**Kết quả mong đợi:**
```json
{
  "status": "success",
  "data": {
    "device_id": "SL-2025-0003",
    "system": {
      "total_ac_power": 450.5,
      ...
    }
  }
}
```

## 📋 Checklist

- [ ] Server đã restart với code mới
- [ ] POST lại dữ liệu với device_id SL-2025-0003
- [ ] Server logs hiển thị "Data point saved"
- [ ] Database có data_points > 0
- [ ] API `/api/v1/devices/SL-2025-0003/realtime` trả về dữ liệu
- [ ] Dashboard đã hard refresh (Ctrl+Shift+R)
- [ ] Chọn device SL-2025-0003 và click "Tải dữ liệu"
- [ ] Charts hiển thị dữ liệu

## ⚠️ Nếu vẫn không hoạt động

1. **Kiểm tra server logs** để xem lỗi cụ thể
2. **Kiểm tra MongoDB connection** có ổn không
3. **Kiểm tra DataPoint model** có validation rules nào chặn không
4. **Test với device khác** (SL-2025-0001 hoặc SL-2025-0002)

## 🎯 Kết quả mong đợi

Sau khi sửa và POST lại:
- ✅ Data points > 0 trong database
- ✅ API trả về dữ liệu realtime
- ✅ Dashboard hiển thị charts
- ✅ Statistics cards có giá trị







