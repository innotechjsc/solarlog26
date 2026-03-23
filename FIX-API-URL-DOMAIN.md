# Sửa Lỗi API URL Khi Deploy Lên Domain

## Vấn Đề

Khi deploy lên domain `sol.adtrade.site`, dashboard vẫn gọi API lên `localhost:5023` thay vì dùng domain hiện tại.

## Nguyên Nhân

File `dashboard/index.html` có hardcode URL:
```javascript
const API_BASE = 'http://localhost:5023/api/v1';
```

## Giải Pháp

Đã sửa để tự động detect base URL:

```javascript
const getApiBase = () => {
    // If running on same domain as API, use relative path
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Development: use localhost:5023
        return 'http://localhost:5023/api/v1';
    } else {
        // Production: use same domain (relative path)
        return '/api/v1';
    }
};
const API_BASE = getApiBase();
```

## Cách Hoạt Động

- **Development (localhost)**: Dùng `http://localhost:5023/api/v1`
- **Production (domain)**: Dùng relative path `/api/v1` (tự động dùng domain hiện tại)

## Sau Khi Sửa

1. **Copy file mới lên server:**
   - Copy `dashboard/index.html` lên server
   - Hoặc copy toàn bộ folder `dashboard/`

2. **Clear browser cache:**
   - Ctrl + F5 để hard refresh
   - Hoặc clear cache trong DevTools

3. **Kiểm tra:**
   - Mở DevTools → Network tab
   - Xem request URL phải là: `http://sol.adtrade.site/api/v1/devices`
   - Không còn `localhost:5023`

## Nếu Vẫn Không Hoạt Động

### Kiểm Tra IIS Reverse Proxy

Đảm bảo IIS đã cấu hình reverse proxy đúng:

1. **Kiểm tra web.config:**
   ```xml
   <action type="Rewrite" url="http://localhost:5023/{R:1}" />
   ```

2. **Kiểm tra ARR đã enable proxy:**
   - IIS Manager → Server → Application Request Routing Cache
   - Server Proxy Settings → Enable proxy

3. **Kiểm tra URL Rewrite module:**
   - Phải có icon URL Rewrite trong IIS Manager

### Kiểm Tra CORS

Nếu vẫn lỗi CORS, kiểm tra CORS_ORIGIN trong `.env`:

```env
CORS_ORIGIN=http://sol.adtrade.site,https://sol.adtrade.site
```

Hoặc nếu dùng HTTPS:
```env
CORS_ORIGIN=https://sol.adtrade.site
```

## Cấu Hình Nâng Cao

### Nếu API Chạy Trên Domain Khác

Nếu API chạy trên domain khác (ví dụ: `api.adtrade.site`), sửa lại:

```javascript
const getApiBase = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5023/api/v1';
    } else if (window.location.hostname === 'sol.adtrade.site') {
        return 'https://api.adtrade.site/api/v1';  // API domain khác
    } else {
        return '/api/v1';  // Same domain
    }
};
```

### Dùng Environment Variable (Nếu Có Build Process)

Nếu có build process, có thể dùng:

```javascript
const API_BASE = window.API_BASE_URL || '/api/v1';
```

Và inject vào HTML:
```html
<script>
    window.API_BASE_URL = 'https://api.adtrade.site/api/v1';
</script>
```

---

**File đã sửa:**
- ✅ `backend-system/dashboard/index.html`
- ✅ `backend-system/iis-deploy/dashboard/index.html`

