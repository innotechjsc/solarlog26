# 📊 Báo Cáo So Sánh Payload: Cũ vs Mới (v0.9.0)

**Ngày tạo**: 2025-01-16  
**Phiên bản mới**: 0.9.0  
**Phiên bản cũ**: < 0.9.0

---

## 🔍 Tổng Quan Thay Đổi

### Payload Cũ (test-data.json)
- **Định danh**: `device_id`
- **Cấu trúc**: Flat, đơn giản
- **Schema version**: Không có field `schema_version`
- **Alarms**: Ở root level

### Payload Mới (payload1601/payload/basic_payload.json)
- **Định danh**: `logger_id` (thay vì `device_id`)
- **Cấu trúc**: Nested, chi tiết hơn
- **Schema version**: Có field `schema_version: "0.9.0"`
- **Alarms**: Nested trong `inverters[].alarm.data[]`

---

## 📋 So Sánh Chi Tiết

### 1. Header - Thông Tin Chung

| Trường | Payload Cũ | Payload Mới | Thay Đổi |
|--------|------------|-------------|----------|
| Định danh | `device_id` | `logger_id` | ⚠️ **THAY ĐỔI TÊN** |
| Timestamp | `timestamp` | `timestamp` | ✅ Giữ nguyên |
| Timezone | `timezone` | `timezone` | ✅ Giữ nguyên |
| Version | `version` | `fw_version` | ⚠️ **THAY ĐỔI TÊN** |
| Schema Version | ❌ Không có | `schema_version: "0.9.0"` | ✨ **MỚI** |

**⚠️ Lưu ý**: Backend hiện tại đã hỗ trợ cả 2:
```javascript
const device_id = req.body.device_id || req.body.logger_id;
const version = version || fw_version || '0.9.0';
```

---

### 2. System Data

#### Payload Cũ:
```json
"system": {
  "total_ac_power": 450.5,           // kW
  "total_reactive_power": 120.3,     // kVAR
  "avg_power_factor": 0.97,
  "avg_frequency": 50.02,
  "online_inverters": 8,
  "total_inverters": 8,
  "energy_5min": 37.54,              // kWh
  "system_state": "all_online"
}
```

#### Payload Mới:
```json
"system": {
  "total_ac_active_power_w": 450500,  // W (đơn vị rõ ràng)
  "online_inverters": 1,
  "total_inverters": 1
}
```

**Thay Đổi**:
- ❌ Bỏ: `total_reactive_power`, `avg_power_factor`, `avg_frequency`, `energy_5min`, `system_state`
- ✨ Mới: `total_ac_active_power_w` (đơn vị Watt, rõ ràng hơn)
- ⚠️ Đơn vị: kW → W (cần convert: 450.5 kW = 450500 W)

---

### 3. Inverter Data Structure

#### Payload Cũ (Flat Structure):
```json
"inverters": [
  {
    "id": 1,
    "slave_address": 1,
    "model": "SUN2000-10KTL",
    "ac_power": 56.2,
    "ac_voltage_l1": 230.5,
    "ac_current_l1": 81.7,
    "power_factor": 0.98,
    "grid_frequency": 50.02,
    "daily_yield": 45.3,
    "device_state": "running",
    "alarm_code": 0,
    "efficiency": 97.8,
    "internal_temp": 42.5
  }
]
```

#### Payload Mới (Nested Structure):
```json
"inverters": [
  {
    "info": { ... },                    // ✨ MỚI
    "operating_state": { ... },         // ✨ MỚI
    "sign_convention": { ... },         // ✨ MỚI
    "ac_measurements": { ... },         // ✨ MỚI
    "grid_interaction": { ... },        // ✨ MỚI
    "pv_input": { ... },                // ✨ MỚI
    "battery_storage": { ... },         // ✨ MỚI
    "load": { ... },                    // ✨ MỚI
    "performance": { ... },             // ✨ MỚI
    "alarm": { ... },                   // ⚠️ THAY ĐỔI
    "thermal_hardware": { ... },        // ✨ MỚI
    "quality": { ... }                  // ✨ MỚI
  }
]
```

---

### 4. Inverter Info (Mới)

**Payload Cũ**: Không có section riêng  
**Payload Mới**:
```json
"info": {
  "modbus_address": 1,              // Thay "slave_address"
  "serial_number": "SN1234567890",  // ✨ MỚI
  "model_name": "GW10K-ET",         // Thay "model"
  "inverter_type": "hybrid_3_phase", // ✨ MỚI
  "rated_power_w": 10000,           // ✨ MỚI
  "hw_version": "H1.2",             // ✨ MỚI
  "protocol": "modbus_rtu"          // ✨ MỚI
}
```

**Mapping**:
- `slave_address` → `info.modbus_address`
- `model` → `info.model_name`

---

### 5. Operating State (Mới)

**Payload Cũ**: `device_state: "running"`  
**Payload Mới**:
```json
"operating_state": {
  "work_mode": "normal",    // normal/standby/fault
  "grid_mode": "on_grid"   // on_grid/off_grid
}
```

