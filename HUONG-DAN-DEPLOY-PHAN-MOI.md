# Hướng Dẫn Deploy Các Phần Mới

## 📋 Tổng Quan

Các phần mới đã được thêm vào hệ thống:
- ✅ **Admin Panel** (`/admin`) - Quản trị dự án, khu vực, thiết bị
- ✅ **Reports Dashboard** (`/reports`) - Báo cáo năng lượng chi tiết
- ✅ **Models mới**: Project, Area
- ✅ **Routes mới**: admin.js, reports.js
- ✅ **Scripts mới**: insert-test-data.js, aggregate-existing-data.js

## 📁 Các File/Folder Mới Cần Deploy

### 1. Frontend Folders

```
admin/
├── index.html          # Admin panel HTML
└── (có thể có CSS/JS nếu tách riêng)

reports/
├── index.html          # Reports page HTML
├── style.css           # Reports CSS
└── app.js              # Reports JavaScript
```

### 2. Backend Routes

```
routes/
├── admin.js            # Admin API routes (CRUD Projects/Areas/Devices)
└── reports.js          # Reports API routes (detailed reports, predictions)
```

### 3. Models

```
models/
├── Project.js          # Project model
└── Area.js             # Area model
```

**Lưu ý**: `Device.js` đã được cập nhật (thêm `project_id`, `area_id`)

### 4. Scripts (Optional - để test data)

```
scripts/
├── insert-test-data.js           # Insert test data
├── insert-test-data.bat
├── insert-test-data.ps1
├── aggregate-existing-data.js    # Aggregate data
├── aggregate-existing-data.bat
└── aggregate-existing-data.ps1
```

### 5. Files Đã Cập Nhật

```
server.js               # Đã thêm routes và static files cho admin/reports
mongodb-init/init.js    # Có thể cần update indexes (nếu có thay đổi)
```

## 🚀 Các Bước Deploy

### Bước 1: Chuẩn Bị Folder Deploy

Chạy script để tạo folder deploy mới (với tất cả files mới):

```powershell
cd backend-system
.\scripts\prepare-deploy.ps1
```

Script này sẽ:
- ✅ Copy tất cả files cần thiết vào folder `iis-deploy`
- ✅ Bao gồm các folder mới: `admin/`, `reports/`
- ✅ Bao gồm routes mới: `routes/admin.js`, `routes/reports.js`
- ✅ Bao gồm models mới: `models/Project.js`, `models/Area.js`
- ✅ Copy `server.js` đã cập nhật

### Bước 2: Copy Lên Server

#### Cách 1: Copy Trực Tiếp

1. Copy toàn bộ nội dung trong folder `iis-deploy`
2. Paste vào thư mục trên server (ví dụ: `D:\Solar\backend-system`)
3. **Quan trọng**: Chọn "Replace" cho các file đã tồn tại

#### Cách 2: Nén và Upload

1. Nén folder `iis-deploy` thành ZIP
2. Upload ZIP lên server
3. Giải nén vào thư mục đích
4. Replace các files nếu có

### Bước 3: Trên Server - Cài Đặt Dependencies

```cmd
cd D:\Solar\backend-system
npm install --production
```

**Lưu ý**: Nếu đã có `node_modules`, có thể không cần chạy lại trừ khi có dependencies mới.

### Bước 4: Trên Server - Kiểm Tra Environment Variables

Đảm bảo file `.env` có đầy đủ cấu hình:

```env
PORT=5023
NODE_ENV=production
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=your-secure-api-key-here
CORS_ORIGIN=*
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

### Bước 5: Trên Server - Update Database Schema

#### Option A: Database đã có dữ liệu cũ

Nếu database đã có dữ liệu, chỉ cần restart server. Models mới sẽ tự động được tạo khi truy cập.

#### Option B: Database mới hoặc cần khởi tạo indexes

```powershell
.\scripts\init-database.ps1
```

Script này sẽ:
- ✅ Tạo các collections mới (projects, areas)
- ✅ Tạo indexes cho collections
- ✅ Không xóa dữ liệu cũ

### Bước 6: Trên Server - Restart IIS/Application

#### Nếu dùng IIS với iisnode:

1. Mở **IIS Manager**
2. Chọn **Application Pool** của SolarLogger
3. Click **Recycle** hoặc **Stop** → **Start**
4. Hoặc restart toàn bộ IIS: `iisreset`

#### Nếu dùng PM2:

```cmd
pm2 restart solarlogger-api
```

Hoặc:

```cmd
pm2 stop solarlogger-api
pm2 start ecosystem.config.js
```

#### Nếu chạy trực tiếp Node.js:

- Stop server (Ctrl+C)
- Start lại: `node server.js`

### Bước 7: Kiểm Tra

#### 1. Health Check

```cmd
curl http://localhost:5023/health
```

Phải trả về:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

#### 2. Test Admin Panel

- URL: `http://your-domain/admin` hoặc `http://localhost:5023/admin`
- Phải load được trang admin panel
- Kiểm tra console (F12) không có lỗi

