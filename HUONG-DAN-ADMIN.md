# Hướng Dẫn Sử Dụng Admin Panel

## Truy Cập Admin Panel

**URL:** http://localhost:5023/admin (hoặc http://sol.adtrade.site/admin)

## Cấu Trúc Phân Cấp

```
Dự Án (Project)
  └── Khu Vực (Area)
      └── Thiết Bị (Device)
          └── Dữ Liệu (Data Points)
```

## Các Tính Năng

### 1. Quản Lý Dự Án

**Tạo Dự Án:**
1. Click tab "Dự Án"
2. Click nút "+ Tạo Dự Án"
3. Điền thông tin:
   - **Tên dự án**: Tên hiển thị
   - **Mã dự án**: Mã duy nhất (ví dụ: PROJ001)
   - **Mô tả**: Mô tả dự án
   - **Địa điểm**: Địa chỉ/vị trí
   - **Trạng thái**: active/inactive/archived

**Xem Thống Kê:**
- Số lượng khu vực
- Số lượng thiết bị
- Số thiết bị online
- Tổng năng lượng hôm nay

### 2. Quản Lý Khu Vực

**Tạo Khu Vực:**
1. Click tab "Khu Vực"
2. Chọn dự án từ dropdown
3. Click nút "+ Tạo Khu Vực"
4. Điền thông tin:
   - **Tên khu vực**: Tên hiển thị
   - **Mã khu vực**: Mã duy nhất trong dự án (ví dụ: AREA001)
   - **Mô tả**: Mô tả khu vực
   - **Địa điểm**: Địa chỉ/vị trí
   - **Công suất**: Tổng công suất (kW)

**Lưu ý:** Mã khu vực chỉ cần unique trong cùng một dự án.

### 3. Quản Lý Thiết Bị

**Tạo Thiết Bị:**
1. Click tab "Thiết Bị"
2. Chọn khu vực từ dropdown
3. Click nút "+ Tạo Thiết Bị"
4. Điền thông tin:
   - **Device ID**: Mã thiết bị (ví dụ: SL-2025-0001)
   - **Tên site**: Tên hiển thị
   - **Địa điểm**: Địa chỉ/vị trí
   - **Số lượng inverter**: Số inverter trong thiết bị

**Lưu ý:** 
- Device ID phải unique trong toàn hệ thống
- Device ID này sẽ được sử dụng trong POST /api/v1/data
- Khi thiết bị gửi data, hệ thống tự động gán project_id và area_id

### 4. Báo Cáo và Thống Kê

**Báo Cáo Theo Dự Án:**
- Tổng năng lượng trong khoảng thời gian
- Năng lượng trung bình/ngày
- Năng lượng tối đa/ngày
- Thống kê theo từng khu vực

**Báo Cáo Theo Khu Vực:**
- Tổng năng lượng trong khoảng thời gian
- Thống kê theo từng thiết bị
- Biểu đồ năng lượng theo ngày

## API Endpoints

### Projects

```bash
# Get all projects
GET /api/v1/admin/projects

# Create project
POST /api/v1/admin/projects
{
  "name": "Solar Farm 1",
  "code": "PROJ001",
  "description": "...",
  "location": "...",
  "status": "active"
}

# Get project details
GET /api/v1/admin/projects/:projectId

# Update project
PUT /api/v1/admin/projects/:projectId

# Delete project
DELETE /api/v1/admin/projects/:projectId
```

### Areas

```bash
# Get areas in project
GET /api/v1/admin/projects/:projectId/areas

# Create area
POST /api/v1/admin/projects/:projectId/areas
{
  "name": "Zone A",
  "code": "AREA001",
  "description": "...",
  "location": "...",
  "capacity": 1000
}

# Update area
PUT /api/v1/admin/areas/:areaId

# Delete area
DELETE /api/v1/admin/areas/:areaId
```

### Devices

```bash
# Get devices in area
GET /api/v1/admin/areas/:areaId/devices

# Create device
POST /api/v1/admin/areas/:areaId/devices
{
  "device_id": "SL-2025-0001",
  "site_name": "Site 1",
  "location": "...",
  "total_inverters": 6
}

# Update device
PUT /api/v1/admin/devices/:deviceId
```

### Reports

```bash
# Project report
GET /api/v1/admin/reports/project/:projectId?period=7days

# Area report
GET /api/v1/admin/reports/area/:areaId?period=7days
```

## Luồng Dữ Liệu

### 1. Setup

```
1. Tạo Dự Án
2. Tạo Khu Vực (trong Dự Án)
3. Tạo Thiết Bị (trong Khu Vực)
```

### 2. Nhận Dữ Liệu

```
Thiết bị POST /api/v1/data
  ↓
Hệ thống tìm Device theo device_id
  ↓
Tự động gán project_id và area_id từ Device
  ↓
Lưu DataPoint với device_id
```

### 3. Xem Báo Cáo

```
Dashboard/Admin Panel
  ↓
Query theo project_id hoặc area_id
  ↓
Aggregate từ DataPoints/DailySummaries
  ↓
Hiển thị báo cáo
```

## Best Practices

1. **Đặt tên rõ ràng:**
   - Project code: PROJ001, PROJ002, ...
   - Area code: AREA001, AREA002, ...
   - Device ID: SL-2025-0001, SL-2025-0002, ...

2. **Quản lý phân cấp:**
   - Một dự án có nhiều khu vực
   - Một khu vực có nhiều thiết bị
   - Không xóa dự án/khu vực nếu còn thiết bị

3. **Backup:**
   - Export dữ liệu định kỳ
   - Backup MongoDB thường xuyên

## Troubleshooting

### Không tạo được thiết bị

- Kiểm tra Device ID đã tồn tại chưa
- Kiểm tra đã chọn khu vực chưa

### Không thấy dữ liệu trong báo cáo

- Kiểm tra thiết bị đã gửi data chưa
- Kiểm tra device_id có đúng không
- Kiểm tra timestamp trong khoảng thời gian query

### Lỗi khi xóa dự án/khu vực

- Phải xóa tất cả thiết bị trước
- Phải xóa tất cả khu vực trước khi xóa dự án

---

**Lưu ý:** Admin panel đang trong giai đoạn phát triển, một số tính năng có thể chưa hoàn thiện.