**Mapping**: `device_state` → `operating_state.work_mode`

---

### 6. Sign Convention (Mới)

**Payload Cũ**: Không có, phải suy diễn dấu  
**Payload Mới**:
```json
"sign_convention": {
  "grid_exchange_active_power": "positive_import",  // Dương = nhập lưới
  "battery_dc_active_power": "positive_charge"      // Dương = sạc pin
}
```

**⚠️ Quan trọng**: Backend không được suy diễn dấu nếu không đọc phần này!

---

### 7. AC Measurements (Mới)

**Payload Cũ**:
```json
{
  "ac_power": 56.2,           // kW
  "ac_voltage_l1": 230.5,     // V
  "ac_current_l1": 81.7,      // A
  "power_factor": 0.98
}
```

**Payload Mới**:
```json
"ac_measurements": {
  "voltage_l1n_v": 230.5,                          // ✨ 3 pha
  "voltage_l2n_v": 231.1,
  "voltage_l3n_v": 229.9,
  "current_l1_a": 4.12,                            // ✨ 3 pha
  "current_l2_a": 4.05,
  "current_l3_a": 4.2,
  "inverter_ac_bus_active_power_w": 2850,          // W (rõ ràng)
  "inverter_ac_reactive_power_var": 120,           // ✨ MỚI
  "inverter_ac_apparent_power_va": 2900,           // ✨ MỚI
  "inverter_ac_bus_active_power_l1_w": 930,        // ✨ Theo pha
  "inverter_ac_bus_active_power_l2_w": 920,
  "inverter_ac_bus_active_power_l3_w": 1000
}
```

**Thay Đổi**:
- ✨ Hỗ trợ 3 pha (L1, L2, L3)
- ✨ Đơn vị rõ ràng trong tên field (`_v`, `_a`, `_w`, `_var`, `_va`)
- ⚠️ Đơn vị: kW → W

---

### 8. Grid Interaction (Mới)

**Payload Cũ**: Không có section riêng  
**Payload Mới**:
```json
"grid_interaction": {
  "exchange_active_power_w": 500,        // Công suất trao đổi
  "import_active_power_w": 500,          // Nhập từ lưới
  "export_active_power_w": 0,            // Phát lên lưới
  "import_energy_today_kwh": 1.2,        // ✨ MỚI
  "import_energy_total_kwh": 356.4,     // ✨ MỚI
  "export_energy_today_kwh": 0.0,        // ✨ MỚI
  "export_energy_total_kwh": 1205.8,    // ✨ MỚI
  "zero_export_enabled": false,          // ✨ MỚI
  "export_power_limit_w": 0,            // ✨ MỚI
  "frequency_hz": 49.98                 // Thay "grid_frequency"
}
```

**Mapping**: `grid_frequency` → `grid_interaction.frequency_hz`

---

### 9. PV Input (Mới)

**Payload Cũ**: Không có  
**Payload Mới**:
```json
"pv_input": {
  "dc_bus_voltage_v": 380.5,
  "pv_inputs": [
    {
      "mppt": 1,
      "voltage_v": 360.2,
      "current_a": 4.5,
      "dc_power_w": 1621
    }
    // ... nhiều MPPT
  ]
}
```

**✨ Hoàn toàn mới**: Hỗ trợ nhiều MPPT channels

---

### 10. Battery Storage (Mới)

**Payload Cũ**: Không có (hoặc ở root level)  
**Payload Mới**:
```json
"battery_storage": {
  "mode": "charge",                      // charge/discharge/idle
  "active_power_w": 640,
  "voltage_v": 51.8,
  "current_a": 12.4,
  "soc_percent": 78,                     // State of Charge
  "soh_percent": 96,                     // ✨ State of Health
  "energy_charge_today_kwh": 1.5,       // ✨ MỚI
  "energy_discharge_today_kwh": 0.6,    // ✨ MỚI
  "charge_limit_w": 3000,               // ✨ MỚI
  "discharge_limit_w": 3000             // ✨ MỚI
}
```

**✨ Hoàn toàn mới**: Chi tiết về pin lưu trữ

---

### 11. Load (Mới)

**Payload Cũ**: Không có  
**Payload Mới**:
```json
"load": {
  "active_power_w": 2350
}
```

**✨ Hoàn toàn mới**: Công suất tải tiêu thụ

---

### 12. Performance (Mới)

**Payload Cũ**: `efficiency: 97.8` (ở root)  
**Payload Mới**:
```json
"performance": {
  "inverter_efficiency_percent": 97.8
}
```

**Mapping**: `efficiency` → `performance.inverter_efficiency_percent`

---

### 13. Alarm Structure (Thay Đổi Lớn)

#### Payload Cũ:
```json
"alarms": [                              // Ở root level
  {
    "alarm_code": 1001,
    "severity": "MINOR",
    "description": "...",
    "start_time": 1703761500,
    "status": "ACTIVE"
  }
]
```

