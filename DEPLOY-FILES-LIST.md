# 📦 Danh sách file cần deploy lên server

## ✅ Các file đã được cập nhật và sẵn sàng deploy:

### 1. Backend Routes (API)
- ✅ `routes/data.js` - Thêm endpoint GET /api/v1/data/devices
- ✅ `iis-deploy/routes/data.js` - ✅ ĐÃ CẬP NHẬT

### 2. Admin Panel Frontend
- ✅ `admin/index.html` - Thêm checkbox, modal, nút thêm vào khu vực
- ✅ `admin/admin.js` - Logic chọn nhiều thiết bị và thêm vào khu vực
- ✅ `iis-deploy/admin/admin/index.html` - ✅ ĐÃ CẬP NHẬT
- ✅ `iis-deploy/admin/admin/admin.js` - ✅ ĐÃ CẬP NHẬT

## 🚀 Hướng dẫn deploy:

### Nếu dùng IIS (iis-deploy) - KHUYẾN NGHỊ:
**Copy các file sau lên server:**
1. `iis-deploy/routes/data.js` → `[server]/routes/data.js`
2. `iis-deploy/admin/admin/index.html` → `[server]/admin/admin/index.html`
3. `iis-deploy/admin/admin/admin.js` → `[server]/admin/admin/admin.js`

### Nếu dùng trực tiếp (không qua iis-deploy):
**Copy các file sau lên server:**
1. `routes/data.js` → `[server]/routes/data.js`
2. `admin/index.html` → `[server]/admin/index.html`
3. `admin/admin.js` → `[server]/admin/admin.js`

## ⚠️ Lưu ý quan trọng:
1. **Restart server** sau khi deploy để áp dụng thay đổi
2. Kiểm tra quyền truy cập file trên server
3. Đảm bảo đường dẫn API đúng trong môi trường production
4. Test endpoint mới: `GET /api/v1/data/devices` sau khi deploy

## 📋 Checklist deploy:
- [ ] Backup các file cũ trước khi deploy
- [ ] Copy 3 file đã cập nhật lên server
- [ ] Kiểm tra quyền file (read/write)
- [ ] Restart server/application
- [ ] Test trang admin: https://sol.adtrade.site/admin/
- [ ] Test chức năng chọn thiết bị và thêm vào khu vực
