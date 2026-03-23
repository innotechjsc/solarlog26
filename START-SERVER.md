# 🚀 Hướng Dẫn Khởi Động API và Admin Panel

## Bước 1: Kiểm tra MongoDB

Đảm bảo MongoDB đang chạy:

```bash
# Kiểm tra MongoDB service (Windows)
sc query MongoDB

# Hoặc kiểm tra port
netstat -an | findstr 27019
```

Nếu chưa chạy, khởi động MongoDB:
```bash
# Với Docker
docker-compose up -d mongodb

# Hoặc start MongoDB service
net start MongoDB
```

## Bước 2: Cấu hình Environment

Tạo file `.env` từ `env.example` nếu chưa có:

```bash
copy env.example .env
```

Đảm bảo file `.env` có các biến sau:
```env
PORT=5023
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
ALLOWED_API_KEYS=your-api-key-here
```

## Bước 3: Tạo Admin User

Chạy script tạo admin user đầu tiên:

```bash
node scripts/create-admin-user.js
```

Kết quả mong đợi:
```
Connected to MongoDB
Admin user created successfully!
Username: admin
Password: admin123
⚠️  Please change the password after first login!
```

## Bước 4: Khởi động Server

### Cách 1: Development mode (với nodemon - auto reload)
```bash
npm run dev
```

### Cách 2: Production mode
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5023`

## Bước 5: Truy cập Admin Panel

Mở browser và truy cập:
```
http://localhost:5023/admin
```

Đăng nhập với:
- **Username**: `admin`
- **Password**: `admin123`

## Bước 6: Kiểm tra API

### Health Check
```bash
curl http://localhost:5023/health
```

### Swagger API Docs
```
http://localhost:5023/api-docs
```

### Test Login API
```bash
curl -X POST http://localhost:5023/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

## Troubleshooting

### Lỗi: "Cannot connect to MongoDB"
- Kiểm tra MongoDB đang chạy
- Kiểm tra MONGODB_URI trong .env
- Kiểm tra port MongoDB (27019)

### Lỗi: "JWT_SECRET not found"
- Thêm JWT_SECRET vào file .env
- Restart server

### Lỗi: "Port already in use"
- Đổi PORT trong .env
- Hoặc kill process đang dùng port 5023:
```bash
netstat -ano | findstr :5023
taskkill /PID <PID> /F
```

### Lỗi: "Module not found"
- Cài đặt dependencies:
```bash
npm install
```

## Các URL quan trọng

- **Admin Panel**: http://localhost:5023/admin
- **Dashboard**: http://localhost:5023/dashboard
- **API Docs**: http://localhost:5023/api-docs
- **Health Check**: http://localhost:5023/health
- **API Base**: http://localhost:5023/api/v1

