# 🔧 Sửa file .env để API Key hoạt động

## ❌ Vấn đề hiện tại

Từ log bạn gửi, tôi thấy:
```
headerName: 'D23EbDE205Ac719E,123'  ← SAI! Đây không phải tên header
allowedKeys: [ 'your-api-key-here', 'another-api-key' ]  ← Chưa có "123"
```

## ✅ Cách sửa file .env

Mở file `backend-system\.env` và sửa như sau:

### Trước (SAI):
```env
API_KEY_HEADER=D23EbDE205Ac719E,123
ALLOWED_API_KEYS=your-api-key-here,another-api-key
```

### Sau (ĐÚNG):
```env
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=123
```

## 📝 Giải thích

### `API_KEY_HEADER`
- **Mục đích**: Tên của header để tìm API key
- **Giá trị đúng**: `X-API-Key` (tên header)
- **Giá trị sai**: `D23EbDE205Ac719E,123` (đây là giá trị, không phải tên)

### `ALLOWED_API_KEYS`
- **Mục đích**: Danh sách các API keys được phép
- **Giá trị đúng**: `123` (hoặc `123,key2,key3` nếu có nhiều keys)
- **Giá trị sai**: `your-api-key-here,another-api-key` (chưa được cập nhật)

## 🔄 Các bước thực hiện

### Bước 1: Mở file `.env`

Mở file `backend-system\.env` bằng Notepad hoặc editor bất kỳ.

### Bước 2: Sửa 2 dòng này

Tìm và sửa:
```env
# Dòng này
API_KEY_HEADER=X-API-Key

# Dòng này
ALLOWED_API_KEYS=123
```

### Bước 3: Lưu file

Lưu file `.env`

### Bước 4: **QUAN TRỌNG - Restart Server**

```cmd
# Dừng server (Ctrl+C)
# Khởi động lại
npm start
```

## ✅ File .env đúng hoàn chỉnh

```env
# Server Configuration
PORT=5023
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin

# API Security
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=123

# CORS
CORS_ORIGIN=*

# Timezone
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

## 🧪 Test sau khi sửa

Sau khi restart server, test lại:

```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: 123" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"SL-2025-0001","timestamp":1703761800,"data":{"system":{"total_ac_power":450.5}}}'
```

Hoặc trong Postman:
- Header: `X-API-Key: 123`
- Body: JSON data

## 📊 Log mong đợi sau khi sửa đúng

Sau khi sửa và restart, log sẽ là:
```
API Key check: {
  headerName: 'X-API-Key',
  receivedKey: '123',
  allowedKeys: [ '123' ],
  headerValue: '123'
}
```

## ⚠️ Lưu ý

1. **`API_KEY_HEADER`** = Tên header (không phải giá trị)
2. **`ALLOWED_API_KEYS`** = Giá trị API key được phép
3. **Phải restart server** sau khi sửa `.env`
4. Không có khoảng trắng thừa trong `.env`

## 🔍 Nếu vẫn không hoạt động

1. Kiểm tra file `.env` có đúng format không
2. Kiểm tra server logs để xem:
   - `headerName` có phải `'X-API-Key'` không
   - `allowedKeys` có chứa `'123'` không
   - `receivedKey` có phải `'123'` không
3. Đảm bảo đã restart server
4. Kiểm tra trong Postman header `X-API-Key` có được enable không







