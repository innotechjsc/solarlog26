# 🚀 CURL Quick Start - Payload 0.9.0

## ⚡ Copy & Paste nhanh

### 1. Sử dụng file payload có sẵn (Khuyên dùng)

**Windows CMD:**
```cmd
curl -X POST http://localhost:5023/api/v1/data ^
  -H "X-API-Key: your-api-key-here" ^
  -H "Content-Type: application/json" ^
  -d @../payload/payload/basic_payload.json
```

**Linux/Mac/Git Bash:**
```bash
curl -X POST http://localhost:5023/api/v1/data \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d @../payload/payload/basic_payload.json
```

**PowerShell:**
```powershell
$apiKey = "your-api-key-here"
$headers = @{ "X-API-Key" = $apiKey; "Content-Type" = "application/json" }
$body = Get-Content -Path "../payload/payload/basic_payload.json" -Raw
Invoke-RestMethod -Uri "http://localhost:5023/api/v1/data" -Method Post -Headers $headers -Body $body
```

### 2. Sử dụng script test (Tự động update timestamp)

**Windows:**
```cmd
cd backend-system\scripts
test-payload-0.9.0.bat your-api-key-here
```

**PowerShell:**
```powershell
cd backend-system\scripts
.\test-payload-0.9.0.ps1 -ApiKey "your-api-key-here"
```

**Linux/Mac/Git Bash:**
```bash
cd backend-system/scripts
chmod +x test-payload-0.9.0.sh
./test-payload-0.9.0.sh your-api-key-here
```

## 📝 Thay đổi gì?

1. **Thay `your-api-key-here`** → API key từ file `.env`
2. **Thay port** → `5023` → port của server bạn
3. **Thay host** → `localhost` → domain/server của bạn nếu deploy

## 🔑 Lấy API Key

Mở file `backend-system\.env`:
```env
ALLOWED_API_KEYS=your-api-key-here,another-key
```

## ✅ Response thành công

```json
{
  "status": "success",
  "message": "Data received",
  "server_time": 1703761800
}
```

## 📚 Chi tiết

Xem file `CURL-PAYLOAD-0.9.0.md` để biết thêm ví dụ chi tiết.

