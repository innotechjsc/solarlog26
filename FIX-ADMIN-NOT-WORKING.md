# Sửa Lỗi Admin Panel Không Hoạt Động

## Vấn Đề

Truy cập http://localhost:5023/admin không hoạt động.

## Đã Sửa

1. ✅ Thêm route redirect `/admin` → `/admin/index.html`
2. ✅ File `admin/index.html` đã tồn tại
3. ✅ Route admin đã được thêm vào server.js

## Kiểm Tra

### 1. Kiểm Tra Server Có Đang Chạy

```cmd
# Kiểm tra PM2
pm2 list

# Hoặc kiểm tra port
netstat -ano | findstr :5023
```

### 2. Kiểm Tra File Admin

```cmd
# Kiểm tra file có tồn tại
dir D:\Solar\backend-system\admin\index.html

# Hoặc
Test-Path "D:\Solar\backend-system\admin\index.html"
```

### 3. Restart Server

**Nếu dùng PM2:**
```cmd
pm2 restart solarlogger-api
```

**Nếu chạy trực tiếp:**
- Dừng server (Ctrl+C)
- Start lại: `node server.js`

### 4. Kiểm Tra Logs

```cmd
# PM2 logs
pm2 logs solarlogger-api

# Hoặc xem console output
```

### 5. Test API Endpoints

```cmd
# Test health
curl http://localhost:5023/health

# Test admin API
curl http://localhost:5023/api/v1/admin/projects
```

## Các Lỗi Thường Gặp

### Lỗi 404 - Not Found

**Nguyên nhân:**
- Server chưa restart sau khi thêm route
- File admin/index.html không tồn tại
- Route chưa được cấu hình đúng

**Giải pháp:**
1. Restart server
2. Kiểm tra file tồn tại
3. Kiểm tra server.js có route `/admin`

### Lỗi 500 - Internal Server Error

**Nguyên nhân:**
- Lỗi trong routes/admin.js
- Models chưa được import đúng
- MongoDB chưa kết nối

**Giải pháp:**
1. Xem logs để biết lỗi cụ thể
2. Kiểm tra MongoDB đang chạy
3. Kiểm tra models có đúng không

### Trang Trắng

**Nguyên nhân:**
- JavaScript error trong admin/index.html
- API không trả về dữ liệu
- CORS error

**Giải pháp:**
1. Mở Browser Console (F12)
2. Xem có error nào không
3. Kiểm tra Network tab xem API calls

## Code Đã Sửa

### server.js

```javascript
// Serve static files
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Redirect /admin to /admin/index.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
```

## Kiểm Tra Nhanh

1. **Mở browser:** http://localhost:5023/admin
2. **Mở Console (F12):** Xem có error không
3. **Kiểm tra Network tab:** Xem API calls có thành công không

## Nếu Vẫn Không Hoạt Động

1. **Kiểm tra server logs:**
   ```cmd
   pm2 logs solarlogger-api --lines 50
   ```

2. **Test trực tiếp file:**
   ```cmd
   # Mở file trực tiếp trong browser
   file:///D:/Solar/backend-system/admin/index.html
   ```

3. **Kiểm tra route:**
   ```javascript
   // Trong server.js, thêm log
   app.get('/admin', (req, res) => {
     console.log('Admin route accessed');
     res.sendFile(path.join(__dirname, 'admin', 'index.html'));
   });
   ```

4. **Kiểm tra static files:**
   ```javascript
   // Test static file serving
   app.get('/admin/test', (req, res) => {
     res.send('Admin route works!');
   });
   ```

---

**Sau khi sửa, nhớ restart server!**

