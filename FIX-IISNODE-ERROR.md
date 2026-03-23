# Xử Lý Lỗi iisnode Configuration

## Lỗi

```
iisnode was unable to read the configuration file. 
Make sure the web.config file syntax is correct.
```

## Nguyên Nhân

1. **Version iisnode không tương thích** với schema trong web.config
2. **Thiếu URL Rewrite module** trong IIS
3. **Cấu hình iisnode không đúng** với schema yêu cầu
4. **File iisnode.yml** có vấn đề

## Giải Pháp

### Giải Pháp 1: Sửa web.config (Đơn giản hóa)

1. **Backup web.config hiện tại:**
   ```cmd
   copy web.config web.config.backup
   ```

2. **Dùng file web.config.simple:**
   ```cmd
   copy web.config.simple web.config
   ```

3. **Xóa dòng `configOverrides="iisnode.yml"`** nếu vẫn lỗi

### Giải Pháp 2: Kiểm Tra URL Rewrite Module

1. **Kiểm tra đã cài chưa:**
   - Mở IIS Manager
   - Click vào Site
   - Xem có icon **URL Rewrite** không

2. **Nếu chưa có, cài đặt:**
   - Download từ: https://www.iis.net/downloads/microsoft/url-rewrite
   - Cài đặt và restart IIS

### Giải Pháp 3: Kiểm Tra iisnode Version

1. **Kiểm tra version iisnode:**
   - IIS Manager → Modules
   - Tìm `iisnode`, xem version

2. **Kiểm tra schema:**
   - Mở file: `C:\Windows\System32\inetsrv\config\schema\iisnode_schema.xml`
   - So sánh với các thuộc tính trong web.config

3. **Xóa các thuộc tính không hỗ trợ:**
   - Chỉ giữ các thuộc tính cơ bản
   - Xem file `web.config.simple` để tham khảo

### Giải Pháp 4: Dùng Reverse Proxy (Khuyến nghị)

Thay vì dùng iisnode, dùng IIS Reverse Proxy:

1. **Cài đặt ARR (Application Request Routing)**
2. **Chạy Node.js như service** (PM2 hoặc NSSM)
3. **Dùng web.config.reverse-proxy**

Xem chi tiết: `HUONG-DAN-REVERSE-PROXY.md`

## File web.config Đơn Giản

File `web.config.simple` đã được tạo với cấu hình tối thiểu:

```xml
<iisnode
  node_env="production"
  nodeProcessCountPerApplication="1"
  maxConcurrentRequestsPerProcess="1024"
  loggingEnabled="true"
  logDirectory="iisnode"
  debuggingEnabled="false"
/>
```

## Kiểm Tra

Sau khi sửa:

1. **Restart IIS:**
   ```cmd
   iisreset
   ```

2. **Kiểm tra logs:**
   - `iisnode\iisnode.log`
   - Event Viewer

3. **Test:**
   ```cmd
   curl http://localhost/health
   ```

## Nếu Vẫn Lỗi

Chuyển sang dùng **Reverse Proxy** (xem `HUONG-DAN-REVERSE-PROXY.md`) - Đơn giản và ổn định hơn.

