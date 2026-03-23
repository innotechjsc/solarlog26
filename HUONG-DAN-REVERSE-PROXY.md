# Hướng Dẫn Dùng IIS Reverse Proxy (Không Cần iisnode)

## Vấn Đề

Lỗi iisnode không đọc được web.config có thể do:
- Version iisnode không tương thích
- Thiếu URL Rewrite module
- Schema iisnode không khớp

## Giải Pháp: Dùng IIS Reverse Proxy

Thay vì dùng iisnode, chạy Node.js trực tiếp và dùng IIS làm reverse proxy.

## Ưu Điểm

- ✅ Không cần iisnode
- ✅ Dễ debug hơn
- ✅ Chạy Node.js như service thông thường
- ✅ Dễ quản lý và restart

## Các Bước Cài Đặt

### Bước 1: Cài Đặt URL Rewrite Module

1. Download **IIS URL Rewrite Module 2.1** từ:
   https://www.iis.net/downloads/microsoft/url-rewrite

2. Cài đặt module

3. Kiểm tra: Mở IIS Manager → Site → URL Rewrite (phải thấy icon)

### Bước 2: Cài Đặt Application Request Routing (ARR)

1. Download **Application Request Routing 3.0** từ:
   https://www.iis.net/downloads/microsoft/application-request-routing

2. Cài đặt module

3. Enable Proxy trong ARR:
   - Mở IIS Manager
   - Click vào server name (root)
   - Double-click **Application Request Routing Cache**
   - Click **Server Proxy Settings** (bên phải)
   - Check **Enable proxy**
   - Click **Apply**

### Bước 3: Cấu Hình Node.js Chạy Như Service

#### Cách 1: Dùng PM2 (Khuyến nghị)

1. **Cài đặt PM2:**
   ```cmd
   npm install -g pm2
   ```

2. **Tạo file ecosystem.config.js:**
   ```javascript
   module.exports = {
     apps: [{
       name: 'solarlogger-api',
       script: './server.js',
       instances: 1,
       exec_mode: 'fork',
       env: {
         NODE_ENV: 'production',
         PORT: 5023
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
     }]
   };
   ```

3. **Cài đặt PM2 Windows Service:**
   ```cmd
   pm2 install pm2-windows-service
   pm2-service-install
   ```

4. **Start ứng dụng:**
   ```cmd
   pm2 start ecosystem.config.js
   pm2 save
   ```

#### Cách 2: Dùng NSSM (Node Service Manager)

1. **Download NSSM** từ: https://nssm.cc/download

2. **Cài đặt service:**
   ```cmd
   nssm install SolarLoggerAPI
   ```
   
   Trong dialog:
   - **Path**: `C:\Program Files\nodejs\node.exe`
   - **Startup directory**: `D:\Solar\backend-system` (hoặc đường dẫn của bạn)
   - **Arguments**: `server.js`

3. **Cấu hình Environment Variables:**
   - Tab **Environment**: Thêm các biến:
     - `NODE_ENV=production`
     - `PORT=5023`
     - `MONGODB_URI=...`
     - `ALLOWED_API_KEYS=...`

4. **Start service:**
   ```cmd
   nssm start SolarLoggerAPI
   ```

### Bước 4: Cấu Hình IIS

1. **Copy file web.config.reverse-proxy thành web.config:**
   ```cmd
   copy web.config.reverse-proxy web.config
   ```

2. **Tạo Website trong IIS:**
   - Site name: `SolarLogger-API`
   - Physical path: `D:\Solar\backend-system` (hoặc đường dẫn của bạn)
   - Port: `80` (hoặc port bạn muốn)
   - Application Pool: `.NET CLR Version: No Managed Code`

3. **Kiểm tra:**
   - Mở browser: `http://localhost/health`
   - Phải trả về: `{"status":"ok",...}`

## Cấu Hình Nâng Cao

### Chạy Trên Port Khác

Nếu muốn IIS chạy trên port khác (ví dụ 3000):

1. **Trong IIS Binding:**
   - Port: `3000`

2. **Trong web.config:**
   - Giữ nguyên: `http://localhost:5023/{R:1}`

### HTTPS/SSL

1. **Cài đặt SSL certificate trong IIS**
2. **Thêm HTTPS binding**
3. **Cập nhật web.config:**
   ```xml
   <action type="Rewrite" url="http://localhost:5023/{R:1}" />
   ```
   Thành:
   ```xml
   <action type="Rewrite" url="http://localhost:5023/{R:1}" />
   ```
   (Giữ nguyên http vì Node.js chạy local)

### Load Balancing (Nhiều Node.js instances)

Nếu chạy nhiều Node.js trên các port khác nhau:

```xml
<rule name="ReverseProxyInboundRule" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTP_HOST}" pattern=".*" />
  </conditions>
  <action type="Rewrite" url="http://localhost:5023/{R:1}" />
</rule>
```

Có thể tạo nhiều rules để load balance.

## Troubleshooting

### Node.js không chạy

```cmd
# Kiểm tra service
pm2 list
# hoặc
sc query SolarLoggerAPI

# Xem logs
pm2 logs
```

### IIS không proxy được

1. Kiểm tra ARR đã enable proxy chưa
2. Kiểm tra URL Rewrite module đã cài chưa
3. Kiểm tra Node.js đang chạy: `netstat -ano | findstr :5023`

### Lỗi 502 Bad Gateway

- Node.js chưa start
- Port 5023 bị block bởi firewall
- Connection string trong web.config sai

## So Sánh

| Tính năng | iisnode | Reverse Proxy |
|-----------|---------|---------------|
| Cài đặt | Phức tạp | Đơn giản hơn |
| Debug | Khó | Dễ |
| Performance | Tốt | Tốt |
| Quản lý | Qua IIS | Qua PM2/NSSM |
| Restart | IIS recycle | PM2 restart |

---

**Khuyến nghị:** Dùng Reverse Proxy với PM2 cho dễ quản lý và debug.

