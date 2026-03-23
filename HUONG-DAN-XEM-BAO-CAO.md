# Hướng Dẫn Xem Báo Cáo - Vị Trí Các Thông Tin

## 📍 Vị Trí Các Thông Tin Trong Hình

Dựa trên hình ảnh tham khảo, đây là nơi xem các thông tin báo cáo:

---

## 🏠 1. OVERVIEW DASHBOARD (Tổng Quan)

**URL**: `http://localhost:5023/dashboard/overview.html`

### A. Financial & Production Metrics (Hàng trên)

#### Doanh thu hôm nay
- **Vị trí**: Card đầu tiên bên trái
- **API**: `/api/v1/analytics/revenue?period=today`
- **Hiển thị**: `revenueToday` element
- **Format**: 2.450.000 VND

#### Tổng doanh thu
- **Vị trí**: Card thứ 2
- **API**: `/api/v1/analytics/revenue?period=lifetime`
- **Hiển thị**: `totalRevenue` element
- **Format**: 125.800.000 VND

#### Sản lượng hôm nay
- **Vị trí**: Card thứ 3
- **API**: `/api/v1/analytics/energy?period=7days` (lấy ngày cuối)
- **Hiển thị**: `energyToday` element
- **Format**: 1245.8 kWh

#### Tổng sản lượng
- **Vị trí**: Card thứ 4
- **API**: `/api/v1/analytics/energy?period=lifetime`
- **Hiển thị**: `totalEnergy` element
- **Format**: 246.8 MWh

#### Năng lượng đã sạc/xả hôm nay
- **Vị trí**: Card 5 và 6
- **API**: `/api/v1/devices/:deviceId/battery` (aggregate tất cả devices)
- **Hiển thị**: `chargeToday`, `dischargeToday` elements
- **Format**: 245.3 kWh / 198.7 kWh

---

### B. Status & Alerts (Hàng giữa)

#### Tổng nhà máy (Gauge Chart)
- **Vị trí**: Card bên trái, gauge chart
- **API**: `/api/v1/analytics/plants/status`
- **Hiển thị**: 
  - Gauge: `plantGauge` canvas
  - Count: `plantCount` element
  - Breakdown: `plantNormal`, `plantError`, `plantDisconnected`
- **Dữ liệu**:
  - Bình thường: 20 (green)
  - Lỗi: 3 (yellow)
  - Ngắt kết nối: 2 (red)

#### Tổng cảnh báo (Gauge Chart)
- **Vị trí**: Card giữa, gauge chart
- **API**: `/api/v1/analytics/alarms?aggregate=true`
- **Hiển thị**:
  - Gauge: `alertGauge` canvas
  - Count: `alertCount` element
  - Breakdown: `alertCritical`, `alertMajor`, `alertMinor`, `alertWarning`
- **Dữ liệu**:
  - Nghiêm trọng: 0 (red)
  - Lớn: 2 (orange)
  - Nhỏ: 1 (yellow)
  - Cảnh báo: 0 (blue)

---

### C. Environmental Impact (Cột phải)

#### Than tiêu chuẩn tiết kiệm
- **Vị trí**: Card bên phải, item đầu tiên
- **API**: `/api/v1/analytics/environmental?period=lifetime`
- **Hiển thị**: `coalSaved` element
- **Format**: 104.70 (tấn)
- **Công thức**: Energy (MWh) × 0.4

#### CO2 tránh được
- **Vị trí**: Card bên phải, item thứ 2
- **API**: `/api/v1/analytics/environmental?period=lifetime`
- **Hiển thị**: `co2Avoided` element
- **Format**: 126.41 (tấn)
- **Công thức**: Energy (MWh) × 0.5

#### Tương đương cây trồng
- **Vị trí**: Card bên phải, item thứ 3
- **API**: `/api/v1/analytics/environmental?period=lifetime`
- **Hiển thị**: `treesEquivalent` element
- **Format**: 176 (cây)
- **Công thức**: CO2 (tấn) × 1.4

---

### D. Map (Bản đồ nhà máy)

