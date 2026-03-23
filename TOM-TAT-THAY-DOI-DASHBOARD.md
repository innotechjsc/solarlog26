# Tóm Tắt Thay Đổi Dashboard - Tham Khảo VPower

## 📋 Tổng Quan

Dựa trên ảnh tham khảo hệ thống VPower, đây là tóm tắt các thay đổi cần thiết để nâng cấp dashboard.

---

## 🎨 1. GIAO DIỆN (UI/UX)

### A. Top Navigation Bar
**Cần thêm:**
- Logo VPower với icon ⚡
- Menu: Tổng quan | Giám sát | Hiệu suất | Bảo trì | Chẩn đoán AI
- Language selector: Tiếng Việt
- Timezone selector: UTC+7 (Hà Nội)
- Notification bell 🔔
- Help icon ❓
- User profile icon 👤

### B. Overview Dashboard (Trang Tổng Quan)
**Layout mới gồm:**

1. **Hàng trên - Tài chính & Sản xuất:**
   - Doanh thu hôm nay: 2.450.000 VND
   - Tổng doanh thu: 125.800.000 VND
   - Sản lượng hôm nay: 1245.8 kWh
   - Tổng sản lượng: 246.8 MWh
   - Năng lượng sạc/xả hôm nay

2. **Hàng giữa - Trạng thái & Cảnh báo:**
   - Circular gauge: Tổng nhà máy (25)
   - Circular gauge: Tổng cảnh báo (3)
   - Legend breakdown theo status/severity

3. **Cột phải - Môi trường:**
   - Than tiêu chuẩn tiết kiệm: 104.70 tấn
   - CO2 tránh được: 126.41 tấn
   - Tương đương cây trồng: 176 cây

4. **Bản đồ:**
   - Hiển thị vị trí các nhà máy
   - Markers với popup thông tin

### C. Monitoring Dashboard (Trang Giám Sát)
**Cần thêm:**

1. **Sidebar trái - Device Tree:**
   ```
   ▼ Chủ đầu tư
     ▼ VPower Energy
       ▼ Nhà máy Điện mặt trời A
         ▼ Logger-47107201
           - Inverter-1
           - Meter-1
           - Battery-1
   ```
   - Search box: "Q Nhập tên thiết bị"
   - Expand/collapse tree

2. **Sơ đồ dòng công suất:**
   - PV → Battery → Load → Grid
   - Hiển thị giá trị real-time
   - Arrows chỉ hướng

3. **Biểu đồ công suất nhà máy:**
   - Multiple lines: To Grid, To Home, To Battery, From Battery, From Solar, From Grid
   - Tabs: Công suất / Năng lượng

4. **Quản lý năng lượng:**
   - Tabs: Ngày | Tháng | Năm | Trọn đời
   - Date selector
   - Summary metrics
   - Line graph với nhiều datasets

5. **Doanh thu:**
   - Tabs: Tháng | Năm | Trọn đời
   - Bar chart doanh thu theo ngày

---

## 💾 2. DỮ LIỆU VÀ TÍNH TOÁN

### A. Revenue (Doanh thu) ⚠️ CHƯA CÓ
**Cần làm:**
1. Thêm `electricity_price` vào Project (VND/kWh)
2. Tính: `Revenue = Energy (kWh) × Price (VND/kWh)`
3. API: `/api/v1/analytics/revenue`
4. Lưu vào DailySummary hoặc collection riêng

### B. Battery/Energy Storage ⚠️ CHƯA CÓ
**Cần làm:**
1. Thêm battery data vào DataPoint:
   - SOC (%), charge/discharge power, energy today
2. Tính năng lượng sạc/xả
3. API: `/api/v1/devices/:deviceId/battery`

### C. Environmental Impact ⚠️ CHƯA CÓ
**Công thức:**
- Than tiết kiệm (tấn) = Energy (MWh) × 0.4
- CO2 tránh (tấn) = Energy (MWh) × 0.5
- Cây tương đương = CO2 (tấn) × 1.4

**Cần làm:**
- API: `/api/v1/analytics/environmental`
- Tính từ total energy

### D. Plant Status Aggregation
**Cần làm:**
- API: `/api/v1/analytics/plants/status`
- Aggregate từ Device collection
- Group by project/area
- Count by status (online/offline/error)

### E. Alert Aggregation
**Cần làm:**
- Cập nhật `/api/v1/analytics/alarms`
- Aggregate toàn hệ thống
- Breakdown theo severity

