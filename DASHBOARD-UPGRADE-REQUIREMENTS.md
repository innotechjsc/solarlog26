# Yêu Cầu Nâng Cấp Dashboard - Tham Khảo VPower

## Tổng Quan

Dựa trên ảnh tham khảo hệ thống VPower, đây là danh sách các thay đổi cần thiết để nâng cấp dashboard hiện tại.

---

## 1. GIAO DIỆN VÀ NAVIGATION

### 1.1 Top Navigation Bar
**Hiện tại:** Header đơn giản với logo và subtitle
**Cần thay đổi:**
- ✅ Logo VPower với icon lightning bolt
- ✅ Menu navigation: "Tổng quan", "Giám sát", "Hiệu suất", "Bảo trì", "Chẩn đoán AI"
- ✅ Language selector: "Tiếng Việt" với dropdown
- ✅ Timezone selector: "UTC+7 (Hà Nội)" với dropdown
- ✅ Notification bell icon với badge
- ✅ Help icon
- ✅ User profile icon

**Files cần sửa:**
- `dashboard/index.html` - Thêm navigation bar
- `reports/index.html` - Thêm navigation bar
- Tạo `shared/navbar.html` hoặc component chung

---

## 2. DỮ LIỆU VÀ TÍNH TOÁN

### 2.1 Revenue (Doanh thu)
**Hiện tại:** ❌ Chưa có
**Cần thêm:**
- Doanh thu hôm nay (tính từ energy * giá điện)
- Tổng doanh thu (tổng tích lũy)
- Doanh thu theo tháng/năm/trọn đời
- Biểu đồ doanh thu theo ngày

**Cần làm:**
1. Thêm field `electricity_price` vào Project model (VND/kWh)
2. Tạo API endpoint `/api/v1/analytics/revenue`
3. Tính toán revenue từ DailySummary:
   - Revenue = total_energy * electricity_price
4. Lưu revenue vào DailySummary hoặc tạo collection riêng `RevenueSummary`

**Files cần sửa:**
- `models/Project.js` - Thêm electricity_price
- `models/DailySummary.js` - Thêm revenue field (optional)
- `routes/analytics.js` - Thêm revenue endpoint
- `services/aggregationService.js` - Tính revenue khi aggregate

---

### 2.2 Battery/Energy Storage (Pin)
**Hiện tại:** ❌ Chưa có
**Cần thêm:**
- Năng lượng đã sạc hôm nay (kWh)
- Năng lượng đã xả hôm nay (kWh)
- Battery SOC (State of Charge) %
- Power flow: PV → Battery, Battery → Load, Battery → Grid

**Cần làm:**
1. Thêm battery data vào DataPoint model:
   ```javascript
   battery: {
     soc: Number,        // State of charge %
     charge_power: Number, // Power charging (kW)
     discharge_power: Number, // Power discharging (kW)
     charge_energy_today: Number, // Energy charged today (kWh)
     discharge_energy_today: Number // Energy discharged today (kWh)
   }
   ```
2. Cập nhật aggregation service để tính battery metrics
3. Tạo API endpoint `/api/v1/devices/:deviceId/battery`

**Files cần sửa:**
- `models/DataPoint.js` - Thêm battery schema
- `models/DailySummary.js` - Thêm battery summary
- `services/aggregationService.js` - Aggregate battery data
- `routes/devices.js` - Thêm battery endpoint

---

### 2.3 Environmental Impact (Tác động môi trường)
**Hiện tại:** ❌ Chưa có
**Cần thêm:**
- Than tiêu chuẩn tiết kiệm (tấn)
- CO2 tránh được (tấn)
- Tương đương cây trồng (cây)

**Công thức tính:**
- Coal saved (tấn) = Energy (MWh) * 0.4 (tấn/MWh)
- CO2 avoided (tấn) = Energy (MWh) * 0.5 (tấn/MWh)
- Trees equivalent = CO2 avoided (tấn) * 1.4 (cây/tấn)

**Cần làm:**
1. Tạo API endpoint `/api/v1/analytics/environmental`
2. Tính toán từ total energy production
3. Cache kết quả trong DailySummary hoặc tính real-time

**Files cần sửa:**
- `routes/analytics.js` - Thêm environmental endpoint
- `models/DailySummary.js` - Thêm environmental fields (optional)

