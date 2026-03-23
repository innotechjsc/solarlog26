# Sửa lỗi 502 Bad Gateway khi truy cập Admin

**Lỗi 502** nghĩa là reverse proxy (IIS) không nhận được phản hồi hợp lệ từ backend (Node.js).

---

## Các bước kiểm tra (thực hiện trên server)

### 1. Backend Node.js có đang chạy không?

```powershell
# Nếu dùng PM2
pm2 list

# Kiểm tra process solarlogger-api có status "online" không
# Nếu "stopped" hoặc "errored" → backend đã dừng
```

**Nếu backend không chạy:**
```powershell
cd D:\Solar\backend-system
pm2 start server.js --name solarlogger-api
# Hoặc: pm2 start ecosystem.config.js
pm2 save
```

---

### 2. Backend có lắng nghe port 5023 không?

```powershell
netstat -ano | findstr :5023
```

**Kết quả mong đợi:** Có dòng `TCP 0.0.0.0:5023 ... LISTENING`

**Nếu không thấy:**
- Backend chưa chạy hoặc đã crash
- Kiểm tra `.env`: `PORT=5023` (hoặc không đặt = dùng mặc định 5023)

---

### 3. Gọi trực tiếp backend (bỏ qua IIS)

```powershell
curl http://localhost:5023/health
```

Hoặc mở trình duyệt: `http://localhost:5023/health`

**Nếu trả về JSON** (vd `{"status":"ok"}`) → Backend chạy tốt, vấn đề có thể ở IIS/proxy.

**Nếu lỗi (connection refused, timeout):**
- Backend không chạy hoặc không listen đúng port
- Xem log: `pm2 logs solarlogger-api`

---

### 4. Kiểm tra MongoDB

Backend cần kết nối MongoDB để khởi động. Nếu MongoDB không chạy → backend có thể crash.

```powershell
# Kiểm tra MongoDB
netstat -ano | findstr :27017

# Hoặc test kết nối
node scripts/test-mongodb-connection.js
```

**Nếu MongoDB lỗi:** Khởi động MongoDB trước, sau đó restart backend.

---

### 5. Xem log backend (PM2)

```powershell
pm2 logs solarlogger-api --lines 50
```

**Các lỗi thường gặp:**
- `MongoServerSelectionError` / `connect ECONNREFUSED` → MongoDB chưa chạy hoặc sai `MONGODB_URI`
- `Error: listen EADDRINUSE` → Port 5023 đang bị process khác dùng
- `Cannot find module` → Thiếu package, chạy `npm install`

---

### 6. Cấu hình IIS reverse proxy

Nếu dùng `web.config.reverse-proxy`, đảm bảo URL proxy trỏ đúng port:

```xml
<action type="Rewrite" url="http://localhost:5023/{R:1}" />
```

**Kiểm tra:**
- Application Request Routing (ARR) đã cài và **Enable proxy** chưa
- URL Rewrite module đã cài chưa

---

### 7. Restart toàn bộ

```powershell
# Restart backend
pm2 restart solarlogger-api

# Restart IIS
iisreset

# Hoặc restart Application Pool trong IIS Manager
```

---

## Checklist nhanh

| Bước | Lệnh / Kiểm tra | Kết quả mong đợi |
|------|-----------------|------------------|
| 1 | `pm2 list` | solarlogger-api: online |
| 2 | `netstat -ano \| findstr :5023` | Có LISTENING |
| 3 | `curl http://localhost:5023/health` | Trả về JSON |
| 4 | `pm2 logs` | Không có lỗi Mongo / EADDRINUSE |

---

## Nguyên nhân thường gặp

1. **PM2 chưa start** sau khi deploy → `pm2 start server.js --name solarlogger-api`
2. **MongoDB chưa chạy** → Backend crash khi khởi động
3. **Sai MONGODB_URI** trong `.env` → Backend không connect được DB
4. **Port 5023 khác** so với cấu hình web.config → Sửa PORT trong .env hoặc web.config
5. **IIS ARR chưa enable proxy** → Vào IIS → ARR → Server Proxy Settings → Enable

---

*Tài liệu xử lý lỗi 502 — Solar Logger.*
