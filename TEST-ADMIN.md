# Test Admin Panel

## Kiểm Tra Nhanh

### 1. Kiểm Tra Server

```cmd
# Xem PM2 status
pm2 list

# Xem logs
pm2 logs solarlogger-api --lines 20
```

### 2. Test URL

**Browser:**
- http://localhost:5023/admin

**API:**
```cmd
# Test health
curl http://localhost:5023/health

# Test admin API
curl http://localhost:5023/api/v1/admin/projects
```

### 3. Nếu Lỗi 404

**Restart server:**
```cmd
pm2 restart solarlogger-api
```

### 4. Nếu Trang Trắng

**Mở Browser Console (F12):**
- Xem có JavaScript error không
- Xem Network tab có API calls không

### 5. Kiểm Tra File

```cmd
# File có tồn tại không
dir D:\Solar\backend-system\admin\index.html
```

## Debug Steps

1. **Restart PM2:**
   ```cmd
   pm2 restart solarlogger-api
   ```

2. **Clear Browser Cache:**
   - Ctrl + F5 (hard refresh)

3. **Check Console:**
   - F12 → Console tab
   - Xem có error không

4. **Check Network:**
   - F12 → Network tab
   - Reload page
   - Xem request `/admin` có 200 OK không

5. **Test Direct File:**
   - Mở: `file:///D:/Solar/backend-system/admin/index.html`
   - Nếu mở được → Vấn đề ở server routing
   - Nếu không mở được → Vấn đề ở file HTML

## Common Issues

### Issue 1: 404 Not Found

**Solution:**
- Restart server
- Check route in server.js

### Issue 2: 500 Internal Server Error

**Solution:**
- Check PM2 logs
- Check MongoDB connection
- Check models are loaded correctly

### Issue 3: Blank Page

**Solution:**
- Check browser console
- Check API endpoints are working
- Check CORS settings

