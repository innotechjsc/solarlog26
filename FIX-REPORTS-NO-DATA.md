# Sửa Lỗi Báo Cáo Không Có Dữ Liệu

## Vấn Đề

Trang báo cáo hiển thị 0.00 cho tất cả các metrics và không có biểu đồ, mặc dù đã insert DataPoint vào database.

## Nguyên Nhân

API reports query dữ liệu từ **DailySummary** và **HourlySummary**, không phải từ **DataPoint** trực tiếp.

Khi insert DataPoint trực tiếp vào database, **Aggregation Service** không tự động chạy để tạo các summary này. Aggregation service chỉ chạy khi:
1. DataPoint được save qua API `/api/v1/data`
2. Service kiểm tra xem có phải là data point cuối cùng của giờ/ngày không

## Giải Pháp

Chạy script aggregation để tạo DailySummary và HourlySummary từ DataPoint hiện có:

```cmd
cd backend-system
node scripts/aggregate-existing-data.js
```

Hoặc:

```cmd
scripts\aggregate-existing-data.bat
```

## Kết Quả

Script sẽ:
1. Đọc tất cả DataPoint từ database
2. Aggregate thành **HourlySummary** (theo giờ)
3. Aggregate từ HourlySummary thành **DailySummary** (theo ngày)

Sau khi chạy xong, báo cáo sẽ có dữ liệu.

## Workflow Đúng

### Khi Insert Dữ Liệu Mới:

**Cách 1: Qua API (Khuyến nghị)**
```
POST /api/v1/data
→ DataPoint được save
→ Aggregation Service tự động chạy
→ DailySummary & HourlySummary được tạo tự động
```

**Cách 2: Insert Trực Tiếp**
```
Insert DataPoint trực tiếp vào DB
→ Chạy script aggregate-existing-data.js
→ DailySummary & HourlySummary được tạo
```

## Scripts Đã Tạo

1. **insert-test-data.js** - Insert DataPoint, Projects, Areas, Devices
2. **aggregate-existing-data.js** - Aggregate DataPoint thành Summary

## Lưu Ý

⚠️ **TTL Index**: DataPoint có TTL index tự động xóa sau 7 ngày. Dữ liệu cũ hơn 7 ngày sẽ bị xóa.

✅ **DailySummary & HourlySummary**: Có TTL index 1 năm, nên dữ liệu được giữ lâu hơn.

## Kiểm Tra

Sau khi chạy script, kiểm tra:

1. **MongoDB Collections:**
   ```
   db.hourlysummaries.count({ device_id: /^SL-TEST-/ })
   db.dailysummaries.count({ device_id: /^SL-TEST-/ })
   ```

2. **API Response:**
   ```
   GET /api/v1/reports/project/{projectId}/detailed?period=7days
   ```
   Phải có `daily_data`, `hourly_pattern`, `statistics` với giá trị > 0

3. **Trang Báo Cáo:**
   - http://localhost:5023/reports
   - Metrics phải có giá trị > 0
   - Charts phải có dữ liệu





