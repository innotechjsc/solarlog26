# Kiến trúc Hệ thống Backend SolarLogger

## Tổng quan

Hệ thống backend nhận dữ liệu từ SolarLogger devices qua HTTPS POST, lưu trữ vào MongoDB, và cung cấp dashboard, báo cáo, phân tích.

## Kiến trúc

```
SolarLogger Device (ESP32-S3)
    ↓ HTTPS POST
Backend API Server (Node.js/Express)
    ↓
MongoDB Database
    ↓
Dashboard Frontend (React/HTML)
```

## MongoDB Schema Design

### 1. Collection: `devices`
Lưu thông tin các SolarLogger devices

```javascript
{
  _id: ObjectId,
  device_id: "SL-2025-0001", // Unique
  site_name: "Factory ABC",
  location: "Ho Chi Minh City",
  timezone: "Asia/Ho_Chi_Minh",
  version: "0.9.0",
  total_inverters: 8,
  created_at: ISODate,
  updated_at: ISODate,
  status: "online" | "offline",
  last_seen: ISODate
}
```

### 2. Collection: `data_points`
Lưu dữ liệu 5-minute từ devices (retention: 7 days)

```javascript
{
  _id: ObjectId,
  device_id: "SL-2025-0001",
  timestamp: ISODate,
  timezone: "Asia/Ho_Chi_Minh",
  version: "0.9.0",
  system: {
    total_ac_power: 450.5,
    total_reactive_power: 120.3,
    avg_power_factor: 0.97,
    avg_frequency: 50.02,
    online_inverters: 8,
    total_inverters: 8,
    energy_5min: 37.54,
    system_state: "all_online"
  },
  inverters: [
    {
      id: 1,
      slave_address: 1,
      model: "SUN2000-10KTL",
      ac_power: 56.2,
      ac_voltage_l1: 230.5,
      ac_current_l1: 81.7,
      power_factor: 0.98,
      grid_frequency: 50.02,
      daily_yield: 45.3,
      device_state: "running",
      alarm_code: 0,
      efficiency: 97.8,
      internal_temp: 42.5
    }
  ],
  created_at: ISODate
}
```

**Indexes:**
- `{device_id: 1, timestamp: -1}`
- `{timestamp: -1}` (TTL index, expire after 7 days)

### 3. Collection: `hourly_summaries`
Tổng hợp theo giờ (retention: 1 year)

```javascript
{
  _id: ObjectId,
  device_id: "SL-2025-0001",
  hour: ISODate, // Start of hour
  total_energy: 450.5, // kWh
  max_power: 500.0, // kW
  min_power: 200.0, // kW
  avg_power: 375.0, // kW
  avg_power_factor: 0.97,
  avg_frequency: 50.02,
  online_inverters: 8,
  inverter_summaries: [
    {
      inverter_id: 1,
      energy: 56.2,
      max_power: 60.0,
      avg_power: 55.0,
      efficiency: 97.8
    }
  ],
  created_at: ISODate
}
```

**Indexes:**
- `{device_id: 1, hour: -1}`
- `{hour: -1}` (TTL index, expire after 1 year)

### 4. Collection: `daily_summaries`
Tổng hợp theo ngày (retention: 5 years)

```javascript
{
  _id: ObjectId,
  device_id: "SL-2025-0001",
  date: ISODate, // Start of day
  total_energy: 10800.5, // kWh
  max_power: 500.0, // kW
  min_power: 0.0, // kW
  avg_power: 450.0, // kW
  peak_hour: 12, // Hour with max power
  sunshine_hours: 6.5, // Hours with power > 0
  inverter_summaries: [
    {
      inverter_id: 1,
      energy: 1350.0,
      max_power: 60.0,
      avg_power: 55.0
    }
  ],
  created_at: ISODate
}
```

**Indexes:**
- `{device_id: 1, date: -1}`
- `{date: -1}` (TTL index, expire after 5 years)

### 5. Collection: `alarms`
Lưu lịch sử alarms (retention: 2 years)

```javascript
{
  _id: ObjectId,
  device_id: "SL-2025-0001",
  alarm_code: 2003,
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "WARNING",
  description: "Inverter #1 grid frequency fault",
  inverter_id: 1, // Optional
  start_time: ISODate,
  end_time: ISODate, // null if active
  status: "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED",
  current_value: 51.5,
  threshold: 51.0,
  acknowledged_by: "operator1", // Optional
  acknowledged_at: ISODate, // Optional
  created_at: ISODate
}
```

**Indexes:**
- `{device_id: 1, start_time: -1}`
- `{status: 1, severity: 1}`
- `{start_time: -1}` (TTL index, expire after 2 years)

## API Endpoints

### Data Ingestion
- `POST /api/v1/data` - Nhận data từ SolarLogger
- `POST /api/v1/alarms` - Nhận alarm notifications

### Dashboard & Analytics
- `GET /api/v1/devices` - Danh sách devices
- `GET /api/v1/devices/:deviceId/realtime` - Dữ liệu realtime
- `GET /api/v1/devices/:deviceId/history` - Lịch sử theo khoảng thời gian
- `GET /api/v1/devices/:deviceId/summary/hourly` - Tổng hợp theo giờ
- `GET /api/v1/devices/:deviceId/summary/daily` - Tổng hợp theo ngày
- `GET /api/v1/devices/:deviceId/alarms` - Danh sách alarms
- `GET /api/v1/analytics/performance` - Phân tích hiệu suất
- `GET /api/v1/analytics/energy` - Phân tích năng lượng

## Dashboard Features

1. **Real-time Monitoring**
   - Total power, energy
   - Inverter status
   - System health

2. **Historical Charts**
   - Power over time (hourly, daily, monthly)
   - Energy production
   - Efficiency trends

3. **Alarm Management**
   - Active alarms
   - Alarm history
   - Alarm statistics

4. **Reports**
   - Daily energy report
   - Performance analysis
   - Inverter comparison







