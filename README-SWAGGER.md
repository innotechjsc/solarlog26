# 📖 Swagger API Documentation

## ✅ Đã tạo Swagger cho API

Hệ thống đã được tích hợp Swagger UI để xem tài liệu API và test các endpoints.

## 🚀 Cách sử dụng

### 1. Cài đặt dependencies

```cmd
npm install
```

Các packages cần thiết:
- `swagger-ui-express` - Swagger UI interface
- `yamljs` - Parse YAML file

### 2. Khởi động server

```cmd
npm start
```

### 3. Truy cập Swagger UI

Mở browser và truy cập:

**http://localhost:5023/api-docs**

(Thay 5023 bằng port bạn đã cấu hình trong `.env`)

## 📋 Tính năng

### ✅ Xem tài liệu API đầy đủ
- Tất cả endpoints
- Request/Response schemas
- Parameters và query strings
- Examples

### ✅ Test API trực tiếp
- Click "Try it out"
- Điền thông tin
- Click "Execute"
- Xem kết quả ngay

### ✅ Xem cURL commands
- Tự động generate cURL
- Copy và paste để dùng
- Có sẵn API key trong header

### ✅ Authentication
- Click "Authorize" để nhập API key
- Tự động thêm vào mọi requests
- Persist trong session

## 📝 Các endpoints có trong Swagger

### Health
- `GET /health` - Health check

### Data Ingestion
- `POST /api/v1/data` - Upload data từ device
- `POST /api/v1/alarms` - Gửi alarm notification

### Devices
- `GET /api/v1/devices` - Danh sách devices
- `GET /api/v1/devices/{deviceId}/realtime` - Dữ liệu realtime
- `GET /api/v1/devices/{deviceId}/history` - Lịch sử dữ liệu
- `GET /api/v1/devices/{deviceId}/summary/hourly` - Tổng hợp giờ
- `GET /api/v1/devices/{deviceId}/summary/daily` - Tổng hợp ngày
- `GET /api/v1/devices/{deviceId}/alarms` - Danh sách alarms

### Analytics
- `GET /api/v1/analytics/performance` - Phân tích hiệu suất
- `GET /api/v1/analytics/energy` - Phân tích năng lượng
- `GET /api/v1/analytics/alarms` - Thống kê alarms

## 🔑 Authentication

### Cách 1: Dùng nút Authorize (Recommended)

1. Click nút **"Authorize"** ở góc trên bên phải
2. Nhập API key của bạn
3. Click **"Authorize"**
4. Tất cả requests sẽ tự động có header `X-API-Key`

### Cách 2: Thêm thủ công

Trong mỗi request, thêm header:
- Name: `X-API-Key`
- Value: `your-api-key-here`

## 📄 Files liên quan

- `swagger.yaml` - OpenAPI specification file
- `server.js` - Tích hợp Swagger UI
- `SWAGGER-GUIDE.md` - Hướng dẫn chi tiết

## 💡 Ví dụ sử dụng

### Test Health Check

1. Mở http://localhost:5023/api-docs
2. Tìm `GET /health`
3. Click "Try it out"
4. Click "Execute"
5. Xem response: `200 OK`

### Upload Data

1. Tìm `POST /api/v1/data`
2. Click "Authorize" và nhập API key
3. Click "Try it out"
4. Sử dụng example có sẵn hoặc điền thông tin
5. Click "Execute"
6. Copy cURL command từ phần "cURL"

### Xem cURL Example

Sau khi test, Swagger sẽ generate cURL command:

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

## 🔧 Customization

### Thay đổi port trong Swagger

Swagger tự động detect port từ server, không cần sửa thủ công.

### Thêm endpoints mới

1. Thêm endpoint vào routes
2. Cập nhật `swagger.yaml` với endpoint mới
3. Restart server

## 📚 Tài liệu tham khảo

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- Xem `SWAGGER-GUIDE.md` để biết chi tiết

---

**Lưu ý**: Nhớ cài đặt dependencies trước khi sử dụng:
```cmd
npm install
```







