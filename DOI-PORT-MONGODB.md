# Đổi Port MongoDB

## Thay Đổi Port

Port MongoDB đã được đổi từ **27018** sang **27019** để tránh conflict với port đã được sử dụng.

## Các File Đã Được Cập Nhật

### File Cấu Hình Chính:
- ✅ `docker-compose.yml` - Port mapping: `27019:27017`
- ✅ `env.example` - Connection string với port 27019
- ✅ `server.js` - Default connection string với port 27019

### Scripts:
- ✅ `scripts/start-mongodb.ps1` - Connection string output
- ✅ `scripts/start-mongodb.bat` - Connection string output

### File Hướng Dẫn:
- ✅ `DEPLOY-README-TEMPLATE.md`
- ✅ `HUONG-DAN-DEPLOY-IIS.md`
- ✅ `DEPLOY-IIS.md`
- ✅ `README-IIS.md`

## Connection String Mới

```
mongodb://admin:solarlogger123@localhost:27019/solarlogger?authSource=admin
```

## Các Bước Tiếp Theo

1. **Dừng container cũ (nếu đang chạy):**
   ```cmd
   docker-compose down
   ```

2. **Khởi động lại với port mới:**
   ```cmd
   docker-compose up -d mongodb
   ```

3. **Cập nhật file .env trên server:**
   - Nếu đã có file `.env`, cập nhật `MONGODB_URI` với port 27019
   - Hoặc copy lại từ `.env.example`

4. **Kiểm tra MongoDB đang chạy:**
   ```cmd
   docker ps
   ```
   Container `solarlogger-mongodb` sẽ map port `27019:27017`

## Nếu Muốn Đổi Port Khác

Nếu port 27019 cũng bị chiếm, bạn có thể đổi sang port khác:

1. **Sửa trong `docker-compose.yml`:**
   ```yaml
   ports:
     - "27020:27017"  # Đổi số port bên trái (27020)
   ```

2. **Cập nhật connection string trong:**
   - `env.example`
   - `server.js` (default connection)
   - Các file hướng dẫn

3. **Tìm và thay thế:**
   ```cmd
   # Tìm tất cả chỗ có port cũ
   grep -r "27019" .
   # Thay thế bằng port mới
   ```

## Kiểm Tra Port Có Đang Được Sử Dụng

**Windows:**
```cmd
netstat -ano | findstr :27019
```

**PowerShell:**
```powershell
Get-NetTCPConnection -LocalPort 27019
```

Nếu có kết quả, port đang được sử dụng.

---

**Port hiện tại:** 27019

