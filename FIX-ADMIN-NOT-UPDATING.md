# 🔧 Khắc phục: Giao diện admin chưa thay đổi sau khi reload PM2

## 🔍 Nguyên nhân có thể:

1. **Browser cache** - Browser đang cache file cũ
2. **File chưa được copy đúng vị trí** trên server
3. **Đường dẫn file không đúng**

## ✅ Giải pháp:

### Bước 1: Xóa Browser Cache

**Cách 1: Hard Refresh**
- **Chrome/Edge**: `Ctrl + Shift + R` hoặc `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` hoặc `Ctrl + F5`
- **Safari**: `Cmd + Shift + R`

**Cách 2: Xóa cache thủ công**
1. Mở DevTools (F12)
2. Right-click vào nút Reload
3. Chọn "Empty Cache and Hard Reload"

**Cách 3: Mở Incognito/Private Window**
- Mở tab ẩn danh và test lại

### Bước 2: Kiểm tra file trên server

Kiểm tra xem file đã được copy đúng chưa:

```powershell
# Kiểm tra file admin.js có tồn tại không
ls [đường-dẫn-server]/admin/admin.js

# Kiểm tra nội dung file (xem có function loadDevices mới không)
cat [đường-dẫn-server]/admin/admin.js | Select-String "loadDevices"
```

**Cấu trúc thư mục đúng:**
```
[server-root]/
  ├── admin/
  │   ├── index.html  ← File này
  │   └── admin.js    ← File này
  └── routes/
      └── data.js     ← File này
```

### Bước 3: Kiểm tra đường dẫn trong HTML

Mở file `admin/index.html` trên server, kiểm tra dòng cuối:
```html
<script src="/admin/admin.js"></script>
```

Nếu cấu trúc thư mục là `admin/admin/admin.js`, cần sửa thành:
```html
<script src="/admin/admin/admin.js"></script>
```

### Bước 4: Kiểm tra PM2 đang chạy từ thư mục nào

```bash
# Xem PM2 process info
pm2 list
pm2 info [app-name]

# Kiểm tra working directory
pm2 show [app-name] | grep "exec cwd"
```

**Đảm bảo PM2 đang chạy từ thư mục có file admin/**

### Bước 5: Restart đúng cách

```bash
# Stop PM2
pm2 stop all

# Xóa cache PM2 (nếu có)
pm2 flush

# Start lại
pm2 start server.js --name solarlogger

# Hoặc restart
pm2 restart all

# Xem logs để kiểm tra
pm2 logs
```

### Bước 6: Kiểm tra file có được serve đúng không

Test trực tiếp URL:
```
https://sol.adtrade.site/admin/admin.js
```

Mở trong browser, xem có load được file không và kiểm tra:
- File có chứa function `loadDevices()` mới không?
- File có chứa `selectedDevices` không?
- File có chứa `toggleDeviceSelection` không?

### Bước 7: Kiểm tra timestamp file

```powershell
# Xem thời gian modify file
Get-Item [đường-dẫn-server]/admin/admin.js | Select-Object LastWriteTime

# So sánh với file local
Get-Item backend-system/admin/admin.js | Select-Object LastWriteTime
```

## 🚨 Nếu vẫn không được:

### Option 1: Thêm version parameter để bypass cache

Sửa trong `admin/index.html`:
```html
<script src="/admin/admin.js?v=2.0"></script>
```

### Option 2: Kiểm tra server.js có serve đúng không

Trong `server.js`, đảm bảo có:
```javascript
app.use('/admin', express.static(path.join(__dirname, 'admin')));
```

### Option 3: Kiểm tra reverse proxy (nếu có)

Nếu dùng reverse proxy (nginx, IIS), có thể cần:
- Clear cache của reverse proxy
- Restart reverse proxy service

## 📋 Checklist nhanh:

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test trong Incognito window
- [ ] Kiểm tra file admin.js trên server có nội dung mới
- [ ] Kiểm tra PM2 working directory
- [ ] Restart PM2 đúng cách
- [ ] Test URL trực tiếp: `/admin/admin.js`
- [ ] Kiểm tra console browser có lỗi không (F12)

## 🔍 Debug trong Browser:

1. Mở DevTools (F12)
2. Vào tab **Network**
3. Reload page
4. Tìm request `admin.js`
5. Click vào, xem:
   - **Status**: Phải là 200
   - **Response**: Xem nội dung file có mới không
   - **Headers**: Xem `Last-Modified` date

Nếu thấy file cũ, có nghĩa là:
- File chưa được copy lên server
- Hoặc đang load từ cache
