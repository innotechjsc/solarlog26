# Quick Start: IIS Reverse Proxy (Không Cần iisnode)

## Vấn Đề

Lỗi iisnode không đọc được web.config → Dùng Reverse Proxy thay thế.

## Các Bước Nhanh

### 1. Cài Đặt Modules IIS

**URL Rewrite Module:**
- Download: https://www.iis.net/downloads/microsoft/url-rewrite
- Cài đặt và restart IIS

**Application Request Routing (ARR):**
- Download: https://www.iis.net/downloads/microsoft/application-request-routing
- Cài đặt
- Enable Proxy: IIS Manager → Server → Application Request Routing Cache → Server Proxy Settings → Enable proxy

### 2. Cài Đặt PM2

```cmd
npm install -g pm2
pm2 install pm2-windows-service
pm2-service-install
```

### 3. Start Node.js với PM2

```cmd
cd D:\Solar\backend-system
pm2 start ecosystem.config.js
pm2 save
```

### 4. Cấu Hình IIS

1. **Copy web.config:**
   ```cmd
   copy web.config.reverse-proxy web.config
   ```

2. **Tạo Website trong IIS:**
   - Site name: `SolarLogger-API`
   - Physical path: `D:\Solar\backend-system`
   - Port: `80`
   - Application Pool: `.NET CLR Version: No Managed Code`

3. **Test:**
   ```cmd
   curl http://localhost/health
   ```

## Kiểm Tra

```cmd
# Kiểm tra Node.js đang chạy
pm2 list

# Kiểm tra port 5023
netstat -ano | findstr :5023

# Xem logs
pm2 logs
```

## Restart

```cmd
# Restart Node.js
pm2 restart solarlogger-api

# Restart IIS
iisreset
```

---

**Xem chi tiết:** `HUONG-DAN-REVERSE-PROXY.md`

