# 📦 Deploy Swagger Documentation v0.9.0

**Ngày tạo**: 2025-01-16  
**Vấn đề**: Swagger UI trên server production chưa hiển thị payload v0.9.0  
**Giải pháp**: Deploy file `swagger.yaml` mới lên server

---

## 🔍 Vấn Đề

Swagger UI tại `https://sol.adtrade.site/api-docs/#/Data%20Ingestion/uploadData` vẫn đang hiển thị payload cũ, chưa có:
- ❌ Example payload v0.9.0
- ❌ Schema mới (InverterDataV09, SystemDataV09, etc.)
- ❌ Fields mới (logger_id, fw_version, schema_version)

---

## ✅ Giải Pháp

File `swagger.yaml` trong codebase **đã được cập nhật** với đầy đủ payload v0.9.0, nhưng chưa được deploy lên server production.

---

## 📋 Files Cần Deploy

### File chính:
- ✅ `backend-system/swagger.yaml` (đã cập nhật)
- ✅ `backend-system/iis-deploy/swagger.yaml` (đã copy)

---

## 🚀 Các Bước Deploy

### Bước 1: Xác Nhận File Đã Cập Nhật

Kiểm tra file `swagger.yaml` có chứa:
- ✅ `exampleV09` example
- ✅ `logger_id`, `fw_version`, `schema_version` fields
- ✅ `InverterDataV09` schema
- ✅ `SystemDataV09` schema
- ✅ Version: `1.1.0`

### Bước 2: Copy File Lên Server

```powershell
# Copy file swagger.yaml lên server
Copy-Item "d:\Solar\backend-system\iis-deploy\swagger.yaml" "[server-path]\swagger.yaml" -Force

# Hoặc nếu server dùng cấu trúc khác, copy vào đúng vị trí
```

**Vị trí file trên server**: 
- File `swagger.yaml` phải ở cùng thư mục với `server.js`
- Path trong `server.js`: `path.join(__dirname, 'swagger.yaml')`

### Bước 3: Restart Server

```bash
# Nếu dùng PM2
pm2 restart all

# Hoặc restart IIS Application Pool
# Hoặc restart service
```

### Bước 4: Clear Browser Cache

Swagger UI có thể cache file cũ, cần:
1. Hard refresh: `Ctrl + Shift + R` hoặc `Ctrl + F5`
2. Hoặc mở Incognito/Private window
3. Hoặc clear browser cache

### Bước 5: Verify

1. Truy cập: `https://sol.adtrade.site/api-docs`
2. Tìm endpoint: `POST /api/v1/data`
3. Click "Try it out"
4. Kiểm tra có **2 examples**:
   - ✅ `exampleOldSchema` - Schema cũ
   - ✅ `exampleV09` - Schema mới v0.9.0
5. Chọn `exampleV09` và kiểm tra:
   - ✅ Có `logger_id`, `fw_version`, `schema_version`
   - ✅ Có `inverters[].info`, `ac_measurements`, `grid_interaction`, etc.
   - ✅ Có đầy đủ 11 sections mới

---

## 🔍 Kiểm Tra File Đã Được Cập Nhật

### Kiểm tra trong codebase:

```bash
# Kiểm tra có exampleV09 không
grep -i "exampleV09" backend-system/swagger.yaml

# Kiểm tra có logger_id không
grep -i "logger_id" backend-system/swagger.yaml

# Kiểm tra có InverterDataV09 không
grep -i "InverterDataV09" backend-system/swagger.yaml

# Kiểm tra version
grep -i "version: 1.1.0" backend-system/swagger.yaml
```

### Kiểm tra trên server:

Sau khi deploy, kiểm tra file trên server có nội dung mới không:

```powershell
# Kiểm tra timestamp file
Get-Item "[server-path]\swagger.yaml" | Select-Object LastWriteTime

# So sánh với file local
Get-Item "backend-system\swagger.yaml" | Select-Object LastWriteTime
```

---

## 📝 Checklist Deploy

- [ ] Xác nhận file `swagger.yaml` trong codebase đã cập nhật
- [ ] Copy file `swagger.yaml` từ `iis-deploy/` lên server
- [ ] Xác nhận file ở đúng vị trí (cùng thư mục với server.js)
- [ ] Restart server/PM2
- [ ] Clear browser cache
- [ ] Truy cập Swagger UI
- [ ] Verify có 2 examples (old và v0.9.0)
- [ ] Verify exampleV09 có đầy đủ sections mới
- [ ] Test với "Try it out" để verify payload structure

---

## 🆘 Troubleshooting

### Vấn đề 1: Vẫn hiển thị payload cũ sau khi deploy

**Nguyên nhân**: Browser cache hoặc server chưa restart

**Giải pháp**:
1. Hard refresh browser: `Ctrl + Shift + R`
2. Mở Incognito window
3. Kiểm tra server đã restart chưa
4. Kiểm tra file trên server có timestamp mới không

### Vấn đề 2: File không được load

**Nguyên nhân**: File không ở đúng vị trí

**Giải pháp**:
1. Kiểm tra path trong `server.js`: `path.join(__dirname, 'swagger.yaml')`
2. Đảm bảo `swagger.yaml` ở cùng thư mục với `server.js`
3. Kiểm tra file permissions

### Vấn đề 3: Lỗi parse YAML

**Nguyên nhân**: File YAML có syntax error

**Giải pháp**:
1. Kiểm tra file có syntax error không
2. Test parse file: `YAML.load('swagger.yaml')`
3. Kiểm tra server logs có lỗi không

---

## 📊 So Sánh Trước và Sau

### Trước (Payload cũ):
```yaml
examples:
  example1:
    summary: Sample data upload
    value:
      device_id: SL-2025-0001
      version: '0.9.0'
      data:
        system: { total_ac_power: 450.5, ... }
        inverters: [{ id: 1, ac_power: 56.2, ... }]
```

### Sau (Payload v0.9.0):
```yaml
examples:
  exampleOldSchema:
    summary: Old schema example (backward compatible)
    value: { ... }
  exampleV09:
    summary: New schema v0.9.0 example
    value:
      logger_id: SL-2025-0001
      fw_version: '0.9.0'
      schema_version: '0.9.0'
      data:
        system: { total_ac_active_power_w: 450500, ... }
        inverters: [{
          info: { ... },
          ac_measurements: { ... },
          grid_interaction: { ... },
          ...
        }]
```

---

## ✅ Kết Quả Mong Đợi

Sau khi deploy thành công, Swagger UI sẽ hiển thị:

1. ✅ **2 Examples**:
   - `exampleOldSchema` - Schema cũ (backward compatible)
   - `exampleV09` - Schema mới v0.9.0 với đầy đủ sections

2. ✅ **Schema Documentation**:
   - `DataUploadRequest` hỗ trợ cả `device_id` và `logger_id`
   - `SystemDataV09` schema
   - `InverterDataV09` schema với 11 sections mới
   - `DeviceInfo` schema

3. ✅ **API Description**:
   - Mô tả về payload v0.9.0 support
   - Liệt kê các sections mới
   - Backward compatibility note

---

## 📚 Tài Liệu Liên Quan

- `SWAGGER-UPDATE-V0.9.0.md` - Chi tiết các thay đổi trong Swagger
- `swagger.yaml` - File Swagger specification
- `payload1601/payload/basic_payload.json` - Payload mẫu v0.9.0

---

**✅ Sau khi deploy, Swagger UI sẽ hiển thị đầy đủ payload v0.9.0!**