---

### 2.4 Plant Status Aggregation (Tổng hợp trạng thái nhà máy)
**Hiện tại:** Chỉ có device-level status
**Cần thêm:**
- Tổng số nhà máy (plants)
- Breakdown theo status: Bình thường, Lỗi, Ngắt kết nối
- Circular gauge chart hiển thị status

**Cần làm:**
1. Tạo API endpoint `/api/v1/analytics/plants/status`
2. Aggregate từ Device collection:
   - Group by project/area
   - Count by status (online/offline/error)
3. Tính % cho gauge chart

**Files cần sửa:**
- `routes/analytics.js` - Thêm plant status endpoint
- `models/Device.js` - Đảm bảo có status field

---

### 2.5 Alert Aggregation (Tổng hợp cảnh báo)
**Hiện tại:** Chỉ có device-level alarms
**Cần thêm:**
- Tổng số cảnh báo
- Breakdown theo severity: Nghiêm trọng, Lớn, Nhỏ, Cảnh báo
- Circular gauge chart

**Cần làm:**
1. Cập nhật API `/api/v1/analytics/alarms` để aggregate toàn hệ thống
2. Thêm query parameter `aggregate=true` để lấy tổng hợp

**Files cần sửa:**
- `routes/analytics.js` - Cập nhật alarms endpoint

---

## 3. HIỂN THỊ VÀ VISUALIZATION

### 3.1 Overview Dashboard (Tổng quan)
**Hiện tại:** Dashboard đơn giản với stats cards và charts
**Cần thay đổi:**

#### Layout mới:
1. **Top Row - Financial & Production:**
   - Doanh thu hôm nay: 2.450.000 VND
   - Tổng doanh thu: 125.800.000 VND
   - Sản lượng hôm nay: 1245.8 kWh
   - Tổng sản lượng: 246.8 MWh
   - Năng lượng đã sạc hôm nay: 245.3 kWh
   - Năng lượng đã xả hôm nay: 198.7 kWh

2. **Middle Row - Status & Alerts:**
   - Tổng nhà máy: Circular gauge (25 plants)
     - Legend: Bình thường (20), Lỗi (3), Ngắt kết nối (2)
   - Tổng cảnh báo: Circular gauge (3 alerts)
     - Legend: Nghiêm trọng (0), Lớn (2), Nhỏ (1), Cảnh báo (0)

3. **Right Column - Environmental:**
   - Than tiêu chuẩn tiết kiệm: 104.70 tấn
   - CO2 tránh được: 126.41 tấn
   - Tương đương cây trồng: 176 cây

4. **Bottom - Map:**
   - Bản đồ hiển thị vị trí các nhà máy
   - Markers cho từng plant
   - Info popup khi click marker

**Files cần sửa:**
- `dashboard/index.html` - Redesign layout
- Tạo `dashboard/overview.html` - Trang tổng quan mới
- Thêm map library (Leaflet hoặc Google Maps)

---

### 3.2 Monitoring Dashboard (Giám sát)
**Hiện tại:** Device selector dropdown
**Cần thay đổi:**

#### Left Sidebar - Device Tree:
```
▼ Chủ đầu tư
  ▼ VPower Energy
    ▼ Nhà máy Điện mặt trời A
      ▼ Logger-47107201
        - Inverter-1
        - Meter-1
        - Battery-1
      ► Logger-47107202
      ► Logger-47107203
```

**Cần làm:**
1. Tạo hierarchical API endpoint:
   - `/api/v1/projects` - List projects
   - `/api/v1/projects/:projectId/areas` - List areas
   - `/api/v1/areas/:areaId/devices` - List devices
   - `/api/v1/devices/:deviceId/components` - List components (inverters, meters, batteries)

2. Tạo sidebar component với tree view
3. Search functionality: "Q Nhập tên thiết bị"

**Files cần sửa:**
- `routes/projects.js` - Thêm endpoints (nếu chưa có)
- `routes/areas.js` - Thêm endpoints (nếu chưa có)
- `routes/devices.js` - Thêm components endpoint
- `dashboard/index.html` - Thêm sidebar
- Tạo `dashboard/monitoring.html` - Trang giám sát mới

---

