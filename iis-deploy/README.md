# SolarLogger Backend - IIS Deployment Package

## Nội dung package

Package này chứa tất cả các file cần thiết để deploy SolarLogger Backend lên IIS Server.

## Các bước deploy

### 1. Copy toàn bộ nội dung folder này lên server

Copy tất cả các file và folder trong iis-deploy lên thư mục trên server IIS (ví dụ: D:\Solar\backend-system)

### 2. Cài đặt Dependencies

Trên server, mở PowerShell hoặc Command Prompt và chạy:

```cmd
cd D:\Solar\backend-system
npm install --production
```

### 3. Cấu hình Environment Variables

Tạo file .env từ .env.example:

```cmd
copy .env.example .env
```

Sau đó chỉnh sửa file .env với các giá trị phù hợp:

```env
PORT=process.env.PORT
NODE_ENV=production
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=your-secure-api-key-here-change-this
CORS_ORIGIN=*
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

**Lưu ý:** Thay your-secure-api-key-here-change-this bằng API key bảo mật của bạn.

### 4. Khởi động MongoDB

**Cách 1: Dùng file .bat (Khuyến nghị - Tránh lỗi Execution Policy)**
```cmd
.\scripts\start-mongodb.bat
```

**Cách 2: Dùng PowerShell với Bypass**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-mongodb.ps1
```

**Cách 3: Nếu gặp lỗi Execution Policy, xem file FIX-POWERSHELL-EXECUTION-POLICY.md**

### 5. Khởi tạo Database

**Cách 1: Dùng file .bat (Khuyến nghị)**
```cmd
.\scripts\init-database.bat
```

**Cách 2: Dùng PowerShell với Bypass**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-database.ps1
```

### 6. Cấu hình IIS

Xem hướng dẫn chi tiết trong file HUONG-DAN-DEPLOY-IIS.md (nếu có) hoặc:

1. Cài đặt iisnode (nếu chưa có)
2. Tạo Application Pool trong IIS
3. Tạo Website trỏ đến thư mục này
4. Cấp quyền truy cập cho IIS_IUSRS

### 7. Test

```cmd
curl http://localhost:3000/health
```

## Cấu trúc thư mục

```
iis-deploy/
├── server.js              # Entry point của ứng dụng
├── package.json           # Dependencies
├── package-lock.json      # Lock file cho dependencies
├── web.config             # Cấu hình IIS
├── iisnode.yml            # Cấu hình iisnode
├── swagger.yaml           # Swagger API documentation
├── .env.example           # Template cho environment variables
├── docker-compose.yml     # Để chạy MongoDB
├── routes/                # API routes
├── models/                # Database models
├── services/              # Business logic services
├── middleware/            # Express middleware
├── dashboard/             # Dashboard HTML
├── mongodb-init/          # MongoDB initialization scripts
└── scripts/               # Utility scripts
```

## Lưu ý quan trọng

1. **Không copy file .env** - File này chứa thông tin nhạy cảm, phải tạo mới trên server
2. **Không copy node_modules** - Sẽ được cài đặt bằng npm install
3. **Không copy các file log** - Sẽ được tạo tự động khi chạy
4. **Cấu hình API Key** - Đảm bảo thay đổi API key mặc định trong file .env

## Bảo mật

- Thay đổi API key mặc định
- Cấu hình CORS_ORIGIN chỉ cho domain cần thiết (không dùng * trong production)
- Cài đặt SSL certificate cho HTTPS
- Giới hạn quyền truy cập file .env

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- Logs trong thư mục iisnode\iisnode.log
- Event Viewer trong Windows
- MongoDB đang chạy: docker ps

