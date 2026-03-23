# 🧪 Hướng dẫn kiểm tra Dashboard

## ⚠️ Quan trọng: Server phải đang chạy

Trước khi kiểm tra, đảm bảo server đang chạy:
```cmd
cd backend-system
npm start
```

## 📋 Các bước kiểm tra

### Bước 1: Kiểm tra Server

Mở browser hoặc PowerShell:

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5023/health"
```

Hoặc mở browser: **http://localhost:5023/health**

**Kết quả mong đợi:**
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### Bước 2: Kiểm tra có Devices không

```powershell
Invoke-RestMethod -Uri "http://localhost:5023/api/v1/devices"
```

Hoặc mở browser: **http://localhost:5023/api/v1/devices**

**Nếu `count: 0`** → Database chưa có dữ liệu, cần upload trước.

### Bước 3: Upload dữ liệu test (nếu chưa có)

Sử dụng Postman hoặc cURL:

**Postman:**
- Method: `POST`
- URL: `http://localhost:5023/api/v1/data`
- Headers: `X-API-Key: 123`
- Body: JSON từ file `test-data.json`

**Hoặc cURL:**
```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: 123" ^
  -H "Content-Type: application/json" ^
  -d @test-data.json
```

### Bước 4: Mở Dashboard

Mở browser: **http://localhost:5023/dashboard/**

### Bước 5: Kiểm tra trong Browser Console

1. Mở Dashboard
2. Nhấn **F12** để mở Developer Tools
3. Xem tab **Console**:
   - Có lỗi màu đỏ không?
   - Có message "Error loading devices" không?
4. Xem tab **Network**:
   - Click "Tải dữ liệu"
   - Xem request đến `/api/v1/devices` có thành công không (status 200)
   - Xem response có dữ liệu không

## ✅ Kết quả mong đợi

Khi Dashboard hoạt động đúng:

1. ✅ Dropdown có danh sách devices
2. ✅ Chọn device và click "Tải dữ liệu"
3. ✅ Charts hiển thị (Power Over Time, Energy Production)
4. ✅ Statistics cards có giá trị (Total Power, Energy, Efficiency, etc.)
5. ✅ Alarms section hiển thị (nếu có alarms)

## ❌ Nếu không hoạt động

### Lỗi: "No devices found"

**Nguyên nhân**: Database chưa có dữ liệu

**Giải pháp**: Upload dữ liệu test (Bước 3)

### Lỗi: CORS policy

**Nguyên nhân**: CORS chưa được cấu hình

**Giải pháp**: 
1. Sửa file `.env`: `CORS_ORIGIN=*`
2. Restart server

### Lỗi: Cannot connect to API

**Nguyên nhân**: Server không chạy hoặc sai port

**Giải pháp**:
1. Kiểm tra server đang chạy: `npm start`
2. Kiểm tra port trong `.env` và `dashboard/index.html` có khớp không

### Lỗi: 401 Unauthorized

**Nguyên nhân**: API key sai (nhưng dashboard không cần API key cho GET requests)

**Giải pháp**: Không cần, GET requests không cần API key

## 🔍 Debug Checklist

- [ ] Server đang chạy (`npm start`)
- [ ] MongoDB đang chạy (`docker ps`)
- [ ] Có ít nhất 1 device trong database
- [ ] Có dữ liệu realtime cho device
- [ ] CORS = `*` trong `.env`
- [ ] Dashboard API_BASE đúng port (5023)
- [ ] Không có lỗi trong browser console (F12)

## 📝 Test nhanh

1. **Start server**: `npm start`
2. **Upload data**: Dùng Postman với `test-data.json`
3. **Mở dashboard**: http://localhost:5023/dashboard/
4. **Check console**: F12 → Console tab
5. **Click "Tải dữ liệu"** và xem kết quả







