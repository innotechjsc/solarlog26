# 🚀 Deploy IIS - Hướng Dẫn Nhanh

## Cách 1: Tự Động (Khuyến Nghị)

Chạy script PowerShell với quyền Administrator:

```powershell
cd backend-system
.\scripts\deploy-iis.ps1
```

Script sẽ tự động:
- ✅ Kiểm tra iisnode và Node.js
- ✅ Cài đặt dependencies (nếu cần)
- ✅ Tạo Application Pool
- ✅ Tạo Website
- ✅ Cấp quyền truy cập

**Tùy chỉnh:**
```powershell
.\scripts\deploy-iis.ps1 -SiteName "MySite" -Port 8080 -PhysicalPath "D:\MyPath"
```

## Cách 2: Thủ Công

Xem hướng dẫn chi tiết: [HUONG-DAN-DEPLOY-IIS.md](./HUONG-DAN-DEPLOY-IIS.md)

## Checklist Nhanh

Sau khi chạy script, đảm bảo:

1. **MongoDB đang chạy:**
   ```powershell
   .\scripts\start-mongodb.ps1
   ```

2. **Cấu hình Environment Variables:**
   - Tạo file `.env` hoặc cấu hình trong IIS Application Settings
   - Xem [HUONG-DAN-DEPLOY-IIS.md](./HUONG-DAN-DEPLOY-IIS.md) phần Bước 5

3. **Khởi tạo Database:**
   ```powershell
   .\scripts\init-database.ps1
   ```

4. **Test:**
   ```cmd
   curl http://localhost:3000/health
   ```

## Yêu Cầu Trước Khi Deploy

- [ ] Windows Server với IIS
- [ ] Node.js (v16+) đã cài đặt
- [ ] iisnode đã cài đặt
- [ ] Docker Desktop để chạy MongoDB

## Xem Thêm

- [HUONG-DAN-DEPLOY-IIS.md](./HUONG-DAN-DEPLOY-IIS.md) - Hướng dẫn chi tiết tiếng Việt
- [DEPLOY-IIS.md](./DEPLOY-IIS.md) - Hướng dẫn chi tiết tiếng Anh
- [README-IIS.md](./README-IIS.md) - Quick start

