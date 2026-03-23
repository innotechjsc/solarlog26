@echo off
echo ========================================
echo Kiểm tra kết nối Database
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Kiểm tra file .env...
if exist .env (
    echo   File .env tồn tại
    echo   Connection string từ .env:
    findstr "MONGODB_URI" .env
) else (
    echo   File .env KHONG ton tai
    echo   Dang su dung gia tri mac dinh trong server.js
)

echo.
echo [2] Connection string mac dinh (từ server.js):
echo   mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
echo.

echo [3] Kiểm tra MongoDB container...
docker ps --filter "name=solarlogger-mongodb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul
if errorlevel 1 (
    echo   Docker khong chay hoac container khong ton tai
) else (
    echo   Container MongoDB:
    docker ps --filter "name=solarlogger-mongodb" --format "   - Name: {{.Names}}^n   - Status: {{.Status}}^n   - Ports: {{.Ports}}"
)

echo.
echo [4] Thông tin kết nối:
echo   - Host: localhost
echo   - Port: 27019
echo   - Database: solarlogger
echo   - Username: admin
echo   - Password: solarlogger123
echo   - AuthSource: admin
echo.

echo [5] Mongo Express (Web UI):
echo   URL: http://localhost:8082
echo   Username: admin
echo   Password: admin123
echo.

echo ========================================
echo Để thay đổi connection string:
echo   1. Tạo file .env từ env.example
echo   2. Sửa MONGODB_URI trong file .env
echo ========================================
echo.

pause
