# 📦 Hướng Dẫn Deploy Hỗ Trợ Payload v0.9.0

**Ngày tạo**: 2025-01-16  
**Mục đích**: Hướng dẫn deploy các thay đổi hỗ trợ payload v0.9.0 lên server

---

## 📋 Danh Sách Files Cần Deploy

### 1. Models (2 files)
- ✅ `iis-deploy/models/Device.js` - Đã cập nhật với `device_info`
- ✅ `iis-deploy/models/DataPoint.js` - Đã cập nhật với schema mới

### 2. Routes (1 file)
- ✅ `iis-deploy/routes/data.js` - Đã cập nhật xử lý payload v0.9.0

### 3. Admin Panel (3 files - từ task trước)
- ✅ `iis-deploy/admin/admin/index.html`
- ✅ `iis-deploy/admin/admin/admin.js`
- ✅ `iis-deploy/server.js` (đã cập nhật đường dẫn admin)

---

## 🚀 Các Bước Deploy

### Bước 1: Backup Files Cũ

```powershell
# Backup các file sẽ thay thế
Copy-Item [server-path]/models/Device.js [server-path]/models/Device.js.backup
Copy-Item [server-path]/models/DataPoint.js [server-path]/models/DataPoint.js.backup
Copy-Item [server-path]/routes/data.js [server-path]/routes/data.js.backup
```

### Bước 2: Copy Files Mới Lên Server

Copy các file sau từ `iis-deploy/` lên server:

1. **Models**:
   ```
   iis-deploy/models/Device.js → [server]/models/Device.js
   iis-deploy/models/DataPoint.js → [server]/models/DataPoint.js
   ```

2. **Routes**:
   ```
   iis-deploy/routes/data.js → [server]/routes/data.js
   ```

3. **Admin Panel** (nếu chưa deploy):
   ```
   iis-deploy/admin/admin/index.html → [server]/admin/admin/index.html
   iis-deploy/admin/admin/admin.js → [server]/admin/admin/admin.js
   iis-deploy/server.js → [server]/server.js
   ```

### Bước 3: Restart Server

```bash
# Nếu dùng PM2
pm2 restart all

# Hoặc restart IIS Application Pool
# Hoặc restart service tương ứng
```

### Bước 4: Test Payload Mới

#### Test với Payload v0.9.0:

```bash
POST /api/v1/data
Headers:
  X-API-Key: 123
  Content-Type: application/json

Body: (từ payload1601/payload/basic_payload.json)
{
  "logger_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "timezone": "Asia/Ho_Chi_Minh",
  "fw_version": "0.9.0",
  "schema_version": "0.9.0",
  "data": {
    "system": { ... },
    "inverters": [ ... ]
  }
}
```

#### Kiểm Tra Logs:

Sau khi POST, kiểm tra server logs:
```
✅ Data point saved for device SL-2025-0001 at ... (schema: 0.9.0, inverters: 1)
✅   Sections included: info, operating_state, sign_convention, ac_measurements, grid_interaction, pv_input, battery_storage, load, performance, thermal_hardware, quality
```

#### Kiểm Tra Database:

```javascript
// Kiểm tra DataPoint có đầy đủ sections không
db.data_points.findOne({ device_id: "SL-2025-0001" }, { inverters: 1 })

// Kiểm tra Device có device_info không
db.devices.findOne({ device_id: "SL-2025-0001" }, { device_info: 1 })
```

---

## ✅ Checklist Deploy

- [ ] Backup files cũ
- [ ] Copy `models/Device.js` lên server
- [ ] Copy `models/DataPoint.js` lên server
- [ ] Copy `routes/data.js` lên server
- [ ] Restart server/PM2
- [ ] Test với payload v0.9.0
- [ ] Kiểm tra logs có sections mới
- [ ] Kiểm tra database có lưu đầy đủ
- [ ] Test backward compatibility với payload cũ

---

## 🔍 Xác Nhận Deploy Thành Công

### 1. Kiểm Tra Logs
- ✅ Thấy log: `schema: 0.9.0`
- ✅ Thấy log: `Sections included: ...`

### 2. Kiểm Tra Database
- ✅ DataPoint có field `schema_version: "0.9.0"`
- ✅ DataPoint có field `fw_version`
- ✅ Inverters có đầy đủ sections mới
- ✅ Device có field `device_info` với đầy đủ thông tin

### 3. Test API
- ✅ POST payload v0.9.0 → Success
- ✅ POST payload cũ → Vẫn hoạt động (backward compatible)

---

## 📝 Lưu Ý

1. **MongoDB Schema**: Không cần migration vì sử dụng Mixed type
2. **Backward Compatibility**: Hệ thống vẫn hỗ trợ payload cũ
3. **Device Info**: Tự động cập nhật khi nhận payload mới
4. **No Breaking Changes**: Không ảnh hưởng đến dữ liệu cũ

---

## 🆘 Troubleshooting

### Lỗi: "Cannot read property 'info' of undefined"
- **Nguyên nhân**: Payload không có inverters hoặc inverters rỗng
- **Giải pháp**: Kiểm tra payload có `data.inverters[0].info` không

### Lỗi: "device_info is not defined"
- **Nguyên nhân**: Device model chưa được cập nhật
- **Giải pháp**: Đảm bảo đã copy `models/Device.js` mới

### Không thấy sections trong logs
- **Nguyên nhân**: Payload không phải schema v0.9.0
- **Giải pháp**: Kiểm tra `schema_version >= 0.9` trong payload

---

**✅ Sau khi deploy, hệ thống sẽ hỗ trợ đầy đủ payload v0.9.0!**
