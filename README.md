# SolarLogger Backend System

Hệ thống backend để nhận, lưu trữ và phân tích dữ liệu từ SolarLogger devices.

## Kiến trúc

- **Backend API**: Node.js + Express
- **Database**: MongoDB (Docker container)
- **Authentication**: API Key
- **Data Retention**: 
  - Data points: 7 days
  - Hourly summaries: 1 year
  - Daily summaries: 5 years
  - Alarms: 2 years

## Cài đặt

### 1. Khởi động MongoDB với Docker

```bash
cd backend-system
docker-compose up -d
```

MongoDB sẽ chạy trên port 27017
Mongo Express (Web UI) sẽ chạy trên port 8081 (http://localhost:8081)

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình environment

Copy `.env.example` thành `.env` và chỉnh sửa:

```bash
cp .env.example .env
```

Chỉnh sửa các giá trị trong `.env`:
- `MONGODB_URI`: Connection string đến MongoDB
- `ALLOWED_API_KEYS`: Danh sách API keys được phép (phân cách bằng dấu phẩy)
- `PORT`: Port cho API server (mặc định: 3000)

### 4. Khởi động server

```bash
# Development mode (với auto-reload)
npm run dev

# Production mode
npm start
```

Server sẽ chạy trên `http://localhost:3000`

## API Endpoints

### Data Ingestion (từ SolarLogger device)

#### POST /api/v1/data
Nhận dữ liệu từ SolarLogger device

**Headers:**
```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**
```json
{
  "device_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "timezone": "Asia/Ho_Chi_Minh",
  "version": "0.9.0",
  "data": {
    "system": {
      "total_ac_power": 450.5,
      "total_reactive_power": 120.3,
      "avg_power_factor": 0.97,
      "avg_frequency": 50.02,
      "online_inverters": 8,
      "total_inverters": 8,
      "energy_5min": 37.54,
      "system_state": "all_online"
    },
    "inverters": [
      {
        "id": 1,
        "slave_address": 1,
        "model": "SUN2000-10KTL",
        "ac_power": 56.2,
        "ac_voltage_l1": 230.5,
        "ac_current_l1": 81.7,
        "power_factor": 0.98,
        "grid_frequency": 50.02,
        "daily_yield": 45.3,
        "device_state": "running",
        "alarm_code": 0,
        "efficiency": 97.8,
        "internal_temp": 42.5
      }
    ]
  },
  "alarms": []
}
```

#### POST /api/v1/alarms
Nhận alarm notification từ SolarLogger device

**Request Body:**
```json
{
  "device_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "alarm": {
    "alarm_code": 2003,
    "severity": "CRITICAL",
    "description": "Inverter #1 grid frequency fault",
    "inverter_id": 1,
    "start_time": 1703761800,
    "current_value": 51.5,
    "threshold": 51.0
  }
}
```

### Dashboard & Analytics

#### GET /api/v1/devices
Lấy danh sách tất cả devices

#### GET /api/v1/devices/:deviceId/realtime
Lấy dữ liệu realtime của device

#### GET /api/v1/devices/:deviceId/history?start=1703700000&end=1703761800&interval=5min
Lấy lịch sử dữ liệu
- `interval`: `5min`, `1hour`, `1day`

#### GET /api/v1/devices/:deviceId/summary/hourly?start=1703700000&end=1703761800
Lấy tổng hợp theo giờ

#### GET /api/v1/devices/:deviceId/summary/daily?start=1703700000&end=1703761800
Lấy tổng hợp theo ngày

#### GET /api/v1/devices/:deviceId/alarms?status=ACTIVE&severity=CRITICAL
Lấy danh sách alarms

#### GET /api/v1/analytics/performance?deviceId=SL-2025-0001&start=1703700000&end=1703761800
Phân tích hiệu suất

#### GET /api/v1/analytics/energy?deviceId=SL-2025-0001&period=7days
Phân tích năng lượng
- `period`: `7days`, `30days`, `1year`

#### GET /api/v1/analytics/alarms?deviceId=SL-2025-0001&start=1703700000&end=1703761800
Thống kê alarms

## MongoDB Collections

1. **devices**: Thông tin devices
2. **data_points**: Dữ liệu 5-minute (TTL: 7 days)
3. **hourly_summaries**: Tổng hợp theo giờ (TTL: 1 year)
4. **daily_summaries**: Tổng hợp theo ngày (TTL: 5 years)
5. **alarms**: Lịch sử alarms (TTL: 2 years)

## Testing

### Test với curl

```bash
# Test health check
curl http://localhost:3000/health

# Test data upload (cần set API key trong .env)
curl -X POST http://localhost:3000/api/v1/data \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

## Docker Commands

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# View logs
docker-compose logs -f mongodb

# Access MongoDB shell
docker exec -it solarlogger-mongodb mongosh -u admin -p solarlogger123

# Access Mongo Express (Web UI)
# Open http://localhost:8081
# Username: admin
# Password: admin123
```

## Next Steps

1. Tạo Dashboard frontend (React/Vue)
2. Thêm authentication/authorization
3. Thêm WebSocket cho real-time updates
4. Thêm email/SMS notifications cho alarms
5. Thêm scheduled reports







