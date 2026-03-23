# 📝 Changelog: Hỗ Trợ Payload v0.9.0 trong iis-deploy

**Ngày cập nhật**: 2025-01-16  
**Phiên bản**: v0.9.0 Support

---

## ✅ Các File Đã Được Cập Nhật

### 1. Models

#### `iis-deploy/models/Device.js`
**Thay đổi**:
- ✅ Thêm field `device_info` để lưu thông tin từ payload v0.9.0:
  - `serial_number`
  - `model_name`
  - `inverter_type`
  - `rated_power_w`
  - `hw_version`
  - `protocol`
  - `modbus_address`

#### `iis-deploy/models/DataPoint.js`
**Thay đổi**:
- ✅ Thêm đầy đủ schema mới cho payload v0.9.0:
  - `inverterInfoSchema` - Thông tin định danh
  - `operatingStateSchema` - Trạng thái vận hành
  - `signConventionSchema` - Quy ước dấu
  - `acMeasurementsSchema` - Đo lường AC 3 pha
  - `gridInteractionSchema` - Trao đổi với lưới
  - `pvInputSchema` - Đầu vào PV (MPPT)
  - `batteryStorageSchema` - Pin lưu trữ
  - `loadSchema` - Tải tiêu thụ
  - `performanceSchema` - Hiệu suất
  - `thermalHardwareSchema` - Nhiệt độ
  - `qualitySchema` - Chất lượng dữ liệu
  - `alarmSchemaNew` - Cấu trúc alarm mới
- ✅ Thêm fields: `schema_version`, `fw_version`
- ✅ Sử dụng `Mixed` type cho `system` và `inverters` để hỗ trợ cả schema cũ và mới

---

### 2. Routes

#### `iis-deploy/routes/data.js`
**Thay đổi**:
- ✅ Hỗ trợ cả `device_id` (cũ) và `logger_id` (mới)
- ✅ Hỗ trợ cả `version` (cũ) và `fw_version` (mới)
- ✅ Tự động detect schema version (`schema_version >= 0.9`)
- ✅ Tự động cập nhật `device_info` từ `inverters[].info`
- ✅ Xử lý alarms từ cả 2 vị trí:
  - Schema mới: `inverters[].alarm.data[]`
  - Schema cũ: root level `alarms[]`
- ✅ Enhanced logging: Log các sections được nhận
- ✅ Thêm endpoint `GET /api/v1/data/devices` để lấy danh sách thiết bị từ data_points

---

### 3. Admin Panel (từ task trước)

#### `iis-deploy/admin/admin/index.html`
- ✅ Thêm checkbox để chọn nhiều thiết bị
- ✅ Thêm modal để thêm thiết bị vào khu vực
- ✅ Thêm nút "Thêm vào khu vực"

#### `iis-deploy/admin/admin/admin.js`
- ✅ Fetch devices từ `/api/v1/data/devices`
- ✅ Logic chọn nhiều thiết bị
- ✅ Logic thêm thiết bị vào khu vực

#### `iis-deploy/server.js`
- ✅ Cập nhật đường dẫn admin: `/admin` → `/admin/admin/index.html`

---

## 📊 Tổng Hợp Thay Đổi

### Files Đã Cập Nhật (6 files):
1. ✅ `iis-deploy/models/Device.js`
2. ✅ `iis-deploy/models/DataPoint.js`
3. ✅ `iis-deploy/routes/data.js`
4. ✅ `iis-deploy/admin/admin/index.html`
5. ✅ `iis-deploy/admin/admin/admin.js`
6. ✅ `iis-deploy/server.js`

### Tính Năng Mới:
- ✅ Hỗ trợ payload v0.9.0 đầy đủ
- ✅ Auto-update device info từ payload
- ✅ Lưu tất cả sections mới vào database
- ✅ Backward compatibility với payload cũ
- ✅ Enhanced logging và monitoring

---

## 🚀 Sẵn Sàng Deploy

Tất cả các file trong `iis-deploy/` đã được cập nhật đầy đủ và sẵn sàng deploy lên server!

Xem `DEPLOY-PAYLOAD-V0.9.0.md` để biết hướng dẫn deploy chi tiết.
