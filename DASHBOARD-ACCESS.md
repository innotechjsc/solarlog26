# 📊 Cách truy cập Dashboard

## 📍 Vị trí Dashboard

File dashboard nằm tại: `backend-system/dashboard/index.html`

## 🚀 Cách 1: Mở trực tiếp file (Đơn giản nhất)

### Windows:
1. Mở File Explorer
2. Điều hướng đến: `D:\Solar\backend-system\dashboard\`
3. Double-click file `index.html`
4. File sẽ mở trong browser mặc định

Hoặc:
- Right-click `index.html` → "Open with" → Chọn browser

### URL trong browser:
```
file:///D:/Solar/backend-system/dashboard/index.html
```

## 🌐 Cách 2: Serve qua Web Server (Recommended)

### Option A: Python HTTP Server

```cmd
cd backend-system\dashboard
python -m http.server 3001
```

Sau đó mở browser: **http://localhost:3001**

### Option B: Node.js http-server

```cmd
# Cài đặt http-server (một lần)
npm install -g http-server

# Chạy server
cd backend-system\dashboard
http-server -p 3001
```

Sau đó mở browser: **http://localhost:3001**

### Option C: PHP (nếu có PHP)

```cmd
cd backend-system\dashboard
php -S localhost:3001
```

Sau đó mở browser: **http://localhost:3001**

## 🔧 Cách 3: Tích hợp vào Express Server (Nâng cao)

Nếu muốn serve dashboard qua Express server, thêm vào `server.js`:

```javascript
// Serve static files from dashboard folder
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});
```

Sau đó truy cập: **http://localhost:5023/dashboard** hoặc **http://localhost:5023/**

## 📋 Tóm tắt các cách truy cập

| Cách | URL | Ưu điểm | Nhược điểm |
|------|-----|---------|------------|
| Mở file trực tiếp | `file:///D:/Solar/.../index.html` | Đơn giản, không cần server | CORS có thể gặp vấn đề |
| Python HTTP Server | `http://localhost:3001` | Đơn giản, có sẵn Python | Cần Python |
| Node.js http-server | `http://localhost:3001` | Nhanh, tốt cho dev | Cần cài đặt |
| Tích hợp Express | `http://localhost:5023/dashboard` | Tất cả trong một | Cần sửa code |

## ⚠️ Lưu ý về CORS

Nếu mở file trực tiếp và gặp lỗi CORS, cần:

1. Cập nhật file `.env`:
   ```env
   CORS_ORIGIN=*
   ```

2. Hoặc serve qua web server (Cách 2) - sẽ không có vấn đề CORS

## 🎯 Khuyến nghị

**Cách tốt nhất**: Sử dụng Python HTTP Server (Cách 2 - Option A)

```cmd
cd backend-system\dashboard
python -m http.server 3001
```

Sau đó mở: **http://localhost:3001**

## 🔍 Kiểm tra Dashboard có hoạt động

1. Mở Dashboard
2. Chọn device từ dropdown (nếu có)
3. Click "Tải dữ liệu"
4. Xem charts và statistics

Nếu không có dữ liệu:
- Kiểm tra API server đang chạy: `http://localhost:5023/health`
- Kiểm tra có device nào trong database không
- Xem console trong browser (F12) để xem lỗi

## 📝 Cấu hình Dashboard

Dashboard tự động kết nối đến API tại: `http://localhost:5023/api/v1`

Nếu bạn đổi port API, cần sửa trong `dashboard/index.html`:

Tìm dòng:
```javascript
const API_BASE = 'http://localhost:5023/api/v1';
```

Đổi thành port mới:
```javascript
const API_BASE = 'http://localhost:8080/api/v1';  // Port mới
```