- **Vị trí**: Phần dưới cùng, full width
- **API**: `/api/v1/projects/locations`
- **Hiển thị**: `mapContainer` div với Leaflet.js
- **Features**:
  - Markers cho mỗi plant location
  - Popup hiển thị:
    - Peak Power: 300 kWp
    - PR Today: 0.0%
    - Energy Today: 0.00 kWh
    - Current Power: 0.0 kW

---

## 🔍 2. MONITORING DASHBOARD (Giám Sát)

**URL**: `http://localhost:5023/dashboard/monitoring.html`

### A. Summary Cards (Hàng trên)

#### Sản lượng hôm nay
- **Vị trí**: Card đầu tiên
- **API**: `/api/v1/analytics/energy?deviceId=xxx&period=7days`
- **Hiển thị**: `productionToday` element
- **Format**: 872.77 kWh

#### Than tiêu chuẩn tiết kiệm
- **Vị trí**: Card thứ 2
- **API**: `/api/v1/analytics/environmental?deviceId=xxx`
- **Hiển thị**: `coalSaved` element
- **Format**: 1.60 (tấn)

#### Tổng sản lượng
- **Vị trí**: Card thứ 3
- **API**: `/api/v1/analytics/energy?deviceId=xxx&period=lifetime`
- **Hiển thị**: `totalProduction` element
- **Format**: 125.80 kWh

#### CO2 tránh được
- **Vị trí**: Card thứ 4
- **API**: `/api/v1/analytics/environmental?deviceId=xxx`
- **Hiển thị**: `co2Avoided` element
- **Format**: 1.90 (tấn)

#### Tiêu thụ hôm nay
- **Vị trí**: Card thứ 5
- **API**: `/api/v1/analytics/energy-management?deviceId=xxx&period=day`
- **Hiển thị**: `consumptionToday` element
- **Format**: 0.45 kWh

#### Cây tương đương đã trồng
- **Vị trí**: Card thứ 6
- **API**: `/api/v1/analytics/environmental?deviceId=xxx`
- **Hiển thị**: `treesPlanted` element
- **Format**: 3 (cây)

#### Tiêu thụ từ PV
- **Vị trí**: Card thứ 7
- **API**: `/api/v1/analytics/energy-management?deviceId=xxx&period=day`
- **Hiển thị**: `consumptionFromPV` element
- **Format**: 0.81 kWh

---

### B. Power Flow Diagram (Sơ đồ dòng công suất)

- **Vị trí**: Section "CÔNG SUẤT HIỆN TẠI"
- **API**: `/api/v1/devices/:deviceId/realtime`
- **Hiển thị**: `powerFlowDiagram` SVG
- **Dữ liệu**:
  - PV: 2.707 kW
  - Pin (Battery): 93%, 0.500 kW
  - Tải (Load): 0.904 kW
  - Lưới (Grid): 0.000 kW
- **Cập nhật**: Real-time, mỗi 30 giây

---

### C. Plant Power Graph (Biểu đồ công suất nhà máy)

- **Vị trí**: Section "CÔNG SUẤT NHÀ MÁY"
- **API**: `/api/v1/devices/:deviceId/history?interval=5min`
- **Hiển thị**: `plantPowerChart` canvas (Chart.js)
- **Tabs**: 
  - "Công suất" (Power)
  - "Năng lượng" (Energy)
- **Lines**:
  - To Grid (light blue)
  - To Home (green)
  - To Battery (light green)
  - From Battery (orange)
  - From Solar (dark blue)
  - From Grid (grey)

---

### D. Alerts Section (Cảnh báo)

- **Vị trí**: Section "CẢNH BÁO"
- **API**: `/api/v1/analytics/alarms?deviceId=xxx`
- **Hiển thị**: 
  - Count: `alertCount` element
  - Breakdown: `alertCritical`, `alertMajor`, `alertMinor`, `alertWarning`
- **Plant Details**:
  - Địa chỉ nhà máy: `plantAddress`
  - Tổng công suất chuỗi: `totalCapacity`
  - Ngày kết nối lưới: `gridConnectionDate`

---

### E. Energy Management (Quản lý năng lượng)

