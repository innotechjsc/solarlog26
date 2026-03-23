# Hướng dẫn chèn dữ liệu mẫu

Script này sẽ tự động chèn dữ liệu mẫu vào database bao gồm:
- **4 Projects** (Dự án)
- **13 Areas** (Khu vực)
- **42 Devices** (Thiết bị)

## Dữ liệu mẫu

### Projects
1. **Nhà máy điện mặt trời Bình Thuận** (PV-BT-001) - 50MW
2. **Trang trại năng lượng mặt trời Tây Ninh** (PV-TN-002) - 30MW
3. **Hệ thống điện mặt trời áp mái Nha Trang** (PV-NT-003) - 5MW
4. **Nhà máy điện mặt trời Long An** (PV-LA-004) - 40MW

Mỗi project sẽ có các areas và devices tương ứng.

## Cách chạy

### Cách 1: Sử dụng npm script
```bash
npm run seed
```

### Cách 2: Chạy trực tiếp Node.js
```bash
node scripts/seed-sample-data.js
```

### Cách 3: Sử dụng Batch file (Windows)
```bash
scripts\seed-sample-data.bat
```

### Cách 4: Sử dụng PowerShell (Windows)
```powershell
scripts\seed-sample-data.ps1
```

## Lưu ý

⚠️ **Script này sẽ XÓA tất cả dữ liệu cũ** của Projects, Areas và Devices trước khi chèn dữ liệu mẫu mới.

Nếu bạn muốn giữ dữ liệu cũ, hãy chỉnh sửa file `scripts/seed-sample-data.js` và comment lại các dòng xóa dữ liệu:

```javascript
// Comment lại các dòng này
// await Device.deleteMany({});
// await Area.deleteMany({});
// await Project.deleteMany({});
```

## Yêu cầu

- MongoDB phải đang chạy
- Kết nối MongoDB được cấu hình trong file `.env` hoặc sử dụng default connection string
- Node.js đã được cài đặt

## Kiểm tra kết quả

Sau khi chạy script thành công, bạn có thể:

1. **Xem qua Dashboard**: Truy cập `http://localhost:5023/dashboard`
2. **Xem qua Admin Panel**: Truy cập `http://localhost:5023/admin`
3. **Kiểm tra qua API**:
   - `GET /api/v1/admin/projects` - Xem danh sách projects
   - `GET /api/v1/admin/projects/:projectId/areas` - Xem areas của project
   - `GET /api/v1/admin/areas/:areaId/devices` - Xem devices của area

## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB có đang chạy không
- Kiểm tra connection string trong file `.env`
- Kiểm tra port MongoDB (mặc định: 27019)

### Lỗi duplicate key
- Script đã xóa dữ liệu cũ, nhưng nếu vẫn gặp lỗi này, hãy xóa manual các collection trong MongoDB

### Permission denied (PowerShell)
- Chạy PowerShell với quyền Administrator
- Hoặc thay đổi execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`





