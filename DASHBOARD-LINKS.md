# 📊 Dashboard Links - Các cách truy cập

## ✅ Cách 1: Qua Express Server (Đã tích hợp)

Sau khi khởi động server (`npm start`), truy cập:

### 🏠 Trang chủ (Dashboard):
**http://localhost:5023/**

### 📊 Dashboard trực tiếp:
**http://localhost:5023/dashboard/**

(Thay `5023` bằng port bạn đã cấu hình trong `.env`)

## 📁 Cách 2: Mở file trực tiếp

### Windows:
1. Mở File Explorer
2. Điều hướng đến: `D:\Solar\backend-system\dashboard\`
3. Double-click `index.html`

### URL:
```
file:///D:/Solar/backend-system/dashboard/index.html
```

**Lưu ý**: Có thể gặp vấn đề CORS nếu mở file trực tiếp.

## 🌐 Cách 3: Serve qua Web Server riêng

### Python HTTP Server:
```cmd
cd backend-system\dashboard
python -m http.server 3001
```

Truy cập: **http://localhost:3001**

### Node.js http-server:
```cmd
npm install -g http-server
cd backend-system\dashboard
http-server -p 3001
```

Truy cập: **http://localhost:3001**

## 📋 Tóm tắt Links

| Mục đích | URL | Ghi chú |
|----------|-----|---------|
| **Dashboard (Chính)** | http://localhost:5023/ | Trang chủ |
| **Dashboard (Direct)** | http://localhost:5023/dashboard/ | Link trực tiếp |
| **API Health** | http://localhost:5023/health | Kiểm tra server |
| **Swagger Docs** | http://localhost:5023/api-docs | API Documentation |
| **API Base** | http://localhost:5023/api/v1 | API endpoints |

## 🎯 Khuyến nghị

**Sử dụng**: **http://localhost:5023/**

Đây là cách đơn giản nhất vì:
- ✅ Không cần cài thêm gì
- ✅ Tự động có sẵn khi server chạy
- ✅ Không có vấn đề CORS
- ✅ Dễ nhớ (chỉ cần nhớ port)

## 🔧 Nếu đổi port

Nếu bạn đổi port trong `.env` (ví dụ: `PORT=8080`), thì:

- Dashboard: **http://localhost:8080/**
- Swagger: **http://localhost:8080/api-docs**
- Health: **http://localhost:8080/health**

## ⚠️ Lưu ý

1. **Server phải đang chạy**: `npm start`
2. **Port phải đúng**: Kiểm tra trong `.env` hoặc console log
3. **CORS**: Nếu mở file trực tiếp, cần set `CORS_ORIGIN=*` trong `.env`

## 🧪 Test Dashboard

1. Mở: **http://localhost:5023/**
2. Chọn device từ dropdown
3. Click "Tải dữ liệu"
4. Xem charts và statistics

Nếu không có dữ liệu:
- Kiểm tra API: http://localhost:5023/health
- Kiểm tra có device: http://localhost:5023/api/v1/devices
- Xem console browser (F12) để debug







