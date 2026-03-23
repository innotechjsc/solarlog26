# 🔧 Troubleshooting API Key Issues

## Vấn đề: API Key "123" không hoạt động

Nếu bạn đã thêm `X-API-Key: 123` trong Postman nhưng vẫn báo lỗi "MISSING_API_KEY", hãy kiểm tra các bước sau:

## ✅ Checklist

### 1. Kiểm tra file `.env`

Mở file `backend-system\.env` và đảm bảo có dòng:
```env
ALLOWED_API_KEYS=123
```

**Lưu ý**: 
- Không có khoảng trắng: `ALLOWED_API_KEYS=123` ✅
- Không có dấu ngoặc kép: `ALLOWED_API_KEYS="123"` ❌
- Không có khoảng trắng sau dấu `=`: `ALLOWED_API_KEYS= 123` ❌

### 2. **QUAN TRỌNG: Restart Server**

Sau khi sửa `.env`, **BẮT BUỘC phải restart server**:

```cmd
# Dừng server (Ctrl+C)
# Khởi động lại
npm start
```

File `.env` chỉ được đọc khi server khởi động!

### 3. Kiểm tra Header trong Postman

Trong Postman, đảm bảo:
- **Key**: `X-API-Key` (chính xác, không có khoảng trắng)
- **Value**: `123` (chính xác, không có khoảng trắng)
- Header phải được **enabled** (checkbox được tick)

### 4. Kiểm tra Server Logs

Sau khi restart, khi bạn gửi request, server sẽ log ra console:
```
API Key check: {
  headerName: 'X-API-Key',
  receivedKey: '123',
  allowedKeys: [ '123' ],
  allHeaders: [ 'x-api-key' ]
}
```

Nếu `receivedKey` là `'NOT FOUND'`, có nghĩa là header không được gửi đúng.

## 🔍 Các lỗi thường gặp

### Lỗi 1: "MISSING_API_KEY"

**Nguyên nhân**: Header không được gửi hoặc tên header sai

**Giải pháp**:
1. Kiểm tra trong Postman:
   - Tab "Headers" có header `X-API-Key` không?
   - Header có được enable không?
   - Value có đúng `123` không?

2. Kiểm tra server logs để xem header có được nhận không

### Lỗi 2: "INVALID_API_KEY"

**Nguyên nhân**: API key không khớp với `ALLOWED_API_KEYS` trong `.env`

**Giải pháp**:
1. Kiểm tra file `.env` có đúng `ALLOWED_API_KEYS=123` không
2. Kiểm tra có khoảng trắng thừa không
3. **Restart server** sau khi sửa `.env`

### Lỗi 3: Header không được nhận

**Nguyên nhân**: Có thể do CORS hoặc middleware

**Giải pháp**:
1. Kiểm tra server logs
2. Thử với cURL để so sánh:
   ```bash
   curl -X POST http://localhost:5023/api/v1/data \
     -H "X-API-Key: 123" \
     -H "Content-Type: application/json" \
     -d '{"device_id":"test"}'
   ```

## 🧪 Test từng bước

### Bước 1: Test Health Check (không cần API key)

```bash
curl http://localhost:5023/health
```

Nếu thành công → Server đang chạy

### Bước 2: Test với API key sai (để xem lỗi)

```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test"}'
```

Kết quả mong đợi: `401 INVALID_API_KEY`

### Bước 3: Test với API key đúng

```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: 123" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"SL-2025-0001","timestamp":1703761800,"data":{"system":{"total_ac_power":450.5}}}'
```

Kết quả mong đợi: `200 OK` với `"status": "success"`

## 📝 Cấu hình đúng trong Postman

1. **Method**: `POST`
2. **URL**: `http://localhost:5023/api/v1/data`
3. **Headers Tab**:
   - `X-API-Key`: `123` ✅ (enabled)
   - `Content-Type`: `application/json` ✅ (enabled)
4. **Body Tab**:
   - Chọn `raw`
   - Chọn `JSON`
   - Paste JSON data

## 🔄 Nếu vẫn không hoạt động

1. **Kiểm tra file `.env` có đúng format không**:
   ```env
   ALLOWED_API_KEYS=123
   ```
   (Không có khoảng trắng, không có quotes)

2. **Restart server**:
   ```cmd
   # Dừng hoàn toàn (Ctrl+C)
   # Start lại
   npm start
   ```

3. **Kiểm tra server logs** khi gửi request để xem:
   - Header có được nhận không
   - API key có đúng không
   - Allowed keys có gì

4. **Thử với cURL** để so sánh với Postman

5. **Kiểm tra có nhiều instance server đang chạy không**:
   ```cmd
   netstat -ano | findstr :5023
   ```

## ✅ Kết quả mong đợi khi thành công

Response từ server:
```json
{
  "status": "success",
  "message": "Data received",
  "server_time": 1703761801
}
```

---

**Lưu ý quan trọng nhất**: File `.env` chỉ được đọc khi server **khởi động**. Phải **restart server** sau khi sửa `.env`!







