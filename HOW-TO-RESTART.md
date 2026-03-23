# 🔄 Hướng dẫn Restart Server với WebSocket

**Ngày**: 2026-01-06

---

## ✅ Đã hoàn thành

1. ✅ **Socket.IO đã được cài đặt**
2. ✅ **WebSocket Service đã được tạo** (`services/websocketService.js`)
3. ✅ **Code đã được cập nhật** để hỗ trợ WebSocket

---

## 🚀 Cách Restart Server

### Cách 1: Dừng process cũ và start lại (Khuyến nghị)

**Bước 1: Tìm process đang chạy trên port 5023**
```powershell
netstat -ano | findstr :5023
```

**Bước 2: Dừng process cũ**
```powershell
# Thay <PID> bằng process ID từ bước 1
taskkill /F /PID <PID>
```

**Bước 3: Start server mới**
```powershell
cd D:\Solar\backend-system
node server.js
```

### Cách 2: Sử dụng PowerShell Script

```powershell
cd D:\Solar\backend-system
.\start-server.ps1
```

### Cách 3: Sử dụng npm (nếu có)

```powershell
cd D:\Solar\backend-system
npm start
```

---

## 🔍 Kiểm tra Server đã khởi động

### Expected Output:
```
Connected to MongoDB
[WebSocket] Socket.IO server initialized
SolarLogger Backend API server running on port 5023
WebSocket server initialized
Environment: development
MongoDB: mongodb://admin:****@localhost:27019/solarlogger?authSource=admin
```

### Test Server:
```powershell
# Test health endpoint
Invoke-WebRequest -Uri http://localhost:5023/health

# Test devices endpoint
Invoke-WebRequest -Uri http://localhost:5023/api/v1/devices
```

---

## 🔌 Kiểm tra WebSocket hoạt động

### 1. Mở Browser

Truy cập: `http://localhost:5023/dashboard/overview.html`

### 2. Mở Browser Console (F12)

**Expected output:**
```
[WebSocket] Connected to server
[Overview] Using aggregation endpoint - 1 request instead of 76+!
```

### 3. Kiểm tra Network Tab

- ✅ WebSocket connection đến `socket.io`
- ✅ Request đến `/api/v1/dashboard/overview` (1 request duy nhất)
- ✅ Không còn 429 errors

---

## ⚠️ Troubleshooting

### Port 5023 đã được sử dụng:
**Lỗi**: `Error: listen EADDRINUSE: address already in use :::5023`

**Giải pháp**:
```powershell
# Tìm process
netstat -ano | findstr :5023

# Stop process
taskkill /F /PID <PID>
```

### MongoDB connection error:
**Lỗi**: `MongoDB connection error`

**Giải pháp**: 
- Kiểm tra MongoDB service đang chạy
- Kiểm tra connection string trong `.env` hoặc `server.js`

### WebSocket không kết nối:
**Kiểm tra**:
1. Server logs có `[WebSocket] Socket.IO server initialized` không?
2. Browser console có `[WebSocket] Connected to server` không?
3. Socket.IO script có load trong Network tab không?

**Giải pháp**:
- Kiểm tra CORS settings
- Kiểm tra firewall
- Kiểm tra Socket.IO script được load

---

## 📝 Quick Start

**Copy và paste vào PowerShell:**

```powershell
# Stop old processes
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -lt (Get-Date).AddMinutes(-1) } | Stop-Process -Force

# Start server
cd D:\Solar\backend-system
node server.js
```

---

**Tác giả**: AI Assistant  
**Ngày**: 2026-01-06

