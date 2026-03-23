# Hướng Dẫn Insert Dữ Liệu Test

## Mục đích

Script này sẽ tạo dữ liệu test để hiển thị trong báo cáo:
- **2 Dự án (Projects)**
- **4 Khu vực (Areas)** - 2 khu vực cho mỗi dự án
- **8 Thiết bị (Devices)** - 2 thiết bị cho mỗi khu vực
- **100 Bản ghi DataPoint** - Phân bố trong 7-30 ngày qua

## Yêu cầu

1. MongoDB đang chạy (port 27019)
2. File `.env` đã được cấu hình với `MONGODB_URI`
3. Dependencies đã được cài đặt (`npm install`)

## Cách chạy

### Cách 1: Chạy trực tiếp (Node.js)

```cmd
cd backend-system
node scripts/insert-test-data.js
```

### Cách 2: Dùng batch file (Windows)

```cmd
cd backend-system
scripts\insert-test-data.bat
```

### Cách 3: Dùng PowerShell script

```powershell
cd backend-system
.\scripts\insert-test-data.ps1
```

## Dữ liệu được tạo

### Projects

1. **PRJ-001**: Nhà Máy Điện Mặt Trời Bình Dương
2. **PRJ-002**: Trang Trại Năng Lượng Đồng Nai

### Areas

**Project 1:**
- AREA-A1: Khu vực A - Phía Đông (500 kW)
- AREA-A2: Khu vực B - Phía Tây (500 kW)

**Project 2:**
- AREA-B1: Khu vực 1 - Mặt tiền (300 kW)
- AREA-B2: Khu vực 2 - Phía sau (300 kW)

### Devices

Mỗi khu vực có 2 thiết bị:
- SL-TEST-0101, SL-TEST-0102 (Khu vực A1)
- SL-TEST-0201, SL-TEST-0202 (Khu vực A2)
- SL-TEST-0301, SL-TEST-0302 (Khu vực B1)
- SL-TEST-0401, SL-TEST-0402 (Khu vực B2)

Mỗi thiết bị có 4-8 inverters (ngẫu nhiên).

### DataPoints

- **100 bản ghi** được tạo
- **70%** trong 7 ngày qua (70 records)
- **30%** trong 8-30 ngày qua (30 records)
- Dữ liệu mô phỏng chu kỳ ngày/đêm thực tế
- Công suất thay đổi theo giờ (cao nhất vào giữa trưa)

## Lưu ý

⚠️ **TTL Index**: DataPoint có TTL index tự động xóa dữ liệu sau 7 ngày. 
- Dữ liệu trong 7 ngày qua sẽ được giữ lại
- Dữ liệu cũ hơn 7 ngày có thể bị xóa tự động

## Sau khi insert

1. Kiểm tra dữ liệu trên Mongo Express: http://localhost:8082
2. Xem báo cáo: http://localhost:5023/reports
3. Xem admin panel: http://localhost:5023/admin

## Xóa dữ liệu test

Nếu muốn xóa dữ liệu test để chạy lại:

```javascript
// Trong MongoDB shell hoặc script
db.projects.deleteMany({ code: { $in: ['PRJ-001', 'PRJ-002'] } });
db.datapoints.deleteMany({ device_id: /^SL-TEST-/ });
```

Hoặc chạy lại script (script sẽ tự động xóa dữ liệu cũ trước khi insert mới).

## Troubleshooting

### Lỗi kết nối MongoDB

```
Error: connect ECONNREFUSED
```

**Giải pháp**: Đảm bảo MongoDB đang chạy:
```cmd
docker-compose up -d mongodb
```

### Lỗi duplicate key

```
E11000 duplicate key error
```

**Giải pháp**: Script tự động xóa dữ liệu cũ trước khi insert. Nếu vẫn lỗi, xóa thủ công hoặc kiểm tra MongoDB connection.

### Không thấy dữ liệu trong báo cáo

1. Kiểm tra timestamps - đảm bảo có dữ liệu trong khoảng thời gian bạn chọn
2. Kiểm tra device_id - đảm bảo devices có project_id và area_id
3. Kiểm tra console logs của server để xem có lỗi không





