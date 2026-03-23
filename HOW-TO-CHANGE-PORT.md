# 🔧 Cách thay đổi Port trong file .env

## ✅ Có thể sửa port trong file .env

Code đã được cấu hình để đọc PORT từ file `.env`.

## Các bước:

### 1. Tạo file `.env` (nếu chưa có)

Trong thư mục `backend-system`, tạo file `.env`:

```cmd
copy env.example .env
```

Hoặc tạo thủ công file `.env` với nội dung:

```env
PORT=5023
NODE_ENV=development
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=your-api-key-here
CORS_ORIGIN=*
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

### 2. Sửa PORT trong file `.env`

Mở file `.env` và thay đổi dòng `PORT=`:

```env
# Ví dụ: Đổi sang port 8080
PORT=8080

# Hoặc port 9000
PORT=9000

# Hoặc bất kỳ port nào bạn muốn
PORT=12345
```

### 3. Khởi động lại server

Sau khi sửa `.env`, **bắt buộc phải restart server**:

```cmd
# Dừng server (Ctrl+C nếu đang chạy)
# Sau đó start lại
npm start
```

Server sẽ tự động đọc port mới từ file `.env`.

## Thứ tự ưu tiên Port

Code sẽ đọc port theo thứ tự:

1. **`process.env.PORT`** (từ file `.env`) - **Ưu tiên cao nhất**
2. `process.env.IISNODE_HTTP_PORT` (nếu chạy trên IIS)
3. `5023` (default nếu không có .env)

## Ví dụ:

### Ví dụ 1: Port 8080

File `.env`:
```env
PORT=8080
```

Server sẽ chạy trên: **http://localhost:8080**

### Ví dụ 2: Port 9000

File `.env`:
```env
PORT=9000
```

Server sẽ chạy trên: **http://localhost:9000**

## Lưu ý quan trọng:

### ⚠️ Phải restart server sau khi sửa .env

File `.env` chỉ được đọc khi server khởi động. Nếu bạn sửa `.env` khi server đang chạy, phải:
1. Dừng server (Ctrl+C)
2. Start lại (`npm start`)

### ⚠️ Cập nhật Dashboard nếu đổi port

Nếu bạn đổi port, cần cập nhật `dashboard/index.html`:

Mở file `dashboard/index.html`, tìm dòng:
```javascript
const API_BASE = 'http://localhost:5023/api/v1';
```

Đổi thành port mới:
```javascript
const API_BASE = 'http://localhost:8080/api/v1';  // Port mới của bạn
```

### ⚠️ Cập nhật test scripts

Nếu đổi port, cập nhật test scripts:

**test-system.ps1**:
```powershell
[string]$BaseUrl = "http://localhost:8080"  # Port mới
```

**test-system.bat**:
```cmd
set BASE_URL=http://localhost:8080  # Port mới
```

## Kiểm tra Port đang sử dụng:

### Windows:
```cmd
netstat -ano | findstr :5023
```

### Hoặc xem trong console khi start server:
```
SolarLogger Backend API server running on port 5023
```

## Troubleshooting:

### Port đã được sử dụng?

Nếu gặp lỗi `EADDRINUSE: address already in use :::8080`:

1. Tìm process đang dùng port:
```cmd
netstat -ano | findstr :8080
```

2. Kill process đó (thay PID bằng số từ bước 1):
```cmd
taskkill /PID <PID> /F
```

3. Hoặc đổi sang port khác trong `.env`

### Server không đọc port từ .env?

1. Kiểm tra file `.env` có đúng tên không (phải là `.env`, không phải `.env.txt`)
2. Kiểm tra file `.env` có trong thư mục `backend-system` không
3. Kiểm tra syntax trong `.env`:
   - ✅ Đúng: `PORT=8080`
   - ❌ Sai: `PORT = 8080` (có khoảng trắng)
   - ❌ Sai: `PORT="8080"` (có dấu ngoặc kép)

## Tóm tắt:

✅ **Có thể sửa port trong file `.env`**
✅ Chỉ cần thay đổi dòng `PORT=5023` thành port mới
✅ **Nhớ restart server** sau khi sửa
✅ Cập nhật dashboard và test scripts nếu cần







