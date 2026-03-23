# 🔑 Hướng dẫn API Key

## API Key là gì?

**API Key** (Application Programming Interface Key) là một chuỗi mã bí mật dùng để **xác thực** (authentication) khi SolarLogger device gửi dữ liệu lên server.

### Tại sao cần API Key?

1. **Bảo mật**: Chỉ những device có API key hợp lệ mới được phép gửi dữ liệu
2. **Kiểm soát truy cập**: Ngăn chặn người lạ gửi dữ liệu giả mạo
3. **Theo dõi**: Có thể phân biệt các device khác nhau (nếu dùng nhiều API keys)

## Cách hoạt động

```
SolarLogger Device                    Backend API
     |                                    |
     |  POST /api/v1/data                 |
     |  Header: X-API-Key: abc123          |
     |  ---------------------------------> |
     |                                    |
     |                                    | Kiểm tra API key
     |                                    | trong ALLOWED_API_KEYS
     |                                    |
     |  ✅ 200 OK (nếu hợp lệ)            |
     |  <--------------------------------- |
     |                                    |
     |  ❌ 401 Unauthorized (nếu không hợp lệ)
     |  <--------------------------------- |
```

## Cấu hình API Key

### Bước 1: Tạo file `.env`

Trong thư mục `backend-system`, tạo file `.env`:

```env
ALLOWED_API_KEYS=my-secret-key-123,another-key-456
```

**Lưu ý**: 
- Có thể có nhiều API keys, phân cách bằng dấu phẩy
- Mỗi device có thể dùng một API key khác nhau
- API key nên là chuỗi dài, phức tạp để bảo mật

### Bước 2: Ví dụ API Key mạnh

✅ **Tốt** (ví dụ giả — **không** dùng tiền tố giống nhà cung cấp thanh toán):
```
ALLOWED_API_KEYS=solarlogger_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

❌ **Không tốt**:
```
ALLOWED_API_KEYS=123456,abc,password
```

### Bước 3: Cấu hình trong IIS (nếu deploy production)

Trong IIS Manager:
1. Chọn Application Pool
2. **Advanced Settings** → **Environment Variables**
3. Thêm: `ALLOWED_API_KEYS` = `your-secret-key-here`

## Cách sử dụng API Key

### 1. Từ SolarLogger Device (ESP32)

Khi gửi dữ liệu, thêm header:

```c
// Ví dụ trong ESP32 code
http.addHeader("X-API-Key", "my-secret-key-123");
http.addHeader("Content-Type", "application/json");
http.POST("/api/v1/data", jsonPayload);
```

### 2. Test với cURL

```bash
curl -X POST http://localhost:3000/api/v1/data \
  -H "X-API-Key: my-secret-key-123" \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

### 3. Test với PowerShell

```powershell
$headers = @{
    "X-API-Key" = "my-secret-key-123"
    "Content-Type" = "application/json"
}

$body = Get-Content test-data.json -Raw
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/data" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

### 4. Test với Postman

1. Method: `POST`
2. URL: `http://localhost:3000/api/v1/data`
3. Headers:
   - Key: `X-API-Key`
   - Value: `my-secret-key-123`
4. Body: Chọn `raw` → `JSON`, paste dữ liệu

## Các endpoint cần API Key

### ✅ Cần API Key:
- `POST /api/v1/data` - Upload dữ liệu từ device
- `POST /api/v1/alarms` - Gửi alarm notification

### ❌ Không cần API Key:
- `GET /health` - Health check
- `GET /api/v1/devices` - Xem danh sách devices
- `GET /api/v1/devices/:id/realtime` - Xem dữ liệu realtime
- `GET /api/v1/analytics/*` - Xem analytics

## Ví dụ thực tế

### Ví dụ 1: Device gửi dữ liệu thành công

**Request:**
```http
POST /api/v1/data HTTP/1.1
Host: localhost:3000
X-API-Key: my-secret-key-123
Content-Type: application/json

{
  "device_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "data": { ... }
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Data received",
  "server_time": 1703761801
}
```

### Ví dụ 2: Thiếu API Key

**Request:**
```http
POST /api/v1/data HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```

**Response (401 Unauthorized):**
```json
{
  "status": "error",
  "code": "MISSING_API_KEY",
  "message": "API key is required"
}
```

### Ví dụ 3: API Key không hợp lệ

**Request:**
```http
POST /api/v1/data HTTP/1.1
Host: localhost:3000
X-API-Key: wrong-key-123
Content-Type: application/json
```

**Response (401 Unauthorized):**
```json
{
  "status": "error",
  "code": "INVALID_API_KEY",
  "message": "API key is invalid or expired"
}
```

## Best Practices

### 1. Tạo API Key mạnh
- Độ dài: Tối thiểu 32 ký tự
- Bao gồm: Chữ hoa, chữ thường, số, ký tự đặc biệt
- Ví dụ (giả): `solarlogger_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 2. Bảo mật API Key
- ❌ **KHÔNG** commit API key vào Git
- ✅ Thêm `.env` vào `.gitignore`
- ✅ Sử dụng environment variables trong production
- ✅ Rotate (thay đổi) API key định kỳ

### 3. Quản lý nhiều API Keys
```env
# Mỗi device một API key
ALLOWED_API_KEYS=device-001-key-abc123,device-002-key-def456,device-003-key-ghi789
```

### 4. Logging và Monitoring
- Log các request với API key không hợp lệ
- Monitor số lần thất bại để phát hiện tấn công

## Troubleshooting

### Lỗi: "MISSING_API_KEY"
**Nguyên nhân**: Không gửi header `X-API-Key`
**Giải pháp**: Thêm header `X-API-Key` vào request

### Lỗi: "INVALID_API_KEY"
**Nguyên nhân**: 
- API key không đúng
- API key chưa được thêm vào `ALLOWED_API_KEYS` trong `.env`

**Giải pháp**:
1. Kiểm tra API key trong request
2. Kiểm tra file `.env` có đúng không
3. Restart server sau khi sửa `.env`

### API Key không hoạt động sau khi sửa `.env`
**Giải pháp**: Restart server
```cmd
# Nếu chạy với npm
Ctrl+C để dừng, rồi npm start lại

# Nếu chạy trên IIS
Restart Application Pool trong IIS Manager
```

## Tạo API Key nhanh

### Cách 1: Sử dụng PowerShell
```powershell
# Tạo random API key 64 ký tự
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
```

### Cách 2: Sử dụng Node.js
```javascript
// Tạo random API key
const crypto = require('crypto');
const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');
console.log(apiKey);
```

### Cách 3: Sử dụng online tool
- https://www.random.org/strings/
- Tạo string dài 64 ký tự

## Tóm tắt

1. **API Key** = Mật khẩu để device xác thực với server
2. **Cấu hình** trong file `.env`: `ALLOWED_API_KEYS=your-key-here`
3. **Sử dụng** bằng cách thêm header: `X-API-Key: your-key-here`
4. **Bảo mật**: Không commit vào Git, sử dụng key mạnh, rotate định kỳ

---

**Cần thêm thông tin?** Xem `README.md` hoặc `DEPLOY-IIS.md`