- **Vị trí**: Section "Quản lý năng lượng"
- **API**: `/api/v1/analytics/energy-management?deviceId=xxx&period=day&date=2025-11-18`
- **Tabs**: Ngày | Tháng | Năm | Trọn đời
- **Summary Metrics**:
  - Sản sinh từ PV: `pvOutput`
  - Tiêu thụ (kWh): `totalConsumption`
  - Cấp vào lưới: `fedToGrid` + `fedToGridPercent`
  - Tiêu thụ bởi thiết bị: `deviceConsumption`
  - Từ PV: `fromPV` + `fromPVPercent`
  - Từ lưới: `fromGrid` + `fromGridPercent`
- **Chart**: `energyManagementChart` với 5 lines:
  - PV output (red)
  - Total consumption (orange)
  - Consumed from PV (green)
  - Battery SOC (light blue)
  - Battery (charge) (dark blue)

---

### F. Revenue Section (Doanh thu)

- **Vị trí**: Section "Doanh thu"
- **API**: `/api/v1/analytics/revenue?deviceId=xxx&period=month`
- **Tabs**: Tháng | Năm | Trọn đời
- **Date Selector**: Month selector (2025-11)
- **Summary**: 
  - Tổng doanh thu: `totalRevenue` (3.05K P hoặc VND)
- **Chart**: `revenueChart` bar chart
  - X-axis: Days 01-30
  - Y-axis: Revenue (0-300)

---

## 📊 3. REPORTS PAGE (Báo Cáo Chi Tiết)

**URL**: `http://localhost:5023/reports`

### Metrics Cards:
- **Tổng Năng Lượng**: `/api/v1/reports/project/:projectId/detailed`
- **Trung Bình/Ngày**: Same API
- **Cao Nhất**: Same API
- **Hiệu Suất**: Same API

### Charts:
- **Sản Lượng và Dự Đoán**: Main chart với predictions
- **Mẫu Năng Lượng Theo Giờ**: Hourly pattern chart
- **Phân Bố Năng Lượng**: Distribution chart (doughnut)
- **Nhu Cầu Dự Kiến**: Demand forecast chart
- **Phân Tích Xu Hướng**: Trend analysis chart

### Insights:
- **Phân Tích và Khuyến Nghị**: Auto-generated insights

---

## 🔗 Tổng Hợp API Endpoints

### Overview Dashboard:
```
GET /api/v1/analytics/revenue?period=today
GET /api/v1/analytics/revenue?period=lifetime
GET /api/v1/analytics/energy?period=7days
GET /api/v1/analytics/energy?period=lifetime
GET /api/v1/devices/:deviceId/battery (aggregate all)
GET /api/v1/analytics/plants/status
GET /api/v1/analytics/alarms?aggregate=true
GET /api/v1/analytics/environmental?period=lifetime
GET /api/v1/projects/locations
```

### Monitoring Dashboard:
```
GET /api/v1/projects
GET /api/v1/projects/:projectId/areas
GET /api/v1/areas/:areaId/devices
GET /api/v1/devices/:deviceId/components
GET /api/v1/devices/:deviceId/realtime
GET /api/v1/devices/:deviceId/history?interval=5min
GET /api/v1/analytics/energy-management?deviceId=xxx&period=day
GET /api/v1/analytics/revenue?deviceId=xxx&period=month
GET /api/v1/analytics/alarms?deviceId=xxx
```

### Reports:
```
GET /api/v1/reports/project/:projectId/detailed?period=7days&predictDays=7
GET /api/v1/reports/area/:areaId/detailed?period=7days&predictDays=7
```

---

## 📝 Lưu Ý

1. **Overview Dashboard**: Hiển thị tổng hợp toàn hệ thống
2. **Monitoring Dashboard**: Hiển thị chi tiết theo device được chọn
3. **Reports**: Báo cáo chi tiết với predictions và insights

4. **Dữ liệu cần có**:
   - Projects với `electricity_price` để tính revenue
   - Projects với `location.latitude/longitude` để hiển thị map
   - Devices với `battery` data để hiển thị sạc/xả
   - Devices với `power_flow` data để hiển thị power flow diagram

5. **Auto Refresh**:
   - Overview: 5 phút
   - Power Flow: 30 giây
   - Charts: Khi chọn device mới hoặc thay đổi date selector

---

## 🎯 Quick Access

- **Overview**: http://localhost:5023/dashboard/overview.html
- **Monitoring**: http://localhost:5023/dashboard/monitoring.html
- **Reports**: http://localhost:5023/reports


