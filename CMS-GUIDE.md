# 🔐 Hướng Dẫn CMS và Phân Quyền

## Tổng Quan

Hệ thống CMS (Content Management System) cho phép quản trị và phân quyền người dùng với các vai trò khác nhau:

- **Admin**: Toàn quyền quản trị (thêm/sửa/xóa dự án, khu vực, thiết bị, người dùng)
- **Manager**: Quản lý khu vực được gán, nhận thông báo, xem báo cáo
- **User**: Chỉ xem báo cáo và dữ liệu

## Cài Đặt

### 1. Cài đặt dependencies

```bash
npm install bcryptjs jsonwebtoken
```

### 2. Cấu hình JWT Secret

Thêm vào file `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 3. Tạo tài khoản Admin đầu tiên

```bash
node scripts/create-admin-user.js
```

Mặc định:
- Username: `admin`
- Password: `admin123`
- **⚠️ QUAN TRỌNG**: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

## API Endpoints

### Authentication

#### POST /api/v1/auth/register
Đăng ký người dùng mới (chỉ Admin)

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "username": "user1",
  "email": "user1@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "role": "user",
  "assigned_areas": ["area_id_1", "area_id_2"],
  "assigned_projects": ["project_id_1"]
}
```

#### POST /api/v1/auth/login
Đăng nhập

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "email": "admin@solarlogger.com",
    "role": "admin",
    ...
  }
}
```

#### GET /api/v1/auth/me
Lấy thông tin user hiện tại

**Headers:**
```
Authorization: Bearer <token>
```

### User Management (Admin only)

#### GET /api/v1/users
Lấy danh sách users

#### GET /api/v1/users/:userId
Lấy thông tin user

#### PUT /api/v1/users/:userId
Cập nhật user

#### DELETE /api/v1/users/:userId
Xóa user

### CMS - Projects (Admin only)

#### GET /api/v1/cms/projects
Lấy danh sách dự án (filtered by permissions)

#### POST /api/v1/cms/projects
Tạo dự án mới

**Body:**
```json
{
  "name": "Dự án Solar ABC",
  "code": "SOLAR-ABC",
  "description": "Mô tả dự án",
  "location": {
    "address": "123 Đường ABC",
    "latitude": 10.762622,
    "longitude": 106.660172
  },
  "electricity_price": 2000,
  "status": "active"
}
```

#### PUT /api/v1/cms/projects/:projectId
Cập nhật dự án

#### DELETE /api/v1/cms/projects/:projectId
Xóa dự án

### CMS - Areas (Admin only)

#### GET /api/v1/cms/areas
Lấy danh sách khu vực

#### POST /api/v1/cms/areas
Tạo khu vực mới

**Body:**
```json
{
  "name": "Khu vực 1",
  "code": "AREA-001",
  "project_id": "project_id_here",
  "description": "Mô tả khu vực",
  "location": "Vị trí khu vực",
  "capacity": 100,
  "status": "active"
}
```

#### PUT /api/v1/cms/areas/:areaId
Cập nhật khu vực

#### DELETE /api/v1/cms/areas/:areaId
Xóa khu vực

### CMS - Devices (Admin only)

#### GET /api/v1/cms/devices
Lấy danh sách thiết bị

#### POST /api/v1/cms/devices
Tạo thiết bị mới

**Body:**
```json
{
  "device_id": "SL-2025-0001",
  "project_id": "project_id_here",
  "area_id": "area_id_here",
  "site_name": "Nhà máy Solar ABC",
  "location": "Địa chỉ",
  "total_inverters": 8,
  "status": "offline"
}
```

#### PUT /api/v1/cms/devices/:deviceId
Cập nhật thiết bị

#### DELETE /api/v1/cms/devices/:deviceId
Xóa thiết bị

### Notifications

#### GET /api/v1/notifications
Lấy thông báo của user

**Query params:**
- `read`: true/false (filter by read status)
- `type`: alarm, maintenance, performance, etc.
- `limit`: số lượng (default: 50)

#### PUT /api/v1/notifications/:notificationId/read
Đánh dấu đã đọc

#### PUT /api/v1/notifications/read-all
Đánh dấu tất cả đã đọc

#### DELETE /api/v1/notifications/:notificationId
Xóa thông báo

## Phân Quyền

### Admin
- ✅ Tạo/sửa/xóa Projects, Areas, Devices
- ✅ Quản lý Users (tạo, sửa, xóa, gán khu vực)
- ✅ Xem tất cả báo cáo và dữ liệu
- ✅ Không nhận thông báo tự động

### Manager
- ✅ Xem Projects và Areas được gán
- ✅ Xem Devices trong khu vực được gán
- ✅ Xem báo cáo và analytics
- ✅ Nhận thông báo khi:
  - Có cảnh báo từ thiết bị trong khu vực
  - Có thiết bị mới được thêm vào khu vực
  - Có khu vực mới được gán

### User
- ✅ Xem Projects và Areas được gán
- ✅ Xem Devices trong khu vực được gán
- ✅ Xem báo cáo và analytics
- ❌ Không nhận thông báo

## Admin Panel

Truy cập: `http://localhost:5023/admin`

