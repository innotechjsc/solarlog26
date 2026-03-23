# Hướng Dẫn Sử Dụng Dashboard VPower

## 🚀 Truy Cập Dashboard

### Overview Dashboard (Tổng Quan)
```
http://localhost:5023/dashboard/overview.html
```

### Monitoring Dashboard (Giám Sát)
```
http://localhost:5023/dashboard/monitoring.html
```

---

## 📊 Overview Dashboard

### Tính Năng

1. **Financial & Production Metrics**
   - Doanh thu hôm nay
   - Tổng doanh thu
   - Sản lượng hôm nay
   - Tổng sản lượng
   - Năng lượng sạc/xả hôm nay

2. **Status Gauges**
   - Tổng nhà máy với breakdown (Bình thường, Lỗi, Ngắt kết nối)
   - Tổng cảnh báo với breakdown (Nghiêm trọng, Lớn, Nhỏ, Cảnh báo)

3. **Environmental Impact**
   - Than tiêu chuẩn tiết kiệm
   - CO2 tránh được
   - Tương đương cây trồng

4. **Map**
   - Bản đồ hiển thị vị trí các nhà máy
   - Click marker để xem thông tin chi tiết

---

## 🔍 Monitoring Dashboard

### Sidebar - Device Tree

1. **Hierarchical Structure**
   ```
   ▼ Chủ đầu tư
     ▼ VPower Energy
       ▼ Nhà máy Điện mặt trời A
         ▼ Logger-47107201
           - Inverter-1
           - Meter-1
           - Battery-1
   ```

2. **Search**: Nhập tên thiết bị để tìm kiếm

3. **Click device**: Chọn device để xem dữ liệu chi tiết

### Power Flow Diagram

- Hiển thị real-time power flow:
  - PV → Battery
  - PV → Load
  - Battery → Load
  - Battery → Grid
  - Grid → Load
- Cập nhật tự động mỗi 30 giây

### Plant Power Graph

- **Tab "Công suất"**: Hiển thị 6 lines:
  - To Grid (light blue)
  - To Home (green)
  - To Battery (light green)
  - From Battery (orange)
  - From Solar (dark blue)
  - From Grid (grey)

- **Tab "Năng lượng"**: Hiển thị energy data

### Energy Management

- **Tabs**: Ngày | Tháng | Năm | Trọn đời
- **Date Selector**: Chọn ngày để xem dữ liệu
- **Summary Metrics**:
  - Sản sinh từ PV
  - Tiêu thụ
  - Cấp vào lưới
  - Tiêu thụ bởi thiết bị
  - Từ PV / Từ lưới
- **Chart**: Line chart với 5 datasets

### Revenue Section

- **Tabs**: Tháng | Năm | Trọn đời
- **Month Selector**: Chọn tháng để xem
- **Bar Chart**: Doanh thu theo ngày

---

## ⚙️ Cấu Hình

### 1. Set Electricity Price cho Project

```javascript
// Trong MongoDB
db.projects.updateOne(
  { code: "PROJECT_CODE" },
  { $set: { electricity_price: 2000 } } // VND/kWh
)
```

Hoặc qua Admin Panel:
- Truy cập: `http://localhost:5023/admin`
- Chọn Project → Edit → Set `electricity_price`

### 2. Set Location Coordinates cho Project

```javascript
// Trong MongoDB
db.projects.updateOne(
  { code: "PROJECT_CODE" },
  { $set: { 
    "location.latitude": 16.0583,
    "location.longitude": 108.2772
  }}
)
```

### 3. Device Data Format

Để hiển thị đầy đủ, device cần gửi data với format:

```json
{
  "device_id": "SL-2025-0001",
  "timestamp": "2025-01-01T00:00:00Z",
  "system": {
    "total_ac_power": 450.5,
    "energy_5min": 37.54
  },
  "battery": {
    "soc": 93,
    "charge_power": 0.5,
    "discharge_power": 0.0,
    "charge_energy_today": 245.3,
    "discharge_energy_today": 198.7
  },
  "power_flow": {
    "pv_to_grid": 0.0,
    "pv_to_home": 0.904,
    "pv_to_battery": 0.5,
    "battery_to_home": 0.0,
    "battery_to_grid": 0.0,
    "grid_to_home": 0.0
  }
}
```

---

## 🔄 Auto Refresh

- **Overview Dashboard**: Tự động refresh mỗi 5 phút
- **Power Flow Diagram**: Tự động refresh mỗi 30 giây
- **Charts**: Refresh khi chọn device mới hoặc thay đổi date selector

---

## 🐛 Troubleshooting

### 1. Không hiển thị dữ liệu

**Nguyên nhân**: Chưa có dữ liệu trong database

**Giải pháp**:
```bash
# Chạy script insert test data
node scripts/insert-test-data.js
node scripts/aggregate-existing-data.js
```

### 2. Revenue = 0

**Nguyên nhân**: Project chưa có `electricity_price`

**Giải pháp**: Set `electricity_price` cho project (xem phần Cấu Hình)

### 3. Map không hiển thị

**Nguyên nhân**: Project chưa có location coordinates

**Giải pháp**: Set `latitude` và `longitude` cho project (xem phần Cấu Hình)

### 4. Power Flow Diagram không có dữ liệu

**Nguyên nhân**: Device chưa gửi `power_flow` data

**Giải pháp**: Cập nhật device để gửi `power_flow` trong DataPoint

### 5. Battery data = 0

**Nguyên nhân**: Device chưa gửi `battery` data

**Giải pháp**: Cập nhật device để gửi `battery` trong DataPoint

---

## 📱 Responsive Design

Dashboard hỗ trợ responsive:
- **Desktop**: Full layout với sidebar
- **Tablet**: Sidebar collapse thành dropdown
- **Mobile**: Stack layout, simplified views

---

## 🔐 Security

- Navigation bar có notification badge
- User menu (có thể tích hợp authentication)
- Help button link đến API documentation

---

## 📚 API Endpoints Sử Dụng

### Overview Dashboard
- `/api/v1/analytics/revenue?period=today`
- `/api/v1/analytics/environmental?period=lifetime`
- `/api/v1/analytics/plants/status`
- `/api/v1/analytics/alarms?aggregate=true`
- `/api/v1/projects/locations`

### Monitoring Dashboard
- `/api/v1/projects`
- `/api/v1/projects/:projectId/areas`
- `/api/v1/areas/:areaId/devices`
- `/api/v1/devices/:deviceId/components`
- `/api/v1/devices/:deviceId/realtime`
- `/api/v1/devices/:deviceId/history`
- `/api/v1/analytics/energy-management`
- `/api/v1/analytics/revenue`

---

## ✅ Checklist

- [x] Overview Dashboard hoạt động
- [x] Monitoring Dashboard hoạt động
- [x] Device Tree sidebar hoạt động
- [x] Power Flow Diagram hiển thị
- [x] Charts hiển thị đúng
- [x] Map hiển thị locations
- [x] Auto refresh hoạt động
- [x] Responsive design

---

## 🎯 Next Steps

1. **Tích hợp Authentication**: Thêm user login/logout
2. **Export Data**: Thêm chức năng export PDF/Excel
3. **Notifications**: Real-time notifications khi có alarm
4. **Historical Comparison**: So sánh dữ liệu giữa các kỳ
5. **Custom Dashboards**: Cho phép user tạo dashboard tùy chỉnh

