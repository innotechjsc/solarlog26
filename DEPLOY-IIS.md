# Hướng dẫn Deploy trên IIS

## Yêu cầu

1. **Windows Server** với IIS đã cài đặt
2. **Node.js** (v16.x trở lên) - Download từ [nodejs.org](https://nodejs.org/)
3. **iisnode** - Module để chạy Node.js trên IIS
4. **Docker Desktop** hoặc Docker Engine để chạy MongoDB

## Bước 1: Cài đặt iisnode

### Download và cài đặt

1. Download iisnode từ: https://github.com/Azure/iisnode/releases
2. Chạy installer `iisnode-full-v0.2.26-x64.msi` (hoặc version mới nhất)
3. Chọn "Complete" installation
4. Restart IIS sau khi cài đặt

### Kiểm tra cài đặt

Mở IIS Manager, kiểm tra trong "Modules" có `iisnode` module.

## Bước 2: Cài đặt Node.js

1. Download và cài đặt Node.js từ [nodejs.org](https://nodejs.org/)
2. Kiểm tra cài đặt:
```cmd
node --version
npm --version
```

## Bước 3: Khởi động MongoDB với Docker

### Cách 1: Sử dụng script PowerShell (Recommended)

```powershell
cd backend-system
.\scripts\start-mongodb.ps1
```

### Cách 2: Sử dụng script Batch

```cmd
cd backend-system
scripts\start-mongodb.bat
```

### Cách 3: Manual

```cmd
cd backend-system
docker-compose up -d mongodb
```

Kiểm tra MongoDB đã chạy:
```cmd
docker ps
```

Truy cập Mongo Express: http://localhost:8081
- Username: `admin`
- Password: `admin123`

## Bước 4: Cài đặt Dependencies

Mở Command Prompt hoặc PowerShell với quyền Administrator:

```cmd
cd backend-system
npm install --production
```

## Bước 5: Cấu hình Environment Variables

### Cách 1: Tạo file .env (cho development)

Tạo file `.env` trong thư mục `backend-system`:

```env
PORT=process.env.PORT
NODE_ENV=production
MONGODB_URI=mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
API_KEY_HEADER=X-API-Key
ALLOWED_API_KEYS=your-secure-api-key-here
CORS_ORIGIN=*
DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

### Cách 2: Cấu hình trong IIS Application Settings (Recommended cho Production)

1. Mở **IIS Manager**
2. Chọn Application Pool của bạn
3. Click **Advanced Settings**
4. Trong **Environment Variables**, thêm:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin`
   - `ALLOWED_API_KEYS` = `your-secure-api-key-here`
   - `CORS_ORIGIN` = `*` (hoặc domain cụ thể)

Hoặc trong **Application Settings**:
- `NODE_ENV` = `production`
- `MONGODB_URI` = `mongodb://admin:solarlogger123@localhost:27018/solarlogger?authSource=admin`
- `ALLOWED_API_KEYS` = `your-secure-api-key-here`

## Bước 6: Tạo IIS Application

### Cách 1: Sử dụng IIS Manager (GUI)

1. Mở **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. Điền thông tin:
   - **Site name**: `SolarLogger-API`
   - **Application pool**: Tạo mới hoặc chọn existing
   - **Physical path**: Đường dẫn đến thư mục `backend-system`
   - **Binding**: 
     - Type: `http`
     - IP address: `All Unassigned`
     - Port: `3000` (hoặc port khác)
     - Host name: (để trống hoặc nhập domain)
4. Click **OK**

### Cách 2: Sử dụng PowerShell (Administrator)

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

## Bước 7: Cấu hình Application Pool

1. Trong IIS Manager, chọn **Application Pools**
2. Chọn Application Pool của SolarLogger
3. Click **Advanced Settings**
4. Cấu hình:
   - **.NET CLR Version**: `No Managed Code`
   - **Start Mode**: `AlwaysRunning` (optional)
   - **Idle Time-out**: `0` (để không auto-stop)

## Bước 8: Cấu hình Permissions

### Cấp quyền cho IIS_IUSRS

1. Right-click thư mục `backend-system`
2. **Properties** → **Security** tab
3. Click **Edit** → **Add**
4. Nhập `IIS_IUSRS` → **OK**
5. Cấp quyền:
   - ✅ Read & Execute
   - ✅ List folder contents
   - ✅ Read
6. Click **OK**

### Cấp quyền cho Application Pool Identity

1. Tương tự như trên, nhưng thêm user: `IIS AppPool\SolarLoggerAppPool`
2. Cấp quyền tương tự

## Bước 9: Kiểm tra và Test

### Test Health Endpoint

Mở browser hoặc dùng curl:
```cmd
curl http://localhost:3000/health
```

### Test với Script

```powershell
cd backend-system
.\scripts\test-system.ps1 -ApiKey "your-api-key-here" -BaseUrl "http://localhost:3000"
```

### Kiểm tra Logs

Logs của iisnode nằm trong thư mục `iisnode` (tự động tạo):
- `iisnode\iisnode.log` - Application logs
- `iisnode\*.log` - Request logs

Hoặc xem trong IIS Manager:
- **Failed Request Tracing** (nếu enabled)
- **Event Viewer** → **Windows Logs** → **Application**

## Bước 10: Cấu hình Firewall (nếu cần)

Nếu cần truy cập từ bên ngoài:

1. Mở **Windows Firewall with Advanced Security**
2. **Inbound Rules** → **New Rule**
3. Chọn **Port** → **TCP** → Port `3000`
4. Allow connection
5. Apply to all profiles
6. Đặt tên: "SolarLogger API"

## Troubleshooting

### Lỗi 500.19 - Configuration Error

- Kiểm tra `web.config` có syntax đúng không
- Đảm bảo iisnode đã được cài đặt

### Lỗi 500.1001 - Internal Server Error

- Kiểm tra logs trong `iisnode\iisnode.log`
- Kiểm tra MongoDB đang chạy: `docker ps`
- Kiểm tra environment variables đã được set chưa

### Application không start

- Kiểm tra Node.js đã cài đặt và trong PATH
- Kiểm tra `node_modules` đã được cài đặt: `npm install`
- Kiểm tra permissions của thư mục

### MongoDB connection failed

- Kiểm tra MongoDB container: `docker ps | findstr mongodb`
- Kiểm tra connection string trong environment variables
- Test connection: `docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123`

### Port đã được sử dụng

- Thay đổi port trong IIS Binding
- Hoặc stop service đang dùng port đó

## Production Best Practices

1. **SSL/TLS**: Cài đặt SSL certificate và cấu hình HTTPS binding
2. **API Key Security**: Sử dụng strong API keys và rotate định kỳ
3. **Logging**: Cấu hình centralized logging
4. **Monitoring**: Setup monitoring cho uptime và performance
5. **Backup**: Cấu hình backup MongoDB định kỳ
6. **Rate Limiting**: Đã có sẵn trong code, có thể điều chỉnh
7. **CORS**: Giới hạn CORS_ORIGIN chỉ cho domain cần thiết

## Cấu hình SSL/HTTPS

1. Cài đặt SSL certificate trong IIS
2. Thêm HTTPS binding với port 443
3. Redirect HTTP → HTTPS (optional)
4. Update CORS_ORIGIN trong environment variables

## Performance Tuning

Trong `web.config`, điều chỉnh:
- `maxConcurrentRequestsPerProcess`: Tăng nếu cần
- `maxProcessCountPerApplication`: Tăng số worker processes
- `nodeProcessCountPerApplication`: Số Node.js processes

## Maintenance

### Restart Application

```powershell
Import-Module WebAdministration
Restart-WebAppPool -Name "SolarLoggerAppPool"
```

### View Logs

```powershell
Get-Content "D:\Solar\backend-system\iisnode\iisnode.log" -Tail 50
```

### Update Application

1. Stop Application Pool
2. Copy files mới
3. `npm install` (nếu có dependencies mới)
4. Start Application Pool

