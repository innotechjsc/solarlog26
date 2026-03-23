# Xử Lý Lỗi PowerShell Execution Policy

## ❌ Lỗi

```
.\scripts\start-mongodb.ps1 : File cannot be loaded. The file is not digitally signed. 
You cannot run this script on the current system.
```

## ✅ Giải Pháp

### Cách 1: Chạy với ExecutionPolicy Bypass (Khuyến nghị)

Thay vì chạy trực tiếp script, chạy với lệnh:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-mongodb.ps1
```

Hoặc:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\start-mongodb.ps1
```

### Cách 2: Thay đổi Execution Policy (Tạm thời)

Mở PowerShell với quyền Administrator và chạy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\scripts\start-mongodb.ps1
```

**Lưu ý:** Chỉ áp dụng cho session hiện tại.

### Cách 3: Thay đổi Execution Policy (Vĩnh viễn - Cần cẩn thận)

Mở PowerShell với quyền Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Sau đó chạy script bình thường:

```powershell
.\scripts\start-mongodb.ps1
```

### Cách 4: Sử dụng file .bat thay thế

Đã có sẵn file `start-mongodb.bat` - chạy file này thay vì .ps1:

```cmd
.\scripts\start-mongodb.bat
```

File .bat sẽ tự động chạy PowerShell script với ExecutionPolicy Bypass.

## 📝 Các Script Khác

Áp dụng tương tự cho các script khác:

```powershell
# Init database
powershell -ExecutionPolicy Bypass -File .\scripts\init-database.ps1

# Hoặc dùng file .bat
.\scripts\init-database.bat
```

## 🔒 Bảo Mật

- **RemoteSigned**: Cho phép chạy script local và script từ internet đã được ký số (Khuyến nghị)
- **Bypass**: Bỏ qua tất cả kiểm tra (Chỉ dùng tạm thời)
- **Restricted**: Không cho chạy script nào (Mặc định trên một số hệ thống)

## 💡 Giải Pháp Tốt Nhất Cho Server

Tạo file wrapper `.bat` để tự động bypass (đã có sẵn trong folder deploy):

```batch
@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-mongodb.ps1"
```

Chỉ cần chạy file `.bat` thay vì `.ps1`.

---

**Lưu ý:** Trên server production, nên cấu hình ExecutionPolicy một lần thay vì dùng Bypass mỗi lần.

