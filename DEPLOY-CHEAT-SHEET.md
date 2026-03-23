# Deploy Cheat Sheet - Tóm Tắt Nhanh

## 📋 Các Phần Mới Cần Deploy

### ✅ Folders/Files Mới:
- `admin/` - Admin panel HTML
- `reports/` - Reports dashboard (HTML, CSS, JS)
- `routes/admin.js` - Admin API routes
- `routes/reports.js` - Reports API routes
- `models/Project.js` - Project model
- `models/Area.js` - Area model

### ✅ Files Đã Cập Nhật:
- `server.js` - Thêm routes và static files cho admin/reports

## 🚀 Quy Trình Deploy (Nhanh)

### Bước 1: Chuẩn Bị Folder Deploy

```powershell
cd backend-system
.\scripts\prepare-deploy.ps1
```

✅ Script sẽ tự động copy tất cả files/folders cần thiết vào `iis-deploy/`

### Bước 2: Copy Lên Server

1. Nén folder `iis-deploy` thành ZIP (hoặc copy trực tiếp)
2. Upload lên server
3. Giải nén vào thư mục đích (ví dụ: `D:\Solar\backend-system`)

### Bước 3: Trên Server

```cmd
# 1. Cài dependencies (nếu cần)
npm install --production

# 2. Kiểm tra .env
# Đảm bảo file .env có đầy đủ cấu hình

# 3. Update database (nếu cần)
.\scripts\init-database.ps1

# 4. Restart IIS/PM2
# IIS: Recycle Application Pool
# PM2: pm2 restart solarlogger-api
```

### Bước 4: Kiểm Tra

```cmd
# Health check
curl http://localhost:5023/health

# Test Admin
http://localhost:5023/admin

# Test Reports
http://localhost:5023/reports
```

## ⚡ Quick Update (Chỉ Update Code)

Nếu chỉ update code (không có dependencies mới):

1. Copy files đã thay đổi lên server
2. **Restart IIS/PM2** (quan trọng!)
3. Test lại

## 📝 Checklist

- [ ] Đã chạy `prepare-deploy.ps1`
- [ ] Folder `iis-deploy` có đầy đủ: `admin/`, `reports/`, `routes/admin.js`, `routes/reports.js`
- [ ] Đã copy lên server
- [ ] Đã chạy `npm install` (nếu cần)
- [ ] Đã restart IIS/PM2
- [ ] Đã test: `/health`, `/admin`, `/reports`

## 🔗 Xem Chi Tiết

- **Hướng dẫn đầy đủ**: `HUONG-DAN-DEPLOY-PHAN-MOI.md`
- **Deploy IIS**: `DEPLOY-IIS.md`
- **Copy files**: `HUONG-DAN-COPY-LEN-SERVER.md`