#### 3. Test Reports

- URL: `http://your-domain/reports` hoặc `http://localhost:5023/reports`
- Phải load được trang reports
- Kiểm tra console (F12) không có lỗi

#### 4. Test API Endpoints

```cmd
# Test Admin API
curl http://localhost:5023/api/v1/admin/projects

# Test Reports API (cần có project ID)
curl http://localhost:5023/api/v1/reports/project/{projectId}/detailed?period=7days
```

## 🔄 Update Các Phần Đã Deploy

### Chỉ Update Frontend (HTML/CSS/JS)

Nếu chỉ thay đổi frontend (admin/ hoặc reports/):

1. Copy các files đã thay đổi:
   - `admin/index.html`
   - `reports/index.html`
   - `reports/style.css`
   - `reports/app.js`

2. **Không cần**:
   - ❌ Chạy `npm install`
   - ❌ Restart server (nhưng nên restart để clear cache)

### Chỉ Update Backend (Routes/Models)

Nếu chỉ thay đổi backend:

1. Copy các files đã thay đổi:
   - `routes/admin.js`
   - `routes/reports.js`
   - `models/Project.js`
   - `models/Area.js`
   - `server.js` (nếu có thay đổi)

2. **Cần**:
   - ✅ Restart IIS/PM2/Server

### Update Dependencies

Nếu có dependencies mới trong `package.json`:

1. Copy `package.json` và `package-lock.json` mới
2. Chạy: `npm install --production`
3. Restart server

## 📝 Checklist Deploy

Trước khi deploy, kiểm tra:

- [ ] Đã chạy `prepare-deploy.ps1` để tạo folder deploy mới
- [ ] Folder `iis-deploy` chứa đầy đủ:
  - [ ] `admin/` folder
  - [ ] `reports/` folder
  - [ ] `routes/admin.js`
  - [ ] `routes/reports.js`
  - [ ] `models/Project.js`
  - [ ] `models/Area.js`
  - [ ] `server.js` (đã update)
- [ ] Trên server:
  - [ ] Đã copy files
  - [ ] Đã chạy `npm install` (nếu cần)
  - [ ] File `.env` đúng cấu hình
  - [ ] Đã restart IIS/PM2/Server
- [ ] Kiểm tra:
  - [ ] Health check OK
  - [ ] Admin panel load được
  - [ ] Reports page load được
  - [ ] API endpoints hoạt động

## 🐛 Troubleshooting

### Admin/Reports không load (404)

**Nguyên nhân**: `server.js` chưa có routes hoặc static files

**Giải pháp**:
1. Kiểm tra `server.js` có các dòng:
   ```javascript
   app.use('/admin', express.static(path.join(__dirname, 'admin')));
   app.use('/reports', express.static(path.join(__dirname, 'reports')));
   app.use('/api', adminRoutes);
   app.use('/api', reportsRoutes);
   ```
2. Restart server

### API trả về 404

**Nguyên nhân**: Routes chưa được register

**Giải pháp**:
1. Kiểm tra `server.js` có import routes:
   ```javascript
   const adminRoutes = require('./routes/admin');
   const reportsRoutes = require('./routes/reports');
   ```
2. Restart server

### CSS/JS không load trong Admin/Reports

**Nguyên nhân**: CSP (Content Security Policy) hoặc đường dẫn sai

**Giải pháp**:
1. Kiểm tra console (F12) có lỗi CSP không
2. Kiểm tra `server.js` có cấu hình CSP đúng (đã có sẵn)
3. Kiểm tra đường dẫn CSS/JS trong HTML: `/admin/style.css` hoặc `/reports/style.css`

### Database errors (Project/Area not found)

**Nguyên nhân**: Collections chưa được tạo

**Giải pháp**:
1. Chạy `init-database.ps1` để tạo indexes
2. Hoặc truy cập admin panel để tự động tạo collections

## 📚 Tham Khảo

- `DEPLOY-IIS.md` - Hướng dẫn deploy chi tiết
- `HUONG-DAN-COPY-LEN-SERVER.md` - Hướng dẫn copy files
- `FULL-SETUP-TEST-DATA.md` - Hướng dẫn insert test data





