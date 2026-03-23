# Sửa Lỗi Port MongoDB Không Khớp

## Vấn Đề

Từ output `docker ps`, MongoDB container đang chạy trên port **20719** nhưng cấu hình yêu cầu port **27019**.

## Kiểm Tra

### 1. Kiểm Tra Container

```cmd
docker ps | findstr solarlogger-mongodb
```

Output mẫu:
```
cac88f6c97a5   mongo:7.0   ...   0.0.0.0:20719->27017/tcp   solarlogger-mongodb
```

- ✅ Container name: `solarlogger-mongodb` (ĐÚNG)
- ⚠️ Port: `20719` (KHÁC với cấu hình 27019)

### 2. Chạy Script Kiểm Tra

```powershell
.\scripts\check-mongodb.ps1
```

Script sẽ:
- Kiểm tra container có đang chạy
- Phát hiện port thực tế
- Hiển thị connection string đúng
- Test kết nối MongoDB

## Giải Pháp

### Cách 1: Cập Nhật File .env (Nhanh nhất)

Cập nhật port trong file `.env`:

```env
MONGODB_URI=mongodb://admin:solarlogger123@localhost:20719/solarlogger?authSource=admin
```

Sau đó restart PM2:
```cmd
pm2 restart solarlogger-api
```

### Cách 2: Sửa docker-compose.yml và Restart Container

1. **Sửa docker-compose.yml:**
   ```yaml
   ports:
     - "20719:27017"  # Đổi từ 27019 sang 20719
   ```

2. **Restart container:**
   ```cmd
   docker-compose down
   docker-compose up -d mongodb
   ```

3. **Cập nhật .env:**
   ```env
   MONGODB_URI=mongodb://admin:solarlogger123@localhost:20719/solarlogger?authSource=admin
   ```

### Cách 3: Dừng Container Cũ và Start Lại Với Port Đúng

1. **Dừng container hiện tại:**
   ```cmd
   docker stop solarlogger-mongodb
   docker rm solarlogger-mongodb
   ```

2. **Start lại với port 27019:**
   ```cmd
   docker-compose up -d mongodb
   ```

3. **Kiểm tra port:**
   ```cmd
   docker ps | findstr solarlogger-mongodb
   ```

## Kiểm Tra Kết Nối

### Test MongoDB Connection

```cmd
docker exec solarlogger-mongodb mongosh -u admin -p solarlogger123 --eval "db.runCommand('ping')"
```

Kết quả mong đợi:
```json
{ ok: 1 }
```

### Test Từ Node.js

Sau khi cập nhật `.env`, restart PM2 và test:

```cmd
curl http://localhost:5023/health
```

Nếu MongoDB kết nối được, health endpoint sẽ trả về:
```json
{"status":"ok","timestamp":"..."}
```

## Tóm Tắt

**Tình trạng hiện tại:**
- ✅ Container name: `solarlogger-mongodb` (ĐÚNG)
- ✅ Container đang chạy và healthy
- ⚠️ Port thực tế: `20719` (khác với cấu hình `27019`)

**Hành động:**
1. Cập nhật `.env` với port `20719`
2. Restart PM2: `pm2 restart solarlogger-api`
3. Test: `curl http://localhost:5023/health`

---

**Lưu ý:** Nếu muốn dùng port 27019, cần dừng container hiện tại và start lại với port đúng.

