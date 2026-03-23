# 🚀 API Endpoints mới cho Payload 0.9.0

**Ngày**: 2026-01-06  
**Version**: 0.9.0

---

## 📋 Tổng quan

Tài liệu này mô tả các API endpoints mới được thêm vào để hỗ trợ các tính năng giám sát và báo cáo nâng cao với payload schema 0.9.0.

---

## ✅ Các Endpoints mới

### 1. Battery Health Analytics

**Endpoint**: `GET /api/v1/analytics/battery-health`

**Mô tả**: Lấy dữ liệu sức khỏe pin (SOH, SOC) theo thời gian

**Query Parameters**:
- `deviceId` (optional): ID thiết bị
- `projectId` (optional): ID dự án (nếu không có deviceId)
- `period` (optional): Khoảng thời gian (`7days`, `30days`, `1year`). Default: `30days`

**Response**:
```json
{
  "status": "success",
  "analytics": {
    "period": "30days",
    "statistics": {
      "current_soh": 85.5,
      "current_soc": 72.3,
      "avg_soh": 86.2,
      "avg_soc": 70.5,
      "min_soh": 84.0,
      "max_soh": 88.0,
      "soh_trend": -0.5
    },
    "daily_data": [
      {
        "date": "2026-01-01",
        "soh": "85.5",
        "soc": "72.3",
        "voltage": "48.2",
        "current": "12.5",
        "charge_energy": 5.2,
        "discharge_energy": 3.8
      }
    ]
  }
}
```

**Ví dụ sử dụng**:
```bash
curl -X GET "http://localhost:5023/api/v1/analytics/battery-health?deviceId=DEV001&period=30days"
```

---

### 2. Grid Interaction Analytics

**Endpoint**: `GET /api/v1/analytics/grid-interaction`

**Mô tả**: Lấy dữ liệu tương tác với lưới điện (import/export, frequency)

**Query Parameters**:
- `deviceId` (optional): ID thiết bị
- `projectId` (optional): ID dự án
- `period` (optional): Khoảng thời gian. Default: `30days`

**Response**:
```json
{
  "status": "success",
  "analytics": {
    "period": "30days",
    "statistics": {
      "total_import_energy": "1250.50",
      "total_export_energy": "3420.80",
      "net_energy": "2170.30",
      "avg_frequency": "50.02",
      "min_frequency": "49.85",
      "max_frequency": "50.15",
      "frequency_stability": "98.5"
    },
    "daily_data": [
      {
        "date": "2026-01-01",
        "import_energy": "45.20",
        "export_energy": "120.50",
        "frequency": "50.01",
        "zero_export_enabled": true
      }
    ]
  }
}
```

**Ví dụ sử dụng**:
```bash
curl -X GET "http://localhost:5023/api/v1/analytics/grid-interaction?projectId=PROJ001&period=30days"
```

---

### 3. Temperature Analytics

**Endpoint**: `GET /api/v1/analytics/temperature`

**Mô tả**: Lấy dữ liệu nhiệt độ thiết bị theo thời gian

**Query Parameters**:
- `deviceId` (optional): ID thiết bị
- `projectId` (optional): ID dự án
- `period` (optional): Khoảng thời gian. Default: `30days`

**Response**:
```json
{
  "status": "success",
  "analytics": {
    "period": "30days",
    "statistics": {
      "current_inverter_temp": "45.2",
      "current_ambient_temp": "28.5",
      "avg_inverter_temp": "42.8",
      "avg_ambient_temp": "27.3",
      "max_inverter_temp": "58.5",
      "min_inverter_temp": "35.2",
      "temp_difference": "16.7"
    },
    "daily_data": [
      {
        "date": "2026-01-01",
        "inverter_temp": "45.2",
        "ambient_temp": "28.5",
        "heatsink_temp": "48.3",
        "transformer_temp": null
      }
    ]
  }
}
```

**Ví dụ sử dụng**:
```bash
curl -X GET "http://localhost:5023/api/v1/analytics/temperature?deviceId=DEV001&period=7days"
```

---

### 4. Operating State Analytics

**Endpoint**: `GET /api/v1/analytics/operating-state`

**Mô tả**: Lấy dữ liệu trạng thái vận hành (work mode, grid mode) theo thời gian

**Query Parameters**:
- `deviceId` (optional): ID thiết bị
- `projectId` (optional): ID dự án
- `period` (optional): Khoảng thời gian. Default: `30days`

**Response**:
```json
{
  "status": "success",
  "analytics": {
    "period": "30days",
    "statistics": {
      "avg_normal_percent": "95.5",
      "avg_standby_percent": "3.2",
      "avg_fault_percent": "1.3",
      "avg_on_grid_percent": "98.7",
      "avg_off_grid_percent": "1.3",
      "uptime_percent": "95.5"
    },
    "daily_data": [
      {
        "date": "2026-01-01",
        "normal": "96.5",
        "standby": "2.5",
        "fault": "1.0",
        "on_grid": "99.0",
        "off_grid": "1.0"
      }
    ]
    }
  }
}
```

