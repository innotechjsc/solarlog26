# Cách Chạy Admin Panel

## Cách 1: Chạy Trực Tiếp (Development)

### Bước 1: Khởi động MongoDB

```powershell
cd backend-system
.\scripts\start-mongodb-wrapper.bat
```

Hoặc:
```cmd
cd backend-system
scripts\start-mongodb.bat
```

### Bước 2: Khởi động Server

```cmd
cd backend-system
node server.js
```

Hoặc dùng script:
```powershell
.\scripts\start-admin.ps1
```

### Bước 3: Truy cập Admin Panel

Mở browser:
```
http://localhost:5023/admin
```

## Cách 2: Dùng PM2 (Production)

### Bước 1: Cài đặt PM2 (nếu chưa có)

```cmd
npm install -g pm2
```

### Bước 2: Start với PM2

```cmd
cd backend-system
pm2 start ecosystem.config.js
pm2 save
```

### Bước 3: Truy cập Admin Panel

```
http://localhost:5023/admin
```

## Kiểm Tra Server Đang Chạy

### Kiểm tra Port

```cmd
netstat -ano | findstr :5023
```

Nếu có kết quả → Server đang chạy ✅

### Test Health Endpoint

```cmd
curl http://localhost:5023/health
```

Kết quả mong đợi:
```json
{"status":"ok","timestamp":"..."}
```

### Test Admin API

```cmd
curl http://localhost:5023/api/v1/admin/projects
```

## Nếu Server Không Chạy

### 1. Kiểm tra MongoDB

```cmd
docker ps | findstr mongodb
```

Nếu không thấy, start MongoDB:
```cmd
.\scripts\start-mongodb-wrapper.bat
```

### 2. Kiểm tra .env file

```cmd
type .env
```

Đảm bảo có:
```env
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
PORT=5023
```

### 3. Kiểm tra Dependencies

```cmd
npm install
```

### 4. Xem Logs

Nếu dùng PM2:
```cmd
pm2 logs solarlogger-api
```

Nếu chạy trực tiếp:
- Xem console output

## Truy Cập Admin Panel

Sau khi server đã chạy:

1. **Mở Browser:**
   ```
   http://localhost:5023/admin
   ```

2. **Nếu deploy trên server:**
   ```
   http://sol.adtrade.site/admin
   ```

## Các Tính Năng Admin Panel

- ✅ **Quản lý Dự án**: Tạo, sửa, xóa dự án
- ✅ **Quản lý Khu vực**: Tạo khu vực trong dự án
- ✅ **Quản lý Thiết bị**: Tạo thiết bị trong khu vực
- ✅ **Báo cáo**: Xem báo cáo theo dự án/khu vực

## Troubleshooting

### Lỗi "Cannot GET /admin"

**Giải pháp:**
- Restart server
- Kiểm tra file `admin/index.html` có tồn tại không

### Lỗi "MongoDB connection failed"

**Giải pháp:**
- Kiểm tra MongoDB đang chạy: `docker ps`
- Kiểm tra connection string trong `.env`
- Kiểm tra port MongoDB (27019)

### Trang trắng

**Giải pháp:**
- Mở Browser Console (F12)
- Xem có JavaScript error không
- Xem Network tab có API calls không

---

**Script nhanh:** `.\scripts\start-admin.ps1` - Tự động start MongoDB và server

