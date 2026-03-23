# ✅ Các lỗi đã được sửa

## 1. Duplicate Index Warnings

**Vấn đề**: Mongoose cảnh báo duplicate indexes do khai báo index 2 lần:
- Một lần trong field definition (`index: true`)
- Một lần trong `schema.index()`

**Đã sửa**: Xóa `index: true` từ các field definitions trong:
- ✅ `models/DataPoint.js` - Removed `index: true` from `device_id` and `timestamp`
- ✅ `models/Alarm.js` - Removed `index: true` from `device_id`, `severity`, `start_time`, `status`
- ✅ `models/HourlySummary.js` - Removed `index: true` from `device_id` and `hour`
- ✅ `models/DailySummary.js` - Removed `index: true` from `device_id` and `date`

**Lý do**: Indexes đã được định nghĩa rõ ràng trong `schema.index()`, không cần `index: true` trong field definition.

## 2. Deprecated MongoDB Options

**Vấn đề**: 
- `useNewUrlParser: true` - Deprecated từ MongoDB Driver v4.0.0
- `useUnifiedTopology: true` - Deprecated từ MongoDB Driver v4.0.0

**Đã sửa**: Xóa các options này khỏi `mongoose.connect()` trong `server.js`

**Trước**:
```javascript
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
```

**Sau**:
```javascript
mongoose.connect(MONGODB_URI)
```

## 3. Port Conflict (EADDRINUSE)

**Vấn đề**: Port 3000 đã được sử dụng bởi process khác

**Đã sửa**: Đổi port mặc định từ 3000 sang **5023** trong:
- ✅ `server.js` - Default port changed to 5023
- ✅ `env.example` - PORT=5023
- ✅ `dashboard/index.html` - API_BASE updated to port 5023
- ✅ `scripts/test-system.ps1` - BaseUrl updated
- ✅ `scripts/test-system.bat` - BASE_URL updated

## Cách sử dụng

### 1. Tạo file `.env` với port mới:

```env
PORT=5023
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin
ALLOWED_API_KEYS=your-api-key-here
```

### 2. Khởi động server:

```cmd
npm start
```

Server sẽ chạy trên: **http://localhost:5023**

### 3. Test:

```cmd
# Health check
curl http://localhost:5023/health

# Test với script
.\scripts\test-system.ps1 -ApiKey "your-api-key-here"
```

### 4. Dashboard:

Mở `dashboard/index.html` - đã tự động cập nhật để dùng port 5023

## Kết quả

✅ Không còn duplicate index warnings
✅ Không còn deprecated option warnings  
✅ Port 5023 sẵn sàng sử dụng
✅ Tất cả files đã được cập nhật

## Lưu ý

Nếu bạn đã có file `.env` cũ, hãy cập nhật:
```env
PORT=5023
```

Hoặc nếu muốn dùng port khác, chỉ cần thay đổi trong `.env`:
```env
PORT=8080  # hoặc port bất kỳ
```







