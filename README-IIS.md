# Quick Start cho IIS Deployment

## Bước nhanh để chạy thử

### 1. Khởi động MongoDB

```powershell
cd backend-system
.\scripts\start-mongodb.ps1
```

Hoặc dùng batch:
```cmd
scripts\start-mongodb.bat
```

### 2. Khởi tạo Database

```powershell
.\scripts\init-database.ps1
```

### 3. Test hệ thống (sau khi start API server)

```powershell
.\scripts\test-system.ps1 -ApiKey "your-api-key-here"
```

### 4. Hoặc chạy tất cả cùng lúc

```powershell
.\scripts\run-all.ps1
```

## Các file quan trọng

- `DEPLOY-IIS.md` - Hướng dẫn chi tiết deploy trên IIS
- `web.config` - Cấu hình IIS với iisnode
- `scripts/` - Các script tiện ích

## MongoDB Connection

- **Connection String**: `mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin`
- **Mongo Express**: http://localhost:8082 (admin/admin123)

## Troubleshooting

Nếu gặp lỗi, xem `DEPLOY-IIS.md` phần Troubleshooting.

