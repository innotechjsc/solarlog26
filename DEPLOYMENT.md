# Hướng dẫn Triển khai

## Yêu cầu hệ thống

- Node.js >= 16.x
- Docker và Docker Compose
- 4GB RAM tối thiểu
- 10GB disk space cho MongoDB

## Các bước triển khai

### 1. Clone và cài đặt

```bash
cd backend-system
npm install
```

### 2. Cấu hình Environment

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27017/solarlogger?authSource=admin
ALLOWED_API_KEYS=your-secure-api-key-here
CORS_ORIGIN=http://localhost:3001
```

### 3. Khởi động MongoDB

```bash
docker-compose up -d
```

Kiểm tra MongoDB đã chạy:
```bash
docker ps
```

### 4. Khởi động Backend API

```bash
# Development
npm run dev

# Production
npm start
```

### 5. Kiểm tra hệ thống

```bash
# Health check
curl http://localhost:3000/health

# Test data upload
curl -X POST http://localhost:3000/api/v1/data \
  -H "X-API-Key: your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

### 6. Truy cập Dashboard

Mở file `dashboard/index.html` trong browser hoặc serve qua web server:

```bash
# Sử dụng Python
cd dashboard
python -m http.server 3001

# Hoặc sử dụng Node.js http-server
npx http-server -p 3001
```

Truy cập: http://localhost:3001

### 7. Truy cập Mongo Express (Web UI)

http://localhost:8081
- Username: `admin`
- Password: `admin123`

## Cấu hình Production

### 1. Sử dụng PM2 để quản lý process

```bash
npm install -g pm2
pm2 start server.js --name solarlogger-api
pm2 save
pm2 startup
```

### 2. Sử dụng Nginx làm reverse proxy

```nginx
server {
    listen 80;
    server_name api.solarlogger.local;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Bảo mật MongoDB

Thay đổi password mặc định trong `docker-compose.yml`:
```yaml
environment:
  MONGO_INITDB_ROOT_PASSWORD: your-strong-password-here
```

### 4. Backup MongoDB

```bash
# Backup
docker exec solarlogger-mongodb mongodump \
  -u admin -p solarlogger123 \
  --authenticationDatabase admin \
  --out /backup

# Restore
docker exec solarlogger-mongodb mongorestore \
  -u admin -p solarlogger123 \
  --authenticationDatabase admin \
  /backup
```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-28T10:00:00.000Z",
  "uptime": 3600
}
```

### Logs

```bash
# Application logs
pm2 logs solarlogger-api

# MongoDB logs
docker-compose logs -f mongodb
```

## Troubleshooting

### MongoDB không kết nối được

1. Kiểm tra container đang chạy:
```bash
docker ps | grep mongodb
```

2. Kiểm tra logs:
```bash
docker-compose logs mongodb
```

3. Kiểm tra connection string trong `.env`

### API trả về 401 Unauthorized

- Kiểm tra API key trong header `X-API-Key`
- Kiểm tra API key có trong `ALLOWED_API_KEYS` trong `.env`

### Dashboard không hiển thị dữ liệu

- Kiểm tra CORS settings trong `.env`
- Kiểm tra API endpoint có đúng không
- Mở Developer Console để xem lỗi

## Scaling

### Horizontal Scaling

Có thể chạy nhiều instance API server phía sau load balancer:

```bash
# Instance 1
PORT=3000 pm2 start server.js --name solarlogger-api-1

# Instance 2
PORT=3001 pm2 start server.js --name solarlogger-api-2
```

### MongoDB Replica Set

Để tăng tính sẵn sàng, có thể setup MongoDB Replica Set (xem MongoDB documentation).

## Maintenance

### Cleanup old data

MongoDB tự động xóa dữ liệu cũ nhờ TTL indexes:
- Data points: 7 days
- Hourly summaries: 1 year
- Daily summaries: 5 years
- Alarms: 2 years

### Manual cleanup

```javascript
// Trong MongoDB shell
use solarlogger
db.data_points.deleteMany({ timestamp: { $lt: new Date(Date.now() - 7*24*60*60*1000) } })
```