### 3.3 Power Flow Diagram (Sơ đồ dòng công suất)
**Hiện tại:** ❌ Chưa có
**Cần thêm:**
- Real-time power flow visualization:
  ```
  PV (2.707 kW) → Battery (93%, 0.500 kW)
  PV → Load (0.904 kW)
  Battery → Load
  Grid (0.000 kW) - Nối lưới
  ```
- Arrows showing direction
- Values updating in real-time

**Cần làm:**
1. Tạo component `PowerFlowDiagram`
2. Sử dụng SVG hoặc Canvas
3. Real-time data từ `/api/v1/devices/:deviceId/realtime`

**Files cần tạo:**
- `dashboard/js/power-flow.js` - Power flow component
- `dashboard/css/power-flow.css` - Styling

---

### 3.4 Plant Power Graph (Biểu đồ công suất nhà máy)
**Hiện tại:** Chỉ có single line chart
**Cần thay đổi:**
- Multiple lines:
  - To Grid (light blue)
  - To Home (green)
  - To Battery (light green)
  - From Battery (orange)
  - From Solar (dark blue)
  - From Grid (grey)
- Tabs: "Công suất" / "Năng lượng"
- Time range: 24 hours (00:00 - 23:00)

**Cần làm:**
1. Cập nhật DataPoint model để có power flow data
2. Cập nhật aggregation để tính power flow
3. Cập nhật chart để hiển thị multiple datasets

**Files cần sửa:**
- `models/DataPoint.js` - Thêm power flow fields
- `dashboard/index.html` - Cập nhật chart
- `services/aggregationService.js` - Aggregate power flow

---

### 3.5 Energy Management Section (Quản lý năng lượng)
**Hiện tại:** ❌ Chưa có
**Cần thêm:**
- Tabs: Ngày, Tháng, Năm, Trọn đời
- Date selector với arrows
- Summary metrics:
  - Sản sinh từ PV: 0.00 kWh
  - Tiêu thụ (kWh): 0.00
  - Cấp vào lưới (kWh): 0.00 (0.00%)
  - Tiêu thụ bởi thiết bị: 1.77 kWh
  - Từ PV (kWh): 0.00 (0.00%)
  - Từ lưới (kWh): 1.79 (100.00%)
- Line graph với multiple lines:
  - PV output (red)
  - Total consumption (orange)
  - Consumed from PV (green)
  - Battery SOC (light blue)
  - Battery (charge) (dark blue)

**Cần làm:**
1. Tạo API endpoint `/api/v1/analytics/energy-management`
2. Tính toán từ DataPoint và DailySummary
3. Tạo component `EnergyManagement`

**Files cần tạo:**
- `routes/analytics.js` - Thêm energy-management endpoint
- `dashboard/js/energy-management.js` - Component

---

### 3.6 Revenue Section (Doanh thu)
**Hiện tại:** ❌ Chưa có
**Cần thêm:**
- Tabs: Tháng, Năm, Trọn đời
- Date selector (month/year)
- Tổng doanh thu: 3.05K P (hoặc VND)
- Bar chart showing daily revenue

**Cần làm:**
1. Sử dụng revenue API đã tạo ở 2.1
2. Tạo component `RevenueChart`

**Files cần tạo:**
- `dashboard/js/revenue.js` - Revenue component

---

## 4. MAP INTEGRATION

### 4.1 Plant Location Map
**Hiện tại:** ❌ Chưa có
**Cần thêm:**
- Map showing Southeast Asia (Vietnam focus)
- Markers for each plant location
- Info popup khi click:
  - Peak Power: 300 kWp
  - PR Today: 0.0%
  - Energy Today: 0.00 kWh
  - Current Power: 0.0 kW

**Cần làm:**
1. Thêm location coordinates vào Project/Area model:
   ```javascript
   location: {
     address: String,
     latitude: Number,
     longitude: Number
   }
   ```
2. Tích hợp map library (Leaflet.js hoặc Google Maps)
3. Tạo API endpoint `/api/v1/projects/locations`

**Files cần sửa:**
- `models/Project.js` - Thêm location coordinates
- `models/Area.js` - Thêm location coordinates
- `routes/projects.js` - Thêm locations endpoint
- `dashboard/js/map.js` - Map component

---

## 5. DATABASE CHANGES

