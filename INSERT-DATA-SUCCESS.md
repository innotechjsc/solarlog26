# ✅ Đã Insert Dữ Liệu Test Thành Công!

## Tóm tắt

Đã tạo thành công dữ liệu test cho hệ thống báo cáo:

### Dữ liệu đã tạo:
- ✅ **2 Dự án (Projects)**
  - PRJ-001: Nhà Máy Điện Mặt Trời Bình Dương
  - PRJ-002: Trang Trại Năng Lượng Đồng Nai

- ✅ **4 Khu vực (Areas)**
  - AREA-A1, AREA-A2 (Project 1)
  - AREA-B1, AREA-B2 (Project 2)

- ✅ **8 Thiết bị (Devices)**
  - SL-TEST-0101, SL-TEST-0102 (Khu vực A1)
  - SL-TEST-0201, SL-TEST-0202 (Khu vực A2)
  - SL-TEST-0301, SL-TEST-0302 (Khu vực B1)
  - SL-TEST-0401, SL-TEST-0402 (Khu vực B2)

- ✅ **100 Bản ghi DataPoint**
  - 70 bản ghi trong 7 ngày qua
  - 30 bản ghi trong 8-30 ngày qua
  - Dữ liệu mô phỏng chu kỳ ngày/đêm thực tế

## Cách xem dữ liệu

### 1. Xem báo cáo
Truy cập: http://localhost:5023/reports

- Chọn dự án từ dropdown
- Chọn khu vực (hoặc "Tất cả")
- Chọn khoảng thời gian (7 ngày hoặc 30 ngày)
- Dữ liệu sẽ tự động load và hiển thị

### 2. Xem trong Admin Panel
Truy cập: http://localhost:5023/admin

- Tab "Projects": Xem danh sách dự án
- Tab "Areas": Xem danh sách khu vực
- Tab "Devices": Xem danh sách thiết bị
- Tab "Reports": Xem báo cáo cơ bản

### 3. Xem trong MongoDB
Truy cập: http://localhost:8082

- Database: `solarlogger`
- Collections: `projects`, `areas`, `devices`, `datapoints`

## Lưu ý

⚠️ **TTL Index**: 
- DataPoint có TTL index tự động xóa dữ liệu sau 7 ngày
- Dữ liệu trong 7 ngày qua sẽ được giữ lại
- Để có dữ liệu lâu hơn, chạy lại script hoặc tắt TTL index

## Chạy lại script

Nếu muốn chèn dữ liệu mới hoặc cập nhật:

```cmd
cd backend-system
node scripts/insert-test-data.js
```

Script sẽ tự động xóa dữ liệu test cũ trước khi insert mới.

## Xóa dữ liệu test

Nếu muốn xóa dữ liệu test:

```javascript
// Trong MongoDB shell
db.projects.deleteMany({ code: { $in: ['PRJ-001', 'PRJ-002'] } });
db.areas.deleteMany({ code: { $in: ['AREA-A1', 'AREA-A2', 'AREA-B1', 'AREA-B2'] } });
db.devices.deleteMany({ device_id: /^SL-TEST-/ });
db.datapoints.deleteMany({ device_id: /^SL-TEST-/ });
```





