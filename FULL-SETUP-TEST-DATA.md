# Hướng Dẫn Setup Đầy Đủ Dữ Liệu Test

## Tổng Quan

Để có dữ liệu hiển thị trong báo cáo, cần thực hiện **2 bước**:

1. **Insert DataPoint** (Projects, Areas, Devices, DataPoints)
2. **Aggregate Data** (Tạo DailySummary & HourlySummary từ DataPoint)

## Bước 1: Insert Dữ Liệu Test

Chạy script để tạo Projects, Areas, Devices và 100 DataPoints:

```cmd
cd backend-system
node scripts/insert-test-data.js
```

**Kết quả:**
- ✅ 2 Projects
- ✅ 4 Areas  
- ✅ 8 Devices
- ✅ 100 DataPoints

⚠️ **Lưu ý**: Lúc này báo cáo vẫn chưa có dữ liệu vì API reports query từ DailySummary, không phải DataPoint.

## Bước 2: Aggregate Dữ Liệu

Chạy script để tạo DailySummary & HourlySummary từ DataPoint:

```cmd
cd backend-system
node scripts/aggregate-existing-data.js
```

**Kết quả:**
- ✅ HourlySummary (59 records)
- ✅ DailySummary (36 records)

✅ **Bây giờ báo cáo sẽ có dữ liệu!**

## Chạy Cả 2 Bước Cùng Lúc

### Windows Batch:

```cmd
cd backend-system
node scripts/insert-test-data.js && node scripts/aggregate-existing-data.js
```

### PowerShell:

```powershell
cd backend-system
node scripts/insert-test-data.js; if ($LASTEXITCODE -eq 0) { node scripts/aggregate-existing-data.js }
```

### Hoặc Tạo Script Tổng Hợp

Tạo file `scripts/setup-full-test-data.bat`:

```bat
@echo off
echo Step 1: Inserting test data...
node scripts/insert-test-data.js
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo Step 2: Aggregating data...
node scripts/aggregate-existing-data.js
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo ✅ Setup complete! View reports at: http://localhost:5023/reports
pause
```

## Kiểm Tra Kết Quả

1. **Xem Báo Cáo:**
   - http://localhost:5023/reports
   - Chọn dự án → Chọn khu vực → Chọn khoảng thời gian
   - Metrics phải có giá trị > 0
   - Charts phải có dữ liệu

2. **Kiểm Tra Database:**
   - http://localhost:8082
   - Collections: `projects`, `areas`, `devices`, `datapoints`, `hourlysummaries`, `dailysummaries`

## Troubleshooting

### Báo cáo vẫn hiển thị 0.00

**Nguyên nhân**: Chưa chạy script aggregation

**Giải pháp**: Chạy `aggregate-existing-data.js`

### Không có DailySummary

**Kiểm tra:**
```javascript
// MongoDB shell
db.dailysummaries.find({ device_id: /^SL-TEST-/ }).count()
```

Nếu = 0, chạy lại script aggregation.

### Dữ Liệu Bị Xóa

**Nguyên nhân**: TTL index

- DataPoint: Tự động xóa sau 7 ngày
- HourlySummary: Tự động xóa sau 1 năm
- DailySummary: Tự động xóa sau 1 năm

**Giải pháp**: Chạy lại script insert để tạo dữ liệu mới.

## Lưu Ý Quan Trọng

1. **Luôn chạy cả 2 scripts** khi muốn có dữ liệu trong báo cáo
2. **DataPoint → HourlySummary → DailySummary**: Đây là flow aggregation
3. **API Reports query từ DailySummary**, không phải DataPoint
4. **TTL Index**: DataPoint sẽ bị xóa sau 7 ngày, nhưng DailySummary/HourlySummary giữ lại 1 năm