---

## 🗄️ 3. DATABASE CHANGES

### Models cần cập nhật:

#### Project:
```javascript
electricity_price: Number, // VND/kWh
location: {
  address: String,
  latitude: Number,
  longitude: Number
}
```

#### DataPoint:
```javascript
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
```

#### DailySummary:
```javascript
revenue: Number, // VND
battery: {
  total_charge: Number,
  total_discharge: Number,
  avg_soc: Number
},
environmental: {
  coal_saved: Number,
  co2_avoided: Number,
  trees_equivalent: Number
}
```

---

## 🔌 4. API ENDPOINTS CẦN THÊM

1. `GET /api/v1/analytics/revenue` - Doanh thu
2. `GET /api/v1/analytics/environmental` - Tác động môi trường
3. `GET /api/v1/analytics/plants/status` - Trạng thái nhà máy
4. `GET /api/v1/analytics/energy-management` - Quản lý năng lượng
5. `GET /api/v1/devices/:deviceId/battery` - Dữ liệu pin
6. `GET /api/v1/devices/:deviceId/components` - Components (inverter, meter, battery)
7. `GET /api/v1/projects/locations` - Vị trí nhà máy
8. `GET /api/v1/projects/:projectId/areas` - Khu vực trong project
9. `GET /api/v1/areas/:areaId/devices` - Thiết bị trong khu vực

---

## 📁 5. FILES CẦN TẠO/SỬA

### Files mới:
- `dashboard/overview.html` - Trang tổng quan
- `dashboard/monitoring.html` - Trang giám sát
- `dashboard/js/power-flow.js` - Sơ đồ dòng công suất
- `dashboard/js/energy-management.js` - Quản lý năng lượng
- `dashboard/js/revenue.js` - Biểu đồ doanh thu
- `dashboard/js/map.js` - Bản đồ
- `dashboard/js/device-tree.js` - Device tree sidebar

### Files cần sửa:
- `dashboard/index.html` - Redesign
- `models/Project.js` - Thêm electricity_price, location
- `models/DataPoint.js` - Thêm battery, power_flow
- `models/DailySummary.js` - Thêm revenue, battery, environmental
- `routes/analytics.js` - Thêm endpoints
- `routes/devices.js` - Thêm battery, components endpoints
- `services/aggregationService.js` - Tính revenue, battery, environmental

---

## 🎯 6. PRIORITY (Ưu tiên)

### Phase 1 - Core Data (Cao):
1. ✅ Revenue calculation
2. ✅ Battery data model
3. ✅ Environmental impact
4. ✅ Power flow tracking

### Phase 2 - UI Components (Trung bình):
5. ✅ Top navigation bar
6. ✅ Overview dashboard
7. ✅ Monitoring dashboard với sidebar
8. ✅ Power flow diagram

### Phase 3 - Advanced (Thấp):
9. ✅ Map integration
10. ✅ Energy management section
11. ✅ Revenue charts
12. ✅ Plant power graph

---

## 📦 7. DEPENDENCIES

### Frontend:
- Leaflet.js (hoặc Google Maps) - cho map
- Chart.js (đã có) - cho charts
- Font Awesome - cho icons

### Backend:
- Không cần thêm (đã đủ)

---

## ✅ 8. CHECKLIST

### Data & API:
- [ ] Revenue API hoạt động
- [ ] Battery API hoạt động
- [ ] Environmental API hoạt động
- [ ] Plant status API hoạt động
- [ ] Alert aggregation hoạt động

### UI:
- [ ] Navigation bar hiển thị đúng
- [ ] Overview dashboard layout đúng
- [ ] Monitoring dashboard với sidebar
- [ ] Power flow diagram real-time
- [ ] Charts hiển thị đúng
- [ ] Map hiển thị locations

### Testing:
- [ ] Revenue tính đúng
- [ ] Battery data chính xác
- [ ] Environmental impact đúng
- [ ] Responsive trên mobile

---

## 📝 NOTES

- Cache revenue, environmental trong DailySummary để tăng performance
- Map: Leaflet.js (free) hoặc Google Maps (cần API key)
- Device tree: có thể dùng library hoặc tự implement
- Power flow: SVG/Canvas hoặc library như mermaid.js

---

## 🚀 BẮT ĐẦU

Xem file `DASHBOARD-UPGRADE-REQUIREMENTS.md` để biết chi tiết implementation.

