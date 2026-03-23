# 🔄 Hướng dẫn Restart Server với WebSocket

**Ngày**: 2026-01-06

---

## ✅ Server đã được restart với WebSocket

Server đã được khởi động lại với WebSocket support. 

**Expected output:**
```
Connected to MongoDB
[WebSocket] Socket.IO server initialized
SolarLogger Backend API server running on port 5023
WebSocket server initialized
Environment: development
MongoDB: mongodb://admin:****@localhost:27019/solarlogger?authSource=admin
```

---

## 🔍 Kiểm tra WebSocket đã hoạt động

### 1. Mở Browser Console

Truy cập: `http://localhost:5023/dashboard/overview.html`

**Kiểm tra Console:**
- ✅ `[WebSocket] Connected to server`
- ✅ `[Overview] Using aggregation endpoint - 1 request instead of 76+!`

### 2. Kiểm tra Network Tab

- ✅ Request đến `/api/v1/dashboard/overview` (1 request duy nhất)
- ✅ WebSocket connection đến `socket.io`
- ✅ Không còn 429 errors

### 3. Test Real-time Updates

**Test WebSocket notifications:**
1. Gửi alarm mới từ device (POST `/api/v1/data` với alarm)
2. Check console: `[WebSocket] New alarm received:`
3. Check dashboard: Alarms được update real-time

---

## 🛠️ Cách Restart Server thủ công

### Windows PowerShell:

```powershell
# 1. Tìm process đang chạy
netstat -ano | findstr :5023

# 2. Stop process (thay PID bằng process ID thực tế)
taskkill /F /PID <PID>

# 3. Start server
cd backend-system
node server.js
```

### Hoặc sử dụng npm:

```powershell
# Nếu đang chạy với npm start
# Dừng bằng Ctrl+C, rồi:
cd backend-system
npm start
```

---

## ⚠️ Troubleshooting

### Port 5023 đã được sử dụng:
- **Lỗi**: `Error: listen EADDRINUSE: address already in use :::5023`
- **Giải pháp**: Stop process cũ trước:
  ```powershell
  netstat -ano | findstr :5023
  taskkill /F /PID <PID>
  ```

### WebSocket không kết nối:
- **Kiểm tra**: Console có `[WebSocket] Connected to server` không?
- **Nguyên nhân**: Socket.IO script chưa load
- **Giải pháp**: Check Network tab xem `socket.io.min.js` có load không

### Aggregation endpoint lỗi:
- **Lỗi**: `404 Not Found` cho `/api/v1/dashboard/overview`
- **Nguyên nhân**: Route chưa được register
- **Giải pháp**: Check `server.js` có `app.use('/api', dashboardRoutes);`

---

## 📊 Verify WebSocket is Working

### Test Script (Browser Console):

```javascript
// Check WebSocket connection
if (window.webSocketClient) {
  console.log('WebSocket Client:', window.webSocketClient.isConnected());
  console.log('Connected:', window.webSocketClient.isConnected());
}

// Test subscribe
if (window.webSocketClient) {
  window.webSocketClient.subscribe({
    project_id: null,
    area_id: null,
    device_id: null
  });
}
```

---

**Tác giả**: AI Assistant  
**Ngày**: 2026-01-06