**Ví dụ sử dụng**:
```bash
curl -X GET "http://localhost:5023/api/v1/analytics/operating-state?projectId=PROJ001&period=30days"
```

---

### 5. Demand Forecast

**Endpoint**: `GET /api/v1/analytics/demand-forecast`

**Mô tả**: Dự đoán nhu cầu năng lượng sử dụng machine learning đơn giản

**Query Parameters**:
- `deviceId` (optional): ID thiết bị
- `projectId` (optional): ID dự án
- `days` (optional): Số ngày dự đoán. Default: `7`

**Response**:
```json
{
  "status": "success",
  "forecast": {
    "days": 7,
    "predicted": [120.5, 125.3, 118.7, 130.2, 128.5, 122.1, 119.8],
    "dates": ["2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10", "2026-01-11", "2026-01-12", "2026-01-13"],
    "confidence": "85.5",
    "trend": "2.3",
    "methodology": "moving_average_with_seasonality",
    "historical_data": {
      "dates": ["2026-01-01", "2026-01-02", ...],
      "energy": [115.2, 118.5, ...],
      "avg": "120.5",
      "std_dev": "8.2"
    }
  }
}
```

**Ví dụ sử dụng**:
```bash
curl -X GET "http://localhost:5023/api/v1/analytics/demand-forecast?deviceId=DEV001&days=7"
```

**Phương pháp dự đoán**:
- Sử dụng Moving Average với Seasonality
- Tính toán trend từ dữ liệu lịch sử
- Áp dụng pattern theo ngày trong tuần
- Có thể nâng cấp lên ARIMA, LSTM trong tương lai

---

## 🔄 Backward Compatibility

Tất cả các endpoints đều hỗ trợ:
- ✅ Schema cũ (< 0.9.0)
- ✅ Schema mới (>= 0.9.0)
- ✅ Tự động detect `schema_version`
- ✅ Fallback khi field không có

---

## 📊 Data Aggregation

Các endpoints này sử dụng:
- **DataPoint**: Raw data từ thiết bị
- **HourlySummary**: Dữ liệu tổng hợp theo giờ
- **DailySummary**: Dữ liệu tổng hợp theo ngày

**Lưu ý**: 
- Dữ liệu được aggregate từ DataPoint để đảm bảo độ chính xác
- Giới hạn 5000-10000 records mỗi query để đảm bảo performance
- Có thể cache kết quả cho các query thường xuyên

---

## 🚀 Performance Optimization

### Caching Strategy
- Cache kết quả trong 5 phút cho các query thường xuyên
- Invalidate cache khi có dữ liệu mới

### Query Optimization
- Sử dụng indexes trên `device_id`, `timestamp`
- Limit số lượng records được query
- Aggregate tại database level khi có thể

### Future Improvements
- [ ] Redis caching layer
- [ ] Materialized views cho daily summaries
- [ ] Background jobs cho pre-aggregation
- [ ] GraphQL API cho flexible queries

---

## 📝 Error Handling

Tất cả endpoints trả về format chuẩn:

**Success**:
```json
{
  "status": "success",
  "analytics": { ... }
}
```

**Error**:
```json
{
  "status": "error",
  "message": "Error description"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (missing parameters)
- `500`: Internal Server Error

---

## 🔐 Authentication

Tất cả endpoints yêu cầu:
- API Key trong header: `X-API-Key: your-api-key`
- Hoặc session authentication (nếu có)

---

## 📚 Integration với Frontend

Các endpoints này được sử dụng trong:
- `reports/app.js`: Render charts
- `dashboard/js/overview.js`: Display widgets
- `dashboard/js/monitoring.js`: Real-time monitoring

**Ví dụ integration**:
```javascript
async function loadBatteryHealth() {
  const response = await fetch(`${API_BASE}/analytics/battery-health?deviceId=${deviceId}&period=30days`);
  const result = await response.json();
  
  if (result.status === 'success') {
    // Render chart with result.analytics.daily_data
  }
}
```

---

## 🎯 Next Steps

### 1. Advanced Forecasting
- [ ] ARIMA model implementation
- [ ] LSTM neural network
- [ ] Weather data integration
- [ ] Multi-variate forecasting

### 2. Real-time Updates
- [ ] WebSocket support
- [ ] Server-Sent Events (SSE)
- [ ] Push notifications

### 3. Advanced Analytics
- [ ] Anomaly detection
- [ ] Predictive maintenance
- [ ] Energy optimization recommendations
- [ ] Cost analysis

### 4. Export & Reporting
- [ ] PDF report generation
- [ ] Excel export
- [ ] Scheduled reports
- [ ] Email notifications

---

**Tác giả**: AI Assistant  
**Ngày**: 2026-01-06

