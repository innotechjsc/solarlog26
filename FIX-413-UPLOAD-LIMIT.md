# Sửa lỗi 413 Content Too Large khi upload firmware OTA

**Lỗi 413** xảy ra khi file upload vượt giới hạn cho phép của server/proxy.

---

## Đã cập nhật trong code

- `web.config` và `web.config.reverse-proxy`: `maxAllowedContentLength="209715200"` (200 MB)
- Backend (Multer) đã cho phép tối đa 200 MB

---

## Các bước triển khai trên server

### 1. Cập nhật web.config trên server

Copy file `web.config.reverse-proxy` lên server (hoặc sửa trực tiếp):

```xml
<requestLimits maxAllowedContentLength="209715200" />
```

(209715200 bytes = 200 MB)

### 2. Restart IIS

```powershell
iisreset
```

### 3. Nếu dùng Cloudflare (Cf-Ray trong response)

Cloudflare có giới hạn upload:
- **Free/Pro**: ~100 MB
- **Business**: ~200 MB
- **Enterprise**: ~500 MB

**Cách xử lý:**
- Nếu file < 100 MB: thường không vấn đề
- Nếu file > 100 MB: cần nâng cấp plan hoặc **tắt proxy (chỉ DNS)** cho subdomain API để request đi thẳng tới server, không qua Cloudflare

---

## Kiểm tra kích thước file

```powershell
# Windows
(Get-Item "cm4-update-image-cm4-gateway.swu").Length / 1MB
```

Nếu file > 10 MB và chưa sửa IIS → 413. Sau khi tăng limit lên 200 MB, upload sẽ chạy (trừ khi file > giới hạn Cloudflare).
