# Hướng Dẫn Copy File Lên Server IIS

## 📦 Folder Deploy

Đã tạo sẵn folder `iis-deploy` chứa tất cả các file cần thiết để deploy lên server.

## 🚀 Cách Sử Dụng

### Bước 1: Tạo Folder Deploy (Nếu chưa có)

Chạy script để tạo folder deploy:

```powershell
cd backend-system
.\scripts\prepare-deploy.ps1
```

Script sẽ tạo folder `iis-deploy` với tất cả các file cần thiết.

### Bước 2: Copy Lên Server

Có 2 cách:

#### Cách 1: Copy trực tiếp
- Copy toàn bộ nội dung trong folder `iis-deploy` 
- Paste vào thư mục trên server (ví dụ: `D:\Solar\backend-system`)

#### Cách 2: Nén thành ZIP
1. Nén folder `iis-deploy` thành file ZIP
2. Upload file ZIP lên server
3. Giải nén vào thư mục đích

### Bước 3: Trên Server

Sau khi copy xong, làm theo hướng dẫn trong file `README.md` trong folder deploy:

1. **Cài đặt dependencies:**
   ```cmd
   npm install --production
   ```

2. **Tạo file .env:**
   ```cmd
   copy .env.example .env
   ```
   Sau đó chỉnh sửa file `.env` với các giá trị phù hợp.

3. **Khởi động MongoDB:**
   ```powershell
   .\scripts\start-mongodb.ps1
   ```

4. **Khởi tạo Database:**
   ```powershell
   .\scripts\init-database.ps1
   ```

5. **Cấu hình IIS** (xem `HUONG-DAN-DEPLOY-IIS.md`)

## 📁 Các File Trong Folder Deploy

Folder `iis-deploy` chứa:

- ✅ `server.js` - Entry point
- ✅ `package.json` & `package-lock.json` - Dependencies
- ✅ `web.config` - Cấu hình IIS
- ✅ `iisnode.yml` - Cấu hình iisnode
- ✅ `swagger.yaml` - API documentation
- ✅ `.env.example` - Template cho environment variables
- ✅ `docker-compose.yml` - Để chạy MongoDB
- ✅ `routes/` - API routes
- ✅ `models/` - Database models
- ✅ `services/` - Business logic
- ✅ `middleware/` - Express middleware
- ✅ `dashboard/` - Dashboard HTML
- ✅ `mongodb-init/` - MongoDB init scripts
- ✅ `scripts/` - Utility scripts (init-database, start-mongodb)
- ✅ `README.md` - Hướng dẫn deploy

## ❌ Không Copy

Các file/folder sau **KHÔNG** được copy (sẽ tạo trên server):

- ❌ `node_modules/` - Sẽ cài đặt bằng `npm install`
- ❌ `.env` - File nhạy cảm, tạo mới trên server
- ❌ Các file log - Tự động tạo khi chạy
- ❌ Các file markdown khác - Chỉ cần README.md

## 📝 Lưu Ý

1. **Kích thước:** Folder deploy khoảng 0.3-0.5 MB (không bao gồm node_modules)
2. **Bảo mật:** Đảm bảo thay đổi API key trong file `.env` trên server
3. **Quyền truy cập:** Sau khi copy, cấp quyền cho IIS_IUSRS trên server

## 🔄 Cập Nhật

Khi có thay đổi code, chạy lại script `prepare-deploy.ps1` để tạo folder deploy mới với code mới nhất.

---

**Vị trí folder deploy:** `backend-system\iis-deploy\`

