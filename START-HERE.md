# 🚀 Bắt đầu tại đây - SolarLogger Backend System

## ✅ Hệ thống đã được setup thành công!

### Trạng thái hiện tại:
- ✅ MongoDB: **Đang chạy** (port 27018)
- ✅ Mongo Express: **Đang chạy** (port 8082)
- ✅ Database: **Đã khởi tạo** với 5 collections

## 📋 Checklist nhanh

### 1. MongoDB đã chạy ✓
```cmd
docker ps | findstr solarlogger
```
Bạn sẽ thấy 2 containers: `solarlogger-mongodb` và `solarlogger-mongo-express`

### 2. Truy cập Mongo Express
Mở browser: **http://localhost:8082**
- Username: `admin`
- Password: `admin123`

### 3. Cấu hình Backend API

Tạo file `.env`:
```cmd
copy env.example .env
```

Chỉnh sửa `.env` và thêm API key:
```env
ALLOWED_API_KEYS=your-secure-api-key-here
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin
```

### 4. Cài đặt và chạy API

```cmd
npm install
npm start
```

API sẽ chạy trên: **http://localhost:3000**

### 5. Test hệ thống

```powershell
.\scripts\test-system.ps1 -ApiKey "your-secure-api-key-here"
```

## 🎯 Các bước tiếp theo

### Cho Development/Testing:
1. ✅ MongoDB đã chạy
2. Tạo `.env` file
3. `npm install`
4. `npm start`
5. Test với script hoặc Postman

### Cho Production (IIS):
1. ✅ MongoDB đã chạy
2. Xem hướng dẫn chi tiết: **`DEPLOY-IIS.md`**
3. Cài đặt iisnode
4. Tạo IIS Application
5. Cấu hình Environment Variables trong IIS

## 📚 Tài liệu

| File | Mô tả |
|------|-------|
| `SETUP-COMPLETE.md` | Thông tin setup đã hoàn tất |
| `DEPLOY-IIS.md` | Hướng dẫn deploy trên IIS |
| `README.md` | Tài liệu API đầy đủ |
| `QUICKSTART.md` | Quick start guide |
| `ARCHITECTURE.md` | Kiến trúc hệ thống |

## 🔧 Scripts tiện ích

| Script | Mô tả |
|--------|-------|
| `scripts\start-mongodb.ps1` | Khởi động MongoDB |
| `scripts\init-database.ps1` | Khởi tạo database |
| `scripts\test-system.ps1` | Test toàn bộ hệ thống |
| `scripts\run-all.ps1` | Chạy tất cả (MongoDB + Init) |

## 🌐 Endpoints chính

- **Health**: `GET http://localhost:3000/health`
- **Upload Data**: `POST http://localhost:3000/api/v1/data`
- **Get Devices**: `GET http://localhost:3000/api/v1/devices`
- **Realtime Data**: `GET http://localhost:3000/api/v1/devices/:id/realtime`
- **Analytics**: `GET http://localhost:3000/api/v1/analytics/energy?deviceId=...`

Xem đầy đủ trong `README.md`

## ⚠️ Lưu ý

1. **Port đã thay đổi**: MongoDB chạy trên port **27018** (không phải 27017) để tránh conflict
2. **Mongo Express**: Chạy trên port **8082** (không phải 8081)
3. **API Key**: Nhớ cấu hình API key trong `.env` trước khi test

## 🆘 Cần giúp đỡ?

- Xem `SETUP-COMPLETE.md` để biết trạng thái hiện tại
- Xem `DEPLOY-IIS.md` để deploy trên IIS
- Xem `README.md` để biết chi tiết API

---

**Chúc bạn thành công! 🎉**







