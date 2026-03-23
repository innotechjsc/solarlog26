# Quick Fix: PowerShell Execution Policy Error

## ⚡ Giải Pháp Nhanh

Khi gặp lỗi:
```
File cannot be loaded. The file is not digitally signed.
```

### ✅ Cách 1: Dùng file .bat wrapper (Dễ nhất)

Thay vì chạy `.ps1`, chạy file `.bat`:

```cmd
.\scripts\start-mongodb-wrapper.bat
.\scripts\init-database-wrapper.bat
```

### ✅ Cách 2: Chạy với Bypass

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-mongodb.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\init-database.ps1
```

### ✅ Cách 3: Thay đổi Execution Policy (Một lần)

Mở PowerShell **với quyền Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Sau đó chạy script bình thường:

```powershell
.\scripts\start-mongodb.ps1
```

---

**Khuyến nghị:** Dùng Cách 1 (file .bat wrapper) - Đơn giản nhất, không cần thay đổi cấu hình.

