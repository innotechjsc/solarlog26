# 📋 Hướng dẫn Deploy Tính năng API Logs

## 🆕 Tính năng mới: API Logs Viewer

Tính năng mới đã được thêm vào hệ thống để theo dõi và xem tất cả các API requests.

## 📁 Các File Mới Đã Thêm

### 1. Model
- **`models/ApiLog.js`** - Model để lưu trữ logs của các API requests

### 2. Middleware
- **`middleware/logger.js`** - Middleware để capture và log tất cả API requests

### 3. Routes
- **`routes/logs.js`** - API routes để lấy danh sách logs, statistics

### 4. Dashboard
- **`dashboard/logs.html`** - Trang xem logs
- **`dashboard/css/logs.css`** - Style cho trang logs
- **`dashboard/js/logs.js`** - Logic cho trang logs

### 5. Cập nhật
- **`server.js`** - Đã thêm logging middleware và logs routes
- **`dashboard/js/navbar.js`** - Đã thêm link "API Logs" vào navigation

## 🚀 Cách Deploy

### Bước 1: Sử dụng Script Deploy

Script `prepare-deploy.ps1` đã được cấu hình để tự động copy tất cả các file cần thiết, bao gồm cả các file mới:

```powershell
cd backend-system
.\scripts\prepare-deploy.ps1
```

Script này sẽ tạo folder `iis-deploy` với tất cả các file cần thiết.

### Bước 2: Copy lên Server

Copy toàn bộ nội dung trong folder `iis-deploy` lên server.

### Bước 3: Cài đặt Dependencies

Trên server:

```cmd
cd <deploy-folder>
npm install --production
```

### Bước 4: Khởi động lại Server

Sau khi deploy, khởi động lại server để áp dụng các thay đổi.

## ✅ Kiểm tra

1. Truy cập Dashboard: `http://your-server/dashboard/logs.html`
2. Kiểm tra xem có link "API Logs" trong navigation menu
3. Kiểm tra API logs endpoint: `http://your-server/api/v1/logs`

## 📊 Tính năng

- Xem tất cả API requests đã gọi
- Filter theo method, path, status code, IP address, thời gian
- Xem chi tiết từng request (request body, response body, headers, v.v.)
- Thống kê (tổng requests, tỷ lệ thành công, response time trung bình)
- Pagination để xem nhiều logs

## 🔒 Lưu ý

- Logs được lưu trong MongoDB collection `apilogs`
- Mặc định không có TTL (time-to-live), logs sẽ được lưu vĩnh viễn
- Có thể bật TTL trong `models/ApiLog.js` nếu muốn tự động xóa logs cũ (ví dụ: 90 ngày)
