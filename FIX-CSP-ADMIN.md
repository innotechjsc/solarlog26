# Sửa Lỗi CSP (Content Security Policy) Cho Admin Panel

## Vấn Đề

Admin panel không hoạt động do lỗi CSP:
- Inline event handlers (onclick) bị block
- Lỗi: "Executing inline event handler violates CSP directive"

## Đã Sửa

### 1. Cập Nhật CSP trong server.js

Thêm `scriptSrcAttr` và `unsafe-hashes`:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-hashes'",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrcAttr: [
        "'unsafe-inline'",
        "'unsafe-hashes'"
      ],
      connectSrc: [
        "'self'",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://cdn.jsdelivr.net"
      ]
    }
  }
}));
```

### 2. Thay Thế Inline Event Handlers

**Trước:**
```html
<button onclick="showSection('projects')">Dự Án</button>
```

**Sau:**
```html
<button id="nav-projects">Dự Án</button>
```

```javascript
document.getElementById('nav-projects').addEventListener('click', () => showSection('projects'));
```

### 3. Sử Dụng Event Delegation

Cho các button được tạo động:

```javascript
document.addEventListener('click', (e) => {
    if (e.target.matches('button[data-action="delete-project"]')) {
        deleteProject(e.target.dataset.id);
    }
});
```

**HTML:**
```html
<button data-action="delete-project" data-id="${project._id}">Xóa</button>
```

## Các Thay Đổi

### Buttons
- ✅ Nav buttons: Dùng addEventListener
- ✅ Create buttons: Dùng addEventListener
- ✅ Action buttons: Dùng data attributes + event delegation

### Forms
- ✅ Form submit: Dùng addEventListener thay vì onsubmit

### Modals
- ✅ Close buttons: Dùng data attributes

## Sau Khi Sửa

1. **Restart Server:**
   ```cmd
   pm2 restart solarlogger-api
   ```

2. **Clear Browser Cache:**
   - Ctrl + F5 (hard refresh)

3. **Test:**
   - Click các button phải hoạt động
   - Form submit phải hoạt động
   - Không còn lỗi CSP trong console

## Kiểm Tra

1. **Mở Browser Console (F12)**
2. **Xem có còn lỗi CSP không**
3. **Test các chức năng:**
   - Click "Tạo Dự Án" → Modal phải mở
   - Điền form → Submit → Phải tạo được dự án
   - Click các tab → Phải chuyển section

## Files Đã Sửa

- ✅ `server.js` - Cập nhật CSP
- ✅ `admin/index.html` - Thay thế inline handlers
- ✅ `iis-deploy/admin/index.html` - Đã copy

---

**Lưu ý:** Sau khi sửa, phải restart server để áp dụng thay đổi!

