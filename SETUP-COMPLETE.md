# ✅ Setup Hoàn tất - Hệ thống đã sẵn sàng

## Trạng thái hiện tại

✅ **MongoDB**: Đang chạy trên port **27018**
✅ **Mongo Express**: Đang chạy trên port **8082**
✅ **Database**: Đã được khởi tạo với indexes

## Thông tin kết nối

### MongoDB Connection String
```
mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin
```

### Mongo Express Web UI
- **URL**: http://localhost:8082
- **Username**: `admin`
- **Password**: `admin123`

## Các bước tiếp theo

### 1. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend-system`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=your-secure-api-key-here
CORS_ORIGIN=*
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

### 2. Cài đặt Dependencies

```cmd
cd backend-system
npm install
```

### 3. Khởi động Backend API

#### Option A: Development mode (cho testing)
```cmd
npm start
```

#### Option B: Deploy trên IIS
Xem hướng dẫn chi tiết trong `DEPLOY-IIS.md`

### 4. Test hệ thống

Sau khi API server đã chạy, test bằng script:

```powershell
.\scripts\test-system.ps1 -ApiKey "your-secure-api-key-here"
```

Hoặc test thủ công:

```cmd
# Health check
curl http://localhost:3000/health

# Upload test data
curl -X POST http://localhost:3000/api/v1/data ^
  -H "X-API-Key: your-secure-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d @test-data.json
```

## Các lệnh Docker hữu ích

### Xem logs
```cmd
docker-compose logs -f mongodb
docker-compose logs -f mongo-express
```

### Dừng containers
```cmd
docker-compose down
```

### Khởi động lại
```cmd
docker-compose up -d
```

### Xem trạng thái
```cmd
docker ps | findstr solarlogger
```

## Cấu trúc Database

Sau khi khởi động, MongoDB sẽ tự động tạo các collections:

- `devices` - Thông tin devices
- `data_points` - Dữ liệu 5-minute (TTL: 7 days)
- `hourly_summaries` - Tổng hợp giờ (TTL: 1 year)
- `daily_summaries` - Tổng hợp ngày (TTL: 5 years)
- `alarms` - Lịch sử alarms (TTL: 2 years)

## Troubleshooting

### MongoDB không kết nối được
1. Kiểm tra container đang chạy: `docker ps`
2. Kiểm tra port 27018 có bị chiếm không
3. Kiểm tra connection string trong `.env`

### API trả về 401
- Kiểm tra API key trong header `X-API-Key`
- Kiểm tra API key có trong `ALLOWED_API_KEYS` trong `.env`

### Port conflicts
- MongoDB: Port 27018 (có thể thay đổi trong `docker-compose.yml`)
- Mongo Express: Port 8082 (có thể thay đổi trong `docker-compose.yml`)
- API Server: Port 3000 (có thể thay đổi trong `.env`)

## Tài liệu tham khảo

- `DEPLOY-IIS.md` - Hướng dẫn deploy trên IIS
- `README.md` - Tài liệu API đầy đủ
- `QUICKSTART.md` - Quick start guide
- `ARCHITECTURE.md` - Kiến trúc hệ thống

## Lưu ý quan trọng

⚠️ **Bảo mật**: 
- Đổi password MongoDB trong production
- Sử dụng strong API keys
- Giới hạn CORS_ORIGIN chỉ cho domain cần thiết

⚠️ **Backup**: 
- Cấu hình backup MongoDB định kỳ
- Xem hướng dẫn trong `DEPLOYMENT.md`

⚠️ **Monitoring**: 
- Theo dõi logs trong `iisnode` folder (nếu chạy trên IIS)
- Monitor MongoDB container health