#### Payload Mới:
```json
"inverters[].alarm": {                   // Nested trong inverter
  "count": 2,
  "data": [
    {
      "type": "warning",                 // warning/error
      "code": 102,                       // Có thể là string hoặc number
      "text": "Grid phase wrong",
      "first_seen_ts": 1703761600,
      "last_seen_ts": 1703761800
    }
  ]
}
```

**Thay Đổi**:
- ⚠️ Vị trí: Root level → Nested trong `inverters[].alarm.data[]`
- ⚠️ Tên field: `alarm_code` → `code`, `description` → `text`
- ⚠️ Tên field: `severity` → `type` (warning/error)
- ⚠️ Tên field: `start_time` → `first_seen_ts`
- ✨ Mới: `count`, `last_seen_ts`

**⚠️ Backend hiện tại đã hỗ trợ cả 2 schema**:
```javascript
if (isNewSchema) {
  // New schema: alarms in inverters[].alarm.data[]
} else {
  // Old schema: alarms in root level alarms[] array
}
```

---

### 14. Thermal Hardware (Mới)

**Payload Cũ**: `internal_temp: 42.5` (ở root)  
**Payload Mới**:
```json
"thermal_hardware": {
  "inverter_temp_c": 42.3,              // Thay "internal_temp"
  "heatsink_temp_c": 48.7,               // ✨ MỚI
  "transformer_temp_c": null,            // ✨ MỚI (có thể null)
  "ambient_temp_c": 33.1                 // ✨ MỚI
}
```

**Mapping**: `internal_temp` → `thermal_hardware.inverter_temp_c`

---

### 15. Quality (Mới)

**Payload Cũ**: Không có  
**Payload Mới**:
```json
"quality": {
  "source": "modbus",                    // modbus/iec104/cache
  "device_online": true,
  "poll_interval_ms": 1000
}
```

**✨ Hoàn toàn mới**: Metadata về chất lượng dữ liệu

---

## 📊 Tóm Tắt Thay Đổi

### ✅ Được Giữ Nguyên
- `timestamp`
- `timezone`

### ⚠️ Thay Đổi Tên Field
- `device_id` → `logger_id` (backend hỗ trợ cả 2)
- `version` → `fw_version` (backend hỗ trợ cả 2)
- `slave_address` → `info.modbus_address`
- `model` → `info.model_name`
- `device_state` → `operating_state.work_mode`
- `grid_frequency` → `grid_interaction.frequency_hz`
- `internal_temp` → `thermal_hardware.inverter_temp_c`
- `efficiency` → `performance.inverter_efficiency_percent`

### ✨ Hoàn Toàn Mới
- `schema_version`
- `info` section (serial_number, inverter_type, rated_power_w, hw_version, protocol)
- `operating_state` section
- `sign_convention` section
- `ac_measurements` section (3 pha, đơn vị rõ ràng)
- `grid_interaction` section (chi tiết trao đổi với lưới)
- `pv_input` section (nhiều MPPT)
- `battery_storage` section (chi tiết pin)
- `load` section
- `performance` section
- `thermal_hardware` section (nhiều nhiệt độ)
- `quality` section

### ❌ Bị Loại Bỏ
- `total_reactive_power` (có thể tính từ `ac_measurements`)
- `avg_power_factor` (có thể tính từ `ac_measurements`)
- `avg_frequency` (dùng `grid_interaction.frequency_hz`)
- `energy_5min` (có thể tính từ timestamp)
- `system_state` (có thể suy từ `operating_state`)
- `daily_yield` (có thể tính từ `grid_interaction.export_energy_today_kwh`)

### 🔄 Thay Đổi Cấu Trúc
- Inverter data: Flat → Nested (nhiều sections)
- Alarms: Root level → Nested trong `inverters[].alarm.data[]`
- System: Nhiều fields → Chỉ còn 3 fields cơ bản

---

## 🎯 Khuyến Nghị

### 1. Backend Compatibility ✅
Backend hiện tại đã hỗ trợ cả 2 schema:
- Tự động detect qua `schema_version`
- Hỗ trợ cả `device_id` và `logger_id`
- Xử lý alarms ở cả 2 vị trí

### 2. Migration Path
- ✅ Backend đã sẵn sàng nhận payload mới
- ⚠️ Cần test với payload mới từ thiết bị thật
- ⚠️ Dashboard có thể cần update để hiển thị fields mới

### 3. Validation
- ✅ Backend validate `schema_version >= 0.9` để detect schema mới
- ✅ Hỗ trợ backward compatibility với schema cũ

---

## 📝 Kết Luận

Payload mới (v0.9.0) có cấu trúc **chi tiết và rõ ràng hơn**:
- ✅ Đơn vị đo được gắn trong tên field
- ✅ Cấu trúc nested, dễ mở rộng
- ✅ Hỗ trợ nhiều tính năng mới (battery, PV MPPT, 3 pha)
- ✅ Metadata rõ ràng (sign_convention, quality)

Backend đã sẵn sàng xử lý payload mới! ✅
