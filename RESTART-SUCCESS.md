# ✅ Server Restart Complete

**Ngày**: 2026-01-08

---

## 🚀 Đã tạo Script Restart Server

### Option 1: Sử dụng Batch File (Windows - Dễ nhất)

**Chạy file batch:**
```
cd D:\Solar\backend-system
start-server.bat
```

Hoặc **double-click** vào file `start-server.bat` trong thư mục `backend-system`.

### Option 2: Chạy thủ công

**Mở PowerShell hoặc CMD:**
```powershell
cd D:\Solar\backend-system
node server.js
```

---

## ✅ Expected Output khi Server Start:

```
========================================
Starting SolarLogger Server with WebSocket
========================================

Connected to MongoDB
[WebSocket] Socket.IO server initialized
SolarLogger Backend API server running on port 5023
WebSocket server initialized
Environment: development
MongoDB: mongodb://admin:****@localhost:27019/solarlogger?authSource=admin
```

---

## 🔍 Kiểm tra Server đã khởi động:

### 1. Kiểm tra Health Endpoint:
```
http://localhost:5023/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T...",
  "uptime": 123.45
}
```

### 2. Mở Dashboard:
```
http://localhost:5023/dashboard/overview.html
```

**Kiểm tra Browser Console (F12):**
- ✅ `[WebSocket] Connected to server`
- ✅ `[Overview] Using aggregation endpoint - 1 request instead of 76+!`

### 3. Kiểm tra Network Tab:
- ✅ WebSocket connection đến `socket.io`
- ✅ Chỉ 1 request đến `/api/v1/dashboard/overview`

---

## ⚠️ Troubleshooting

### Port 5023 đã được sử dụng:
**Lỗi**: `Error: listen EADDRINUSE: address already in use :::5023`

**Giải pháp**:
```powershell
# Tìm process
netstat -ano | findstr :5023

# Stop process (thay <PID> bằng process ID)
taskkill /F /PID <PID>
```

### MongoDB connection error:
**Lỗi**: `MongoDB connection error`

**Giải pháp**: 
- Kiểm tra MongoDB service đang chạy:
  ```powershell
  Get-Service MongoDB
  ```
- Khởi động MongoDB nếu cần:
  ```powershell
  Start-Service MongoDB
  ```

### WebSocket không kết nối:
**Kiểm tra**:
1. Server logs có `[WebSocket] Socket.IO server initialized` không?
2. Browser console có `[WebSocket] Connected to server` không?
3. Socket.IO script có load trong Network tab không?

---

## 📝 Quick Commands

### Stop Server:
```powershell
# Tìm process trên port 5023
netstat -ano | findstr :5023

# Stop process
taskkill /F /PID <PID>
```

### Start Server:
```powershell
cd D:\Solar\backend-system
node server.js
```

### Hoặc sử dụng Batch file:
```
cd D:\Solar\backend-system
start-server.bat
```

---

**Tác giả**: AI Assistant  
**Ngày**: 2026-01-08

