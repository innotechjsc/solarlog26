# Hướng Dẫn Insert Dữ Liệu Test Trên Server

## Vấn Đề

Sau khi deploy lên server, database chưa có dữ liệu. Cần chạy scripts để tạo dữ liệu test.

## Giải Pháp

Chạy 2 scripts trên server để tạo dữ liệu test đầy đủ:

### Bước 1: Kiểm Tra MongoDB Đang Chạy

```powershell
# Kiểm tra container MongoDB
docker ps | findstr solarlogger-mongodb

# Hoặc
docker-compose ps
```

Nếu MongoDB chưa chạy, chạy:

```powershell
.\scripts\start-mongodb.ps1
```

### Bước 2: Insert Dữ Liệu Test

Script này sẽ tạo:
- 2 Projects
- 4 Areas
- 8 Devices
- 100 DataPoints

```powershell
cd D:\Solar\backend-system
node scripts\insert-test-data.js
```

Hoặc dùng batch:

```cmd
scripts\insert-test-data.bat
```

**Lưu ý**: Script này chỉ tạo DataPoint, chưa đủ để hiển thị trong báo cáo.

### Bước 3: Aggregate Dữ Liệu

Script này sẽ tạo DailySummary và HourlySummary từ DataPoint:

```powershell
node scripts\aggregate-existing-data.js
```

Hoặc dùng batch:

```cmd
scripts\aggregate-existing-data.bat
```

**Quan trọng**: Phải chạy script này sau khi insert test data để báo cáo có dữ liệu.

## Chạy Cả 2 Bước Cùng Lúc

### PowerShell:

```powershell
cd D:\Solar\backend-system
node scripts\insert-test-data.js
if ($LASTEXITCODE -eq 0) {
    node scripts\aggregate-existing-data.js
}
```

### Batch:

```cmd
cd D:\Solar\backend-system
call scripts\insert-test-data.bat
if %ERRORLEVEL% EQU 0 (
    call scripts\aggregate-existing-data.bat
)
```

## Kiểm Tra Kết Quả

### 1. Kiểm Tra Database

Truy cập Mongo Express (nếu có): http://localhost:8082

Hoặc dùng MongoDB shell:

```cmd
docker exec -it solarlogger-mongodb mongosh -u admin -p solarlogger123 --authenticationDatabase admin

use solarlogger;
db.projects.count();
db.areas.count();
db.devices.count({ device_id: /^SL-TEST-/ });
db.datapoints.count({ device_id: /^SL-TEST-/ });
db.dailysummaries.count({ device_id: /^SL-TEST-/ });
db.hourlysummaries.count({ device_id: /^SL-TEST-/ });
```

### 2. Kiểm Tra Báo Cáo

- Truy cập: http://your-domain/reports hoặc http://localhost:5023/reports
- Chọn project → Chọn khu vực → Chọn khoảng thời gian
- Metrics phải có giá trị > 0
- Charts phải có dữ liệu

### 3. Kiểm Tra Admin Panel

- Truy cập: http://your-domain/admin hoặc http://localhost:5023/admin
- Tab "Projects" phải có 2 projects
- Tab "Areas" phải có 4 areas
- Tab "Devices" phải có 8 devices

## Số Lượng Dữ Liệu Kỳ Vọng

Sau khi chạy đầy đủ 2 scripts:

- **Projects**: 2
- **Areas**: 4
- **Devices**: 8 (SL-TEST-0101, SL-TEST-0102, ...)
- **DataPoints**: ~100 (trong 7-30 ngày qua)
- **HourlySummaries**: ~59
- **DailySummaries**: ~36

## Troubleshooting

### Lỗi: MongoDB không kết nối được

**Nguyên nhân**: MongoDB chưa chạy hoặc connection string sai

**Giải pháp**:
1. Kiểm tra MongoDB đang chạy: `docker ps`
2. Kiểm tra file `.env` có `MONGODB_URI` đúng không
3. Chạy `start-mongodb.ps1`

### Lỗi: Cannot find module

**Nguyên nhân**: Chưa chạy `npm install`

**Giải pháp**:
```cmd
npm install --production
```

### Script chạy nhưng không có dữ liệu

**Nguyên nhân**: Script chạy nhưng lỗi im lặng

**Giải pháp**:
1. Kiểm tra console output của script
2. Kiểm tra MongoDB logs: `docker-compose logs mongodb`
3. Chạy lại script và xem kết quả

### Báo cáo vẫn hiển thị 0.00

**Nguyên nhân**: Chưa chạy script aggregate hoặc aggregate thất bại

**Giải pháp**:
1. Kiểm tra có DailySummary không: `db.dailysummaries.count()`
2. Nếu = 0, chạy lại `aggregate-existing-data.js`
3. Kiểm tra logs để xem có lỗi gì không

## Lưu Ý

1. **Luôn chạy cả 2 scripts** để có dữ liệu đầy đủ
2. **TTL Index**: DataPoint sẽ tự động xóa sau 7 ngày, nhưng DailySummary/HourlySummary giữ lại lâu hơn
3. **Chạy lại**: Nếu muốn cập nhật dữ liệu, có thể chạy lại scripts (sẽ xóa dữ liệu cũ trước)

## Files Scripts

Các scripts đã được copy vào folder deploy:
- `scripts/insert-test-data.js` - Insert test data
- `scripts/insert-test-data.bat` - Batch wrapper
- `scripts/insert-test-data.ps1` - PowerShell wrapper
- `scripts/aggregate-existing-data.js` - Aggregate data
- `scripts/aggregate-existing-data.bat` - Batch wrapper
- `scripts/aggregate-existing-data.ps1` - PowerShell wrapper

Tất cả đã có trong folder `iis-deploy/scripts/` sau khi chạy `prepare-deploy.ps1`.





