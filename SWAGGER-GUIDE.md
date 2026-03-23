# 📚 Hướng dẫn Swagger API Documentation

## Swagger là gì?

Swagger (OpenAPI) là công cụ để:
- ✅ Xem tài liệu API đầy đủ
- ✅ Test API trực tiếp từ browser
- ✅ Xem các ví dụ curl commands
- ✅ Hiểu rõ request/response format

## Truy cập Swagger UI

Sau khi khởi động server, mở browser và truy cập:

**http://localhost:5023/api-docs**

(Thay 5023 bằng port bạn đã cấu hình trong `.env`)

## Cách sử dụng

### 1. Xem tài liệu API

- Click vào từng endpoint để xem chi tiết
- Xem request body, parameters, responses
- Xem các ví dụ (Examples)

### 2. Test API trực tiếp

1. Click vào endpoint bạn muốn test
2. Click nút **"Try it out"**
3. Điền các thông tin cần thiết:
   - Parameters
   - Request body (nếu có)
   - API Key (trong phần "Authorize")
4. Click **"Execute"**
5. Xem kết quả ở phần "Responses"

### 3. Xem cURL commands

Sau khi click "Try it out" và điền thông tin, Swagger sẽ tự động generate cURL command ở phần "cURL" phía dưới.

Bạn có thể copy cURL command đó và chạy trong terminal.

## Authentication (API Key)

### Cách 1: Dùng nút "Authorize"

1. Click nút **"Authorize"** ở góc trên bên phải
2. Nhập API key của bạn
3. Click **"Authorize"**
4. Tất cả requests sẽ tự động thêm header `X-API-Key`

### Cách 2: Thêm thủ công trong request

Khi test endpoint, trong phần "Parameters" hoặc "Headers", thêm:
- Name: `X-API-Key`
- Value: `your-api-key-here`

## Ví dụ sử dụng

### Ví dụ 1: Test Health Check

1. Mở http://localhost:5023/api-docs
2. Tìm endpoint `GET /health`
3. Click "Try it out"
4. Click "Execute"
5. Xem response: `200 OK` với status "ok"

### Ví dụ 2: Upload Data

1. Tìm endpoint `POST /api/v1/data`
2. Click "Authorize" và nhập API key
3. Click "Try it out"
4. Điền request body (hoặc dùng example có sẵn)
5. Click "Execute"
6. Xem response và cURL command

### Ví dụ 3: Get Devices

1. Tìm endpoint `GET /api/v1/devices`
2. Click "Try it out"
3. Click "Execute"
4. Xem danh sách devices

## Các tính năng

### ✅ Xem tất cả endpoints
- Health check
- Data ingestion (upload data, alarms)
- Device management
- Analytics

### ✅ Xem schema definitions
- Request schemas
- Response schemas
- Data models

### ✅ Test trực tiếp
- Không cần Postman
- Không cần cURL thủ công
- Test ngay trong browser

### ✅ Xem cURL examples
- Tự động generate cURL commands
- Copy và paste để dùng

## Troubleshooting

### Swagger UI không load được?

1. Kiểm tra server đã chạy chưa:
   ```cmd
   curl http://localhost:5023/health
   ```

2. Kiểm tra dependencies đã cài chưa:
   ```cmd
   npm install
   ```

3. Kiểm tra file `swagger.yaml` có tồn tại không

### API Key không hoạt động?

1. Đảm bảo đã click "Authorize" và nhập API key
2. Hoặc thêm header `X-API-Key` thủ công trong request

### Port khác với 5023?

Cập nhật trong file `swagger.yaml`, phần `servers`:
```yaml
servers:
  - url: http://localhost:YOUR_PORT
```

Hoặc sử dụng biến:
```yaml
servers:
  - url: http://localhost:{port}
    variables:
      port:
        default: '5023'
```

## Export cURL commands

Sau khi test trong Swagger UI, bạn có thể:
1. Copy cURL command từ phần "cURL"
2. Lưu vào file `.sh` hoặc `.bat`
3. Chạy trong terminal

Ví dụ cURL được generate:
```bash
curl -X 'POST' \
  'http://localhost:5023/api/v1/data' \
  -H 'accept: application/json' \
  -H 'X-API-Key: your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
  "device_id": "SL-2025-0001",
  "timestamp": 1703761800,
  ...
}'
```

## Tóm tắt

✅ **Truy cập**: http://localhost:5023/api-docs
✅ **Test API**: Click "Try it out" → Điền thông tin → "Execute"
✅ **Xem cURL**: Copy từ phần "cURL" sau khi test
✅ **Authentication**: Click "Authorize" và nhập API key

---

**Lưu ý**: Nhớ cài đặt dependencies trước:
```cmd
npm install
```







