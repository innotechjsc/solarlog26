# 📦 Deploy Fix: Admin Panel API_BASE Error

**Ngày tạo**: 2025-01-16  
**Lỗi**: `Identifier 'API_BASE' has already been declared`  
**Giải pháp**: Đổi thứ tự routes và rename file cũ

---

## 🔍 Vấn Đề

Admin panel tại `https://sol.adtrade.site/admin/` bị lỗi:
- ❌ `Uncaught SyntaxError: Identifier 'API_BASE' has already been declared`
- ❌ `Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')`
- ❌ Admin panel không load được

**Nguyên nhân**:
- Server đang serve file cũ `admin/index.html` (có script inline với API_BASE)
- File cũ cũng load `admin/admin/admin.js` (cũng có API_BASE)
- → Duplicate declaration

---

## ✅ Giải Pháp Đã Áp Dụng

### 1. Đổi thứ tự routes trong `server.js`

**Trước (SAI)**:
```javascript
app.use('/admin', express.static(...));  // Serve file cũ trước
app.get('/admin', ...);  // Không được match
```

**Sau (ĐÚNG)**:
```javascript
app.get('/admin', ...);  // Match trước, serve file mới
app.use('/admin', express.static(...));  // Serve static files
```

### 2. Rename file cũ

- `admin/index.html` → `admin/index.html.old` (backup)
- Để tránh nhầm lẫn và conflict

---

## 📋 Files Đã Sửa

1. ✅ `backend-system/server.js` - Đổi thứ tự routes
2. ✅ `backend-system/iis-deploy/server.js` - Đổi thứ tự routes
3. ✅ `backend-system/admin/index.html` → `index.html.old` (renamed)
4. ✅ `backend-system/iis-deploy/admin/index.html` → `index.html.old` (renamed)

---

## 🚀 Các Bước Deploy

### Bước 1: Copy Files Lên Server

```powershell
# Copy server.js
Copy-Item "d:\Solar\backend-system\iis-deploy\server.js" "[server-path]\server.js" -Force

# Rename file cũ trên server (nếu có)
Move-Item "[server-path]\admin\index.html" "[server-path]\admin\index.html.old" -Force
```

### Bước 2: Restart Server

```bash
# Nếu dùng PM2
pm2 restart all

# Hoặc restart IIS Application Pool
```

### Bước 3: Clear Browser Cache

1. Hard refresh: `Ctrl + Shift + R` hoặc `Ctrl + F5`
2. Hoặc mở Incognito/Private window

### Bước 4: Verify

1. Truy cập: `https://sol.adtrade.site/admin/`
2. Mở browser console (F12)
3. Kiểm tra:
   - ✅ Không còn lỗi `API_BASE has already been declared`
   - ✅ Không còn lỗi `Cannot read properties of null`
   - ✅ Admin panel load được
   - ✅ Có thể click vào các tabs (Dự Án, Khu Vực, Thiết Bị)

---

## ✅ Checklist Deploy

- [ ] Copy `server.js` từ `iis-deploy/` lên server
- [ ] Rename file cũ `admin/index.html` → `admin/index.html.old` trên server
- [ ] Restart server/PM2
- [ ] Clear browser cache
- [ ] Truy cập `/admin/`
- [ ] Verify không còn lỗi console
- [ ] Verify admin panel hoạt động

---

## 🆘 Troubleshooting

### Vấn đề 1: Vẫn còn lỗi sau khi deploy

**Nguyên nhân**: Browser cache hoặc server chưa restart

**Giải pháp**:
1. Hard refresh: `Ctrl + Shift + R`
2. Mở Incognito window
3. Kiểm tra server đã restart chưa
4. Kiểm tra file `server.js` trên server có thứ tự routes mới không

### Vấn đề 2: 404 Not Found khi truy cập /admin/

**Nguyên nhân**: File `admin/admin/index.html` không tồn tại

**Giải pháp**:
1. Kiểm tra file `admin/admin/index.html` có tồn tại không
2. Kiểm tra path trong `server.js`: `path.join(__dirname, 'admin', 'admin', 'index.html')`
3. Verify file structure trên server

### Vấn đề 3: Static files (CSS, JS) không load

**Nguyên nhân**: Route `app.use('/admin', ...)` không được match

**Giải pháp**:
- Route `app.use('/admin', ...)` vẫn cần để serve static files như `/admin/admin/admin.js`
- Route `app.get('/admin', ...)` chỉ match exact path `/admin`, không match `/admin/admin/admin.js`
- Nên cả 2 routes đều cần, chỉ cần đổi thứ tự

---

## 📊 So Sánh Trước và Sau

### Trước (SAI):
```
Request: GET /admin/
Express match: app.use('/admin', ...) → Serve admin/index.html (file cũ)
File cũ có: <script>const API_BASE = ...</script> + <script src="/admin/admin/admin.js">
Result: API_BASE declared 2 times → ERROR
```

### Sau (ĐÚNG):
```
Request: GET /admin/
Express match: app.get('/admin', ...) → Serve admin/admin/index.html (file mới)
File mới có: <script src="/admin/admin/admin.js"> (không có inline script)
Result: API_BASE declared 1 time → OK
```

---

## ✅ Kết Quả Mong Đợi

Sau khi deploy:
- ✅ Server serve file mới `admin/admin/index.html`
- ✅ Không có duplicate API_BASE declaration
- ✅ Admin panel load được
- ✅ Các tabs hoạt động bình thường
- ✅ Không còn lỗi console

---

**✅ Sau khi deploy, admin panel sẽ hoạt động bình thường!**
