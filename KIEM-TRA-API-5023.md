# Kiểm Tra API Có Chạy Trên Port 5023

## Cách Kiểm Tra Nhanh

### 1. Kiểm Tra Port Có Đang Listen

**PowerShell:**
```powershell
Get-NetTCPConnection -LocalPort 5023
```

**Command Prompt:**
```cmd
netstat -ano | findstr :5023
```

Nếu có kết quả → Port đang listen ✅

### 2. Test Health Endpoint

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5023/health"
```

**Command Prompt:**
```cmd
curl http://localhost:5023/health
```

**Browser:**
```
http://localhost:5023/health
```

Kết quả mong đợi:
```json
{"status":"ok","timestamp":"..."}
```

### 3. Kiểm Tra PM2 Logs

```cmd
pm2 logs solarlogger-api
```

Hoặc xem logs gần nhất:
```cmd
pm2 logs solarlogger-api --lines 50
```

### 4. Kiểm Tra PM2 Status

```cmd
pm2 describe solarlogger-api
```

Hoặc:
```cmd
pm2 show solarlogger-api
```

## Nếu Port 5023 Không Listen

### Nguyên Nhân Thường Gặp

1. **File .env chưa được tạo hoặc sai**
   ```cmd
   # Kiểm tra file .env
   type .env
   
   # Nếu chưa có, tạo từ .env.example
   copy .env.example .env
   ```

2. **MongoDB chưa chạy**
   ```cmd
   docker ps
   # Nếu không thấy solarlogger-mongodb, chạy:
   .\scripts\start-mongodb-wrapper.bat
   ```

3. **Ứng dụng lỗi khi start**
   - Xem logs: `pm2 logs solarlogger-api`
   - Kiểm tra lỗi kết nối MongoDB
   - Kiểm tra PORT trong .env

4. **PM2 chưa start đúng**
   ```cmd
   # Restart
   pm2 restart solarlogger-api
   
   # Hoặc stop và start lại
   pm2 stop solarlogger-api
   pm2 start ecosystem.config.js
   ```

## Script Tự Động Kiểm Tra

Chạy script test:
```powershell
.\scripts\test-api-connection.ps1
```

Script sẽ kiểm tra:
- ✅ Port 5023 có đang listen không
- ✅ Health endpoint có trả lời không
- ✅ PM2 status
- ✅ MongoDB có đang chạy không

## Các Lệnh Hữu Ích

```cmd
# Xem tất cả PM2 processes
pm2 list

# Xem logs real-time
pm2 logs solarlogger-api

# Restart ứng dụng
pm2 restart solarlogger-api

# Xem thông tin chi tiết
pm2 describe solarlogger-api

# Kiểm tra port
netstat -ano | findstr :5023

# Test API
curl http://localhost:5023/health
```

## Nếu Vẫn Không Hoạt Động

1. **Kiểm tra file .env:**
   - `PORT=5023` (hoặc để trống, sẽ dùng default)
   - `MONGODB_URI` đúng với port MongoDB (27019)

2. **Kiểm tra MongoDB:**
   ```cmd
   docker ps | findstr mongodb
   ```

3. **Xem logs chi tiết:**
   ```cmd
   pm2 logs solarlogger-api --err --lines 100
   ```

4. **Thử start thủ công để xem lỗi:**
   ```cmd
   node server.js
   ```

---

**Lưu ý:** Nếu dùng IIS Reverse Proxy, port 5023 chỉ cần listen localhost, không cần public.

