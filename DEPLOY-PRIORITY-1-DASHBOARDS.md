# 📦 Deploy Checklist: Priority 1 Dashboards

**Ngày tạo**: 2025-01-16  
**Mục đích**: Hướng dẫn deploy 3 dashboard mới (Priority 1)

---

## 📋 Danh Sách Files Cần Deploy

### 1. Dashboard HTML Files (3 files)
- ✅ `dashboard/ac-measurements.html` - AC 3 Pha Dashboard
- ✅ `dashboard/grid-interaction.html` - Grid Interaction Dashboard
- ✅ `dashboard/pv-mppt.html` - PV MPPT Dashboard

### 2. Dashboard JavaScript Files (4 files)
- ✅ `dashboard/js/ac-measurements.js` - AC 3 Pha logic
- ✅ `dashboard/js/grid-interaction.js` - Grid Interaction logic
- ✅ `dashboard/js/pv-mppt.js` - PV MPPT logic
- ✅ `dashboard/js/navbar.js` - Navigation (updated với links mới)

### 3. iis-deploy Files
- ✅ Tất cả files trên trong `iis-deploy/dashboard/` và `iis-deploy/dashboard/js/`

---

## 🚀 Các Bước Deploy

### Bước 1: Copy Files Lên Server

Copy các file sau từ `iis-deploy/dashboard/` lên server:

```
iis-deploy/dashboard/ac-measurements.html → [server]/dashboard/ac-measurements.html
iis-deploy/dashboard/grid-interaction.html → [server]/dashboard/grid-interaction.html
iis-deploy/dashboard/pv-mppt.html → [server]/dashboard/pv-mppt.html
iis-deploy/dashboard/js/ac-measurements.js → [server]/dashboard/js/ac-measurements.js
iis-deploy/dashboard/js/grid-interaction.js → [server]/dashboard/js/grid-interaction.js
iis-deploy/dashboard/js/pv-mppt.js → [server]/dashboard/js/pv-mppt.js
iis-deploy/dashboard/js/navbar.js → [server]/dashboard/js/navbar.js
```

### Bước 2: Restart Server

```bash
# Nếu dùng PM2
pm2 restart all

# Hoặc restart IIS Application Pool
# Hoặc restart service tương ứng
```

### Bước 3: Test Dashboards

#### Test AC 3 Pha Dashboard:
1. Truy cập: `http://your-domain/dashboard/ac-measurements.html`
2. Chọn device có payload v0.9.0
3. Kiểm tra:
   - ✅ Phase cards hiển thị đúng (L1, L2, L3)
   - ✅ Phase imbalance detection hoạt động
   - ✅ Charts hiển thị dữ liệu

#### Test Grid Interaction Dashboard:
1. Truy cập: `http://your-domain/dashboard/grid-interaction.html`
2. Chọn device có payload v0.9.0
3. Kiểm tra:
   - ✅ Summary cards hiển thị import/export
   - ✅ Zero export alert hiển thị đúng
   - ✅ Power flow visualization hoạt động
   - ✅ Charts hiển thị dữ liệu

#### Test PV MPPT Dashboard:
1. Truy cập: `http://your-domain/dashboard/pv-mppt.html`
2. Chọn device có payload v0.9.0
3. Kiểm tra:
   - ✅ MPPT cards hiển thị đúng
   - ✅ Efficiency badges hoạt động
   - ✅ Charts hiển thị per-MPPT data

### Bước 4: Kiểm Tra Navigation

1. Mở bất kỳ dashboard nào
2. Kiểm tra navigation menu có 3 links mới:
   - ✅ "AC 3 Pha"
   - ✅ "Tương tác lưới"
   - ✅ "PV MPPT"
3. Click vào từng link để verify routing

---

## ✅ Checklist Deploy

- [ ] Copy `ac-measurements.html` lên server
- [ ] Copy `grid-interaction.html` lên server
- [ ] Copy `pv-mppt.html` lên server
- [ ] Copy `ac-measurements.js` lên server
- [ ] Copy `grid-interaction.js` lên server
- [ ] Copy `pv-mppt.js` lên server
- [ ] Copy `navbar.js` (updated) lên server
- [ ] Restart server/PM2
- [ ] Test AC 3 Pha Dashboard
- [ ] Test Grid Interaction Dashboard
- [ ] Test PV MPPT Dashboard
- [ ] Verify navigation links
- [ ] Test với device có payload v0.9.0
- [ ] Verify real-time updates (WebSocket)

---

## 🔍 Xác Nhận Deploy Thành Công

### 1. Kiểm Tra Files
- ✅ Files tồn tại trên server
- ✅ Files có timestamp mới

### 2. Kiểm Tra Functionality
- ✅ Dashboards load được
- ✅ Device dropdown hoạt động
- ✅ Data hiển thị đúng
- ✅ Charts render được
- ✅ Navigation links hoạt động

### 3. Kiểm Tra với Payload v0.9.0
- ✅ AC Measurements: Hiển thị voltage/current/power cho L1, L2, L3
- ✅ Grid Interaction: Hiển thị import/export, zero export status
- ✅ PV MPPT: Hiển thị MPPT channels, efficiency

---

## 🆘 Troubleshooting

### Lỗi: "Không có dữ liệu AC measurements"
- **Nguyên nhân**: Device chưa gửi payload v0.9.0 hoặc không có `ac_measurements`
- **Giải pháp**: Kiểm tra device có gửi payload v0.9.0 với `inverters[].ac_measurements` không

### Lỗi: "Charts không hiển thị"
- **Nguyên nhân**: Chart.js không load được hoặc không có dữ liệu
- **Giải pháp**: 
  - Kiểm tra console có lỗi không
  - Kiểm tra Chart.js CDN có load được không
  - Kiểm tra có dữ liệu historical không

### Lỗi: "Navigation links không hoạt động"
- **Nguyên nhân**: `navbar.js` chưa được update
- **Giải pháp**: Đảm bảo đã copy `navbar.js` mới lên server

### Lỗi: "WebSocket không kết nối"
- **Nguyên nhân**: WebSocket service chưa khởi động
- **Giải pháp**: 
  - Kiểm tra server logs có `[WebSocket] Socket.IO server initialized` không
  - Kiểm tra browser console có lỗi WebSocket không
  - Dashboard sẽ fallback về polling nếu WebSocket không available

---

## 📝 Lưu Ý

1. **Payload v0.9.0 Required**: Các dashboard này cần payload v0.9.0 để hoạt động đầy đủ
2. **Backward Compatibility**: Dashboard sẽ hiển thị error message nếu không có dữ liệu v0.9.0
3. **WebSocket Optional**: Dashboard vẫn hoạt động nếu WebSocket không available (fallback về polling)
4. **Chart.js CDN**: Dashboard sử dụng Chart.js từ CDN, cần internet connection

---

**✅ Sau khi deploy, 3 dashboard mới sẽ sẵn sàng sử dụng!**