### Tính năng:
- Đăng nhập/Đăng xuất
- Quản lý Users (xem, thêm, sửa, xóa)
- Quản lý Projects (xem, thêm, sửa, xóa)
- Quản lý Areas (xem, thêm, sửa, xóa)
- Quản lý Devices (xem, thêm, sửa, xóa)

## Notification System

Hệ thống tự động gửi thông báo cho Managers khi:

1. **Cảnh báo từ thiết bị**: Khi có alarm mới từ thiết bị trong khu vực được gán
2. **Thiết bị mới**: Khi admin thêm thiết bị vào khu vực
3. **Khu vực mới**: Khi admin tạo khu vực mới và gán cho manager

### Cách hoạt động:

```javascript
// Tự động gọi khi có alarm mới (trong routes/data.js)
await Notification.notifyAreaManagers(
  areaId,
  'alarm',
  'critical',
  'Tiêu đề',
  'Nội dung',
  { device_id, alarm_code, ... }
);
```

## Bảo Mật

1. **JWT Token**: Tất cả API endpoints (trừ login) yêu cầu JWT token
2. **Password Hashing**: Mật khẩu được hash bằng bcryptjs
3. **Permission Check**: Mỗi action đều kiểm tra quyền của user
4. **Area/Project Filtering**: Users chỉ thấy dữ liệu trong khu vực/dự án được gán

## Ví Dụ Sử Dụng

### 1. Tạo Manager và gán khu vực

```bash
# Login as admin
curl -X POST http://localhost:5023/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Tạo manager
curl -X POST http://localhost:5023/api/v1/auth/register \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager1",
    "email": "manager1@example.com",
    "password": "password123",
    "full_name": "Nguyễn Văn B",
    "role": "manager",
    "assigned_areas": ["area_id_1"]
  }'
```

### 2. Manager nhận thông báo

Khi có alarm từ thiết bị trong khu vực được gán, manager sẽ tự động nhận notification:

```bash
# Manager xem thông báo
curl http://localhost:5023/api/v1/notifications \
  -H "Authorization: Bearer <manager_token>"
```

## Troubleshooting

### Lỗi "JWT_SECRET not found"
- Thêm `JWT_SECRET` vào file `.env`
- Restart server

### Lỗi "User not found" khi login
- Chạy script tạo admin: `node scripts/create-admin-user.js`
- Kiểm tra MongoDB connection

### Không nhận được notification
- Kiểm tra user có role "manager"
- Kiểm tra user có được gán area_id
- Kiểm tra device có area_id

## Next Steps

1. ✅ Hoàn thiện admin panel với modal forms
2. ✅ Thêm email/SMS notifications
3. ✅ Thêm audit log
4. ✅ Thêm role-based dashboard filtering

