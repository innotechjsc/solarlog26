# Cơ Chế Database Hoạt Động Như Thế Nào

## Tổng Quan

Hệ thống sử dụng **MongoDB** (NoSQL database) để lưu trữ dữ liệu từ các thiết bị SolarLogger. Database được chạy trong Docker container và quản lý qua **Mongo Express** (web-based admin interface).

## Kiến Trúc Database

### 1. MongoDB Container

```yaml
mongodb:
  image: mongo:7.0
  container_name: solarlogger-mongodb
  ports:
    - "27019:27017"  # Map port 27019 (host) -> 27017 (container)
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: solarlogger123
    MONGO_INITDB_DATABASE: solarlogger
```

**Đặc điểm:**
- Chạy MongoDB version 7.0 trong Docker
- Port: 27019 (để tránh conflict với MongoDB mặc định 27017)
- Authentication: username/password
- Database mặc định: `solarlogger`
- Auto-restart khi container dừng

### 2. Mongo Express (Web UI)

```yaml
mongo-express:
  image: mongo-express:latest
  ports:
    - "8082:8081"
  environment:
    ME_CONFIG_MONGODB_ADMINUSERNAME: admin
    ME_CONFIG_MONGODB_ADMINPASSWORD: solarlogger123
    ME_CONFIG_BASICAUTH_USERNAME: admin
    ME_CONFIG_BASICAUTH_PASSWORD: admin123
```

**Truy cập:** http://localhost:8082
- Username: `admin`
- Password: `admin123`

## Tại Sao Sử Dụng Mongo Express?

### 1. **Quản Lý Database Dễ Dàng**
- **Web-based UI**: Không cần cài đặt MongoDB Compass hay command line tools
- **Trực quan**: Xem dữ liệu dạng bảng, dễ đọc
- **Truy cập từ xa**: Có thể truy cập qua browser từ bất kỳ đâu

### 2. **Debug và Kiểm Tra**
- Xem dữ liệu realtime đang được lưu
- Kiểm tra cấu trúc collections
- Xem indexes và performance
- Test queries trực tiếp

### 3. **Quản Lý Dữ Liệu**
- Insert/Update/Delete documents
- Xem statistics của collections
- Export/Import data
- Quản lý users và permissions

### 4. **Phù Hợp Với Docker**
- Chạy trong container, không cần cài đặt thêm
- Tự động kết nối với MongoDB trong cùng network
- Dễ cấu hình và deploy

## Cấu Trúc Database

### Collections (Bảng)

#### 1. **data_points** - Dữ Liệu Thời Gian Thực
```javascript
{
  device_id: "DEVICE001",
  timestamp: ISODate("2024-01-01T10:00:00Z"),
  timezone: "Asia/Ho_Chi_Minh",
  system: {
    total_ac_power: 123.45,
    energy_5min: 10.28,
    avg_power_factor: 0.95,
    online_inverters: 5,
    total_inverters: 6
  },
  inverters: [
    {
      id: 1,
      ac_power: 20.5,
      efficiency: 0.98,
      ...
    }
  ]
}
```

**Đặc điểm:**
- Lưu dữ liệu mỗi 5 phút từ thiết bị
- **TTL Index**: Tự động xóa sau 7 ngày (604800 giây)
- Index: `{ device_id: 1, timestamp: -1 }` để query nhanh

#### 2. **hourly_summaries** - Tổng Hợp Theo Giờ
```javascript
{
  device_id: "DEVICE001",
  hour: ISODate("2024-01-01T10:00:00Z"),
  total_energy: 1234.56,
  max_power: 150.0,
  min_power: 50.0,
  avg_power: 100.0,
  inverter_summaries: [...]
}
```

**Đặc điểm:**
- Tự động tạo từ `data_points` (aggregation service)
- **TTL Index**: Tự động xóa sau 1 năm
- Index: `{ device_id: 1, hour: -1 }`

#### 3. **daily_summaries** - Tổng Hợp Theo Ngày
```javascript
{
  device_id: "DEVICE001",
  date: ISODate("2024-01-01T00:00:00Z"),
  total_energy: 12345.67,
  max_power: 200.0,
  peak_hour: 12,
  sunshine_hours: 8,
  inverter_summaries: [...]
}
```

**Đặc điểm:**
- Tự động tạo từ `hourly_summaries`
- **TTL Index**: Tự động xóa sau 5 năm
- Index: `{ device_id: 1, date: -1 }`

