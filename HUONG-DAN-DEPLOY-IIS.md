# Hướng Dẫn Deploy Lên IIS Server

## 📋 Yêu Cầu Hệ Thống

1. **Windows Server** với IIS đã được cài đặt
2. **Node.js** (phiên bản 16.x trở lên) - Tải từ [nodejs.org](https://nodejs.org/)
3. **iisnode** - Module để chạy Node.js trên IIS
4. **Docker Desktop** hoặc Docker Engine để chạy MongoDB

---

## 🚀 Các Bước Deploy

### Bước 1: Cài Đặt iisnode

1. Tải iisnode từ: https://github.com/Azure/iisnode/releases
2. Chạy file cài đặt `iisnode-full-v0.2.26-x64.msi` (hoặc phiên bản mới nhất)
3. Chọn "Complete" installation
4. **Khởi động lại IIS** sau khi cài đặt xong

**Kiểm tra:** Mở IIS Manager → Modules → Kiểm tra có module `iisnode`

### Bước 2: Cài Đặt Node.js

1. Tải và cài đặt Node.js từ [nodejs.org](https://nodejs.org/)
2. Kiểm tra cài đặt thành công:
```cmd
node --version
npm --version
```

### Bước 3: Khởi Động MongoDB

Chạy một trong các lệnh sau:

**PowerShell:**
```powershell
cd backend-system
.\scripts\start-mongodb.ps1
```

**Hoặc Command Prompt:**
```cmd
cd backend-system
scripts\start-mongodb.bat
```

**Kiểm tra MongoDB đã chạy:**
```cmd
docker ps
```

Bạn sẽ thấy container `solarlogger-mongodb` đang chạy.

**Truy cập Mongo Express:** http://localhost:8081
- Username: `admin`
- Password: `admin123`

### Bước 4: Cài Đặt Dependencies

Mở Command Prompt hoặc PowerShell **với quyền Administrator**:

```cmd
cd D:\Solar\backend-system
npm install --production
```

### Bước 5: Cấu Hình Environment Variables

#### Cách 1: Tạo file .env (Khuyến nghị cho lần đầu)

Tạo file `.env` trong thư mục `backend-system`:

```env
PORT=process.env.PORT
NODE_ENV=production
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=your-secure-api-key-here-change-this
CORS_ORIGIN=*
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

**Lưu ý:** Thay `your-secure-api-key-here-change-this` bằng API key bảo mật của bạn.

#### Cách 2: Cấu hình trong IIS (Khuyến nghị cho Production)

1. Mở **IIS Manager**
2. Chọn Website của bạn → **Configuration Editor**
3. Hoặc chọn Application Pool → **Advanced Settings**
4. Thêm các biến môi trường trong **Environment Variables** hoặc **Application Settings**:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin`
   - `ALLOWED_API_KEYS` = `your-secure-api-key-here`
   - `CORS_ORIGIN` = `*` (hoặc domain cụ thể như `https://yourdomain.com`)

### Bước 6: Tạo Website Trong IIS

#### Cách 1: Sử dụng IIS Manager (Giao diện)

1. Mở **IIS Manager**
2. Click chuột phải vào **Sites** → **Add Website**
3. Điền thông tin:
   - **Site name**: `SolarLogger-API`
   - **Application pool**: Tạo mới tên `SolarLoggerAppPool`
   - **Physical path**: `D:\Solar\backend-system`
   - **Binding**: 
     - Type: `http`
     - IP address: `All Unassigned`
     - Port: `3000` (hoặc port bạn muốn)
     - Host name: (để trống hoặc nhập domain)
4. Click **OK**

#### Cách 2: Sử dụng PowerShell (Nhanh hơn)

Mở PowerShell **với quyền Administrator**:

```powershell
Import-Module WebAdministration

# Tạo Application Pool
New-WebAppPool -Name "SolarLoggerAppPool"
Set-ItemProperty IIS:\AppPools\SolarLoggerAppPool -Name managedRuntimeVersion -Value ""

# Tạo Website
New-Website -Name "SolarLogger-API" `
    -Port 3000 `
    -PhysicalPath "D:\Solar\backend-system" `
    -ApplicationPool "SolarLoggerAppPool"
```

### Bước 7: Cấu Hình Application Pool

1. Trong IIS Manager, chọn **Application Pools**
2. Chọn `SolarLoggerAppPool`
3. Click **Advanced Settings**
4. Cấu hình:
   - **.NET CLR Version**: `No Managed Code`
   - **Start Mode**: `AlwaysRunning` (tùy chọn, giúp ứng dụng luôn chạy)
   - **Idle Time-out**: `0` (để không tự động dừng)

### Bước 8: Cấp Quyền Truy Cập

1. Click chuột phải vào thư mục `D:\Solar\backend-system`
2. Chọn **Properties** → Tab **Security**
3. Click **Edit** → **Add**
4. Nhập `IIS_IUSRS` → **OK**
5. Cấp quyền:
   - ✅ Read & Execute
   - ✅ List folder contents
   - ✅ Read
6. Click **OK**

**Thêm quyền cho Application Pool:**
- Thêm user: `IIS AppPool\SolarLoggerAppPool`
- Cấp quyền tương tự như trên

### Bước 9: Khởi Tạo Database (Nếu chưa có)

```powershell
cd backend-system
.\scripts\init-database.ps1
```

### Bước 10: Kiểm Tra và Test

#### Test Health Endpoint

Mở browser hoặc dùng curl:
```cmd
curl http://localhost:3000/health
```

Kết quả mong đợi:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

#### Test với Script

```powershell
cd backend-system
.\scripts\test-system.ps1 -ApiKey "your-api-key-here" -BaseUrl "http://localhost:3000"
```

#### Kiểm Tra Logs

Logs của iisnode nằm trong thư mục `D:\Solar\backend-system\iisnode\`:
- `iisnode.log` - Application logs
- Các file log khác cho từng request

Hoặc xem trong IIS Manager:
- **Failed Request Tracing** (nếu đã bật)
- **Event Viewer** → **Windows Logs** → **Application**

---

## 🔧 Xử Lý Sự Cố (Troubleshooting)

### Lỗi 500.19 - Configuration Error

**Nguyên nhân:** File `web.config` có lỗi cú pháp hoặc iisnode chưa được cài đặt

**Giải pháp:**
- Kiểm tra iisnode đã được cài đặt: IIS Manager → Modules
- Kiểm tra file `web.config` có đúng cú pháp XML không

### Lỗi 500.1001 - Internal Server Error

**Nguyên nhân:** Lỗi trong ứng dụng Node.js

**Giải pháp:**
1. Kiểm tra logs: `D:\Solar\backend-system\iisnode\iisnode.log`
2. Kiểm tra MongoDB đang chạy: `docker ps`
3. Kiểm tra environment variables đã được set chưa
4. Kiểm tra `node_modules` đã được cài đặt: `npm install`

### Application không khởi động

**Giải pháp:**
- Kiểm tra Node.js đã cài đặt và trong PATH: `node --version`
- Kiểm tra `node_modules` đã được cài đặt
- Kiểm tra quyền truy cập của thư mục
- Kiểm tra Application Pool đang chạy

### MongoDB connection failed

**Giải pháp:**
1. Kiểm tra MongoDB container: `docker ps | findstr mongodb`
2. Kiểm tra connection string trong environment variables
3. Test connection:
```cmd
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123
```

### Port đã được sử dụng

**Giải pháp:**
- Thay đổi port trong IIS Binding
- Hoặc dừng service đang sử dụng port đó:
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🔒 Cấu Hình Bảo Mật (Production)

### 1. Cấu Hình SSL/HTTPS

1. Cài đặt SSL certificate trong IIS
2. Thêm HTTPS binding với port 443
3. Cấu hình redirect HTTP → HTTPS (tùy chọn)
4. Cập nhật `CORS_ORIGIN` trong environment variables

### 2. API Key Security

- Sử dụng API key mạnh (ít nhất 32 ký tự)
- Thay đổi API key định kỳ
- Không commit API key vào Git

### 3. CORS Configuration

Thay đổi `CORS_ORIGIN` từ `*` sang domain cụ thể:
```env
CORS_ORIGIN=https://yourdomain.com
```

---

## 📊 Quản Lý và Bảo Trì

### Khởi Động Lại Application

**PowerShell:**
```powershell
Import-Module WebAdministration
Restart-WebAppPool -Name "SolarLoggerAppPool"
```

**IIS Manager:**
- Application Pools → SolarLoggerAppPool → Recycle

### Xem Logs

**PowerShell:**
```powershell
Get-Content "D:\Solar\backend-system\iisnode\iisnode.log" -Tail 50
```

### Cập Nhật Application

1. Dừng Application Pool
2. Copy files mới vào thư mục
3. Chạy `npm install` (nếu có dependencies mới)
4. Khởi động lại Application Pool

### Cấu Hình Firewall

Nếu cần truy cập từ bên ngoài:

1. Mở **Windows Firewall with Advanced Security**
2. **Inbound Rules** → **New Rule**
3. Chọn **Port** → **TCP** → Port `3000` (hoặc port bạn đã cấu hình)
4. Allow connection
5. Apply to all profiles
6. Đặt tên: "SolarLogger API"

---

## ✅ Checklist Deploy

- [ ] iisnode đã được cài đặt
- [ ] Node.js đã được cài đặt
- [ ] MongoDB đang chạy (docker ps)
- [ ] Dependencies đã được cài đặt (npm install)
- [ ] File .env đã được tạo hoặc environment variables đã được cấu hình trong IIS
- [ ] Website đã được tạo trong IIS
- [ ] Application Pool đã được cấu hình (No Managed Code)
- [ ] Quyền truy cập đã được cấp (IIS_IUSRS)
- [ ] Database đã được khởi tạo
- [ ] Health endpoint trả về OK
- [ ] Test script chạy thành công

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. File `DEPLOY-IIS.md` - Hướng dẫn chi tiết hơn
2. Logs trong thư mục `iisnode`
3. Event Viewer trong Windows

---

**Chúc bạn deploy thành công! 🎉**

