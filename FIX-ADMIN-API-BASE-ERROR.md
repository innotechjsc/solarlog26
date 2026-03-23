# 🔧 Fix: Admin Panel API_BASE Duplicate Declaration Error

**Ngày fix**: 2025-01-16  
**Lỗi**: `Identifier 'API_BASE' has already been declared`  
**Nguyên nhân**: Server đang serve file cũ `admin/index.html` (có script inline) thay vì file mới `admin/admin/index.html`

---

## 🔍 Nguyên Nhân

### Vấn đề:
1. File cũ `admin/index.html` có **script inline** với `const API_BASE = ...` (dòng 449)
2. File cũ cũng load `admin/admin/admin.js` (có `const API_BASE = ...` ở dòng 2)
3. → **Duplicate declaration error**

### Tại sao file cũ được serve:
- Trong `server.js`, route `app.use('/admin', ...)` được định nghĩa **trước** `app.get('/admin', ...)`
- Express match `app.use('/admin', ...)` trước và serve file `admin/index.html` (file cũ)
- Route `app.get('/admin', ...)` không được match

---

## ✅ Giải Pháp

### Thay đổi thứ tự routes trong `server.js`:

**Trước (SAI)**:
```javascript
app.use('/admin', express.static(...));  // Serve file cũ
app.get('/admin', ...);  // Không được match
```

**Sau (ĐÚNG)**:
```javascript
app.get('/admin', ...);  // Match trước, serve file mới
app.use('/admin', express.static(...));  // Serve static files (js, css)
```

### Code đã sửa:

```javascript
// Redirect /admin to /admin/admin/index.html (new admin panel) - MUST be before static middleware
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin', 'index.html'));
});

// Serve static files from admin folder (but exclude /admin route which is handled above)
app.use('/admin', express.static(path.join(__dirname, 'admin')));
```

---

## 📋 Files Đã Sửa

1. ✅ `backend-system/server.js` - Đổi thứ tự routes
2. ✅ `backend-system/iis-deploy/server.js` - Đổi thứ tự routes

---

## 🚀 Deploy

### Files Cần Deploy:
- `iis-deploy/server.js` → `[server]/server.js`

### Sau Khi Deploy:
1. Restart server/PM2
2. Clear browser cache
3. Truy cập: `https://sol.adtrade.site/admin/`
4. Verify không còn lỗi `API_BASE has already been declared`

---

## ✅ Kết Quả

Sau khi fix:
- ✅ Server sẽ serve file mới `admin/admin/index.html`
- ✅ File mới chỉ load external script `/admin/admin/admin.js`
- ✅ Không có duplicate `API_BASE` declaration
- ✅ Admin panel hoạt động bình thường

---

**✅ Lỗi đã được fix!**
