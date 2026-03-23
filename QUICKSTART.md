# Quick Start Guide

## Bước 1: Khởi động MongoDB

```bash
cd backend-system
docker-compose up -d
```

Đợi vài giây để MongoDB khởi động hoàn toàn.

## Bước 2: Cài đặt Dependencies

```bash
npm install
```

## Bước 3: Cấu hình Environment

Tạo file `.env` từ template:

```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

Chỉnh sửa `.env` và thêm API key của bạn:
```
ALLOWED_API_KEYS=your-secure-api-key-123
```

## Bước 4: Khởi động Backend API

```bash
npm start
```

Hoặc development mode (auto-reload):
```bash
npm run dev
```

Server sẽ chạy trên http://localhost:3000

## Bước 5: Test API

Mở terminal mới và test:

```bash
# Health check
curl http://localhost:3000/health

# Test upload data (thay your-secure-api-key-123 bằng API key trong .env)
curl -X POST http://localhost:3000/api/v1/data \
  -H "X-API-Key: your-secure-api-key-123" \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

## Bước 6: Mở Dashboard

Có 2 cách:

### Cách 1: Mở trực tiếp file HTML
Mở file `dashboard/index.html` trong browser (có thể cần điều chỉnh CORS trong `.env`)

### Cách 2: Serve qua web server
```bash
cd dashboard
python -m http.server 3001
```

Sau đó mở http://localhost:3001 trong browser

## Bước 7: Truy cập Mongo Express (Optional)

Mở http://localhost:8081
- Username: `admin`
- Password: `admin123`

## Troubleshooting

### MongoDB không chạy
```bash
docker ps
docker-compose logs mongodb
```

### Port đã được sử dụng
Thay đổi port trong `docker-compose.yml` hoặc `.env`

### API trả về 401
Kiểm tra API key trong header `X-API-Key` phải khớp với `ALLOWED_API_KEYS` trong `.env`

## Next Steps

- Xem `README.md` để biết chi tiết về API endpoints
- Xem `DEPLOYMENT.md` để biết cách triển khai production
- Xem `ARCHITECTURE.md` để hiểu kiến trúc hệ thống