#### 4. **alarms** - Cảnh Báo
```javascript
{
  device_id: "DEVICE001",
  alarm_code: 1001,
  severity: "CRITICAL",
  description: "High temperature",
  status: "ACTIVE",
  start_time: ISODate("2024-01-01T10:00:00Z"),
  ...
}
```

**Đặc điểm:**
- Lưu các cảnh báo từ thiết bị
- **TTL Index**: Tự động xóa sau 2 năm
- Indexes: `{ device_id: 1, start_time: -1 }`, `{ status: 1, severity: 1 }`

#### 5. **devices** - Thông Tin Thiết Bị
```javascript
{
  device_id: "DEVICE001",
  site_name: "Solar Farm 1",
  location: "Ho Chi Minh City",
  is_online: true,
  last_seen: ISODate("2024-01-01T10:00:00Z"),
  ...
}
```

**Đặc điểm:**
- Lưu thông tin metadata của thiết bị
- Index: `{ device_id: 1 }` (unique)

## Luồng Dữ Liệu

### 1. **Nhận Dữ Liệu Từ Thiết Bị**

```
Thiết bị SolarLogger 
  → POST /api/v1/data 
  → Lưu vào data_points
  → Trigger aggregation service
```

### 2. **Aggregation Service (Tự Động)**

```
Data Point mới
  ↓
Kiểm tra timestamp
  ↓
Nếu là cuối giờ → Tạo hourly_summary
Nếu là cuối ngày → Tạo daily_summary
```

**Code:** `services/aggregationService.js`

### 3. **Query Dữ Liệu**

```
Dashboard/API Request
  ↓
Query từ collections phù hợp:
  - Realtime: data_points (latest)
  - 24h chart: data_points (last 24h)
  - Daily chart: daily_summaries
  - Analytics: hourly_summaries hoặc daily_summaries
```

## Indexes và Performance

### TTL Indexes (Time To Live)

MongoDB tự động xóa dữ liệu cũ:

- **data_points**: 7 ngày
- **hourly_summaries**: 1 năm
- **daily_summaries**: 5 năm
- **alarms**: 2 năm

**Lợi ích:**
- Tiết kiệm dung lượng
- Tự động dọn dẹp
- Không cần cron job

### Compound Indexes

```javascript
// Query nhanh theo device_id và timestamp
{ device_id: 1, timestamp: -1 }
```

**Lợi ích:**
- Query nhanh hơn
- Sắp xếp hiệu quả
- Giảm tải database

## Kết Nối Từ Application

### Connection String

```javascript
mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
```

**Cấu trúc:**
- `admin:solarlogger123` - Username:Password
- `localhost:27019` - Host:Port
- `solarlogger` - Database name
- `authSource=admin` - Authentication database

### Mongoose ODM

```javascript
const mongoose = require('mongoose');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));
```

**Models:**
- `models/DataPoint.js`
- `models/HourlySummary.js`
- `models/DailySummary.js`
- `models/Alarm.js`
- `models/Device.js`

## Backup và Restore

### Backup

```bash
# Backup database
docker exec solarlogger-mongodb mongodump \
  --username admin --password solarlogger123 \
  --authenticationDatabase admin \
  --db solarlogger \
  --out /backup
```

### Restore

```bash
# Restore database
docker exec solarlogger-mongodb mongorestore \
  --username admin --password solarlogger123 \
  --authenticationDatabase admin \
  --db solarlogger \
  /backup/solarlogger
```

## Monitoring

### Xem Logs

```bash
# MongoDB logs
docker logs solarlogger-mongodb

# Mongo Express logs
docker logs solarlogger-mongo-express
```

### Kiểm Tra Status

```bash
# Container status
docker ps | grep mongodb

# Database stats (trong Mongo Express)
# Vào http://localhost:8082 → Click vào database → Xem statistics
```

## Tóm Tắt

### Tại Sao MongoDB?

1. **NoSQL**: Phù hợp với dữ liệu time-series (dữ liệu theo thời gian)
2. **Flexible Schema**: Dễ thêm/sửa fields
3. **TTL Indexes**: Tự động xóa dữ liệu cũ
4. **Performance**: Query nhanh với indexes
5. **Scalability**: Dễ scale horizontal

### Tại Sao Mongo Express?

1. **Web UI**: Dễ sử dụng, không cần cài đặt
2. **Debug**: Xem dữ liệu realtime
3. **Quản lý**: Insert/Update/Delete dễ dàng
4. **Docker**: Tích hợp tốt với container
5. **Free**: Open source, miễn phí

---

**Kết luận:** MongoDB + Mongo Express là giải pháp phù hợp cho hệ thống IoT/SolarLogger vì tính linh hoạt, hiệu suất và dễ quản lý.