### 5.1 Models cần cập nhật:

#### Project Model:
```javascript
{
  // ... existing fields
  electricity_price: Number, // VND per kWh
  location: {
    address: String,
    latitude: Number,
    longitude: Number
  }
}
```

#### DataPoint Model:
```javascript
{
  // ... existing fields
  battery: {
    soc: Number,
    charge_power: Number,
    discharge_power: Number,
    charge_energy_today: Number,
    discharge_energy_today: Number
  },
  power_flow: {
    pv_to_grid: Number,
    pv_to_home: Number,
    pv_to_battery: Number,
    battery_to_home: Number,
    battery_to_grid: Number,
    grid_to_home: Number
  }
}
```

#### DailySummary Model:
```javascript
{
  // ... existing fields
  revenue: Number, // VND
  battery: {
    total_charge: Number,
    total_discharge: Number,
    avg_soc: Number
  },
  environmental: {
    coal_saved: Number, // tons
    co2_avoided: Number, // tons
    trees_equivalent: Number
  }
}
```

---

## 6. API ENDPOINTS CẦN THÊM

1. `GET /api/v1/analytics/revenue` - Revenue analytics
2. `GET /api/v1/analytics/environmental` - Environmental impact
3. `GET /api/v1/analytics/plants/status` - Plant status aggregation
4. `GET /api/v1/analytics/energy-management` - Energy management
5. `GET /api/v1/devices/:deviceId/battery` - Battery data
6. `GET /api/v1/devices/:deviceId/components` - Device components
7. `GET /api/v1/projects/locations` - All plant locations
8. `GET /api/v1/projects/:projectId/areas` - Areas in project
9. `GET /api/v1/areas/:areaId/devices` - Devices in area

---

## 7. PRIORITY IMPLEMENTATION ORDER

### Phase 1 - Core Data (Ưu tiên cao):
1. ✅ Revenue calculation và API
2. ✅ Battery/Energy storage data model
3. ✅ Environmental impact calculation
4. ✅ Power flow data tracking

### Phase 2 - UI Components (Ưu tiên trung bình):
5. ✅ Top navigation bar với menu
6. ✅ Overview dashboard layout mới
7. ✅ Monitoring dashboard với sidebar tree
8. ✅ Power flow diagram

### Phase 3 - Advanced Features (Ưu tiên thấp):
9. ✅ Map integration
10. ✅ Energy management section
11. ✅ Revenue charts
12. ✅ Plant power graph với multiple lines

---

## 8. FILES CẦN TẠO MỚI

1. `dashboard/overview.html` - Overview page
2. `dashboard/monitoring.html` - Monitoring page
3. `dashboard/js/power-flow.js` - Power flow component
4. `dashboard/js/energy-management.js` - Energy management
5. `dashboard/js/revenue.js` - Revenue charts
6. `dashboard/js/map.js` - Map component
7. `dashboard/js/device-tree.js` - Device tree sidebar
8. `shared/navbar.html` - Shared navigation (nếu dùng)
9. `shared/footer.html` - Shared footer (nếu cần)

---

## 9. DEPENDENCIES CẦN THÊM

### Frontend:
- Leaflet.js (hoặc Google Maps API) - cho map
- Chart.js (đã có) - cho charts
- Font Awesome hoặc Material Icons - cho icons

### Backend:
- Không cần thêm dependencies (đã đủ)

---

## 10. TESTING CHECKLIST

- [ ] Revenue tính đúng từ energy * price
- [ ] Battery data hiển thị real-time
- [ ] Environmental impact tính đúng
- [ ] Plant status aggregation chính xác
- [ ] Alert aggregation chính xác
- [ ] Map hiển thị đúng locations
- [ ] Device tree navigation hoạt động
- [ ] Power flow diagram cập nhật real-time
- [ ] Charts hiển thị đúng dữ liệu
- [ ] Responsive design trên mobile

---

## NOTES

- Tất cả tính toán revenue, environmental impact nên cache trong DailySummary để tăng performance
- Map có thể dùng Leaflet.js (free) hoặc Google Maps (cần API key)
- Device tree có thể dùng library như `react-tree-view` hoặc tự implement với vanilla JS
- Power flow diagram có thể dùng SVG hoặc Canvas, hoặc library như `mermaid.js`

