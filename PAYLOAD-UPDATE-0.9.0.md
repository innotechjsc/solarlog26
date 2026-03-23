# Tóm tắt thay đổi Payload Schema 0.9.0

**Ngày cập nhật**: 2026-01-06  
**Schema Version**: 0.9.0  
**Tài liệu tham khảo**: `payload/payload/README.md`

## 1. Thay đổi ở Header/Payload Root

### Cũ:
- `device_id` - ID thiết bị
- `timestamp` - Unix timestamp
- `timezone` - Múi giờ
- `version` - Phiên bản firmware

### Mới:
- `logger_id` - ID của Solar Logger (tương đương device_id)
- `timestamp` - Unix timestamp (giữ nguyên)
- `timezone` - Múi giờ IANA (giữ nguyên)
- `fw_version` - Phiên bản firmware (mới)
- `schema_version` - Phiên bản schema payload (mới, ví dụ: "0.9.0")

**Action**: Backend cần map `logger_id` → `device_id` để tương thích với hệ thống hiện tại.

## 2. Thay đổi ở data.system

### Cũ:
```javascript
{
  total_ac_power: Number,
  total_reactive_power: Number,
  avg_power_factor: Number,
  avg_frequency: Number,
  online_inverters: Number,
  total_inverters: Number,
  energy_5min: Number,
  system_state: String
}
```

### Mới:
```javascript
{
  total_ac_active_power_w: Number,  // Tổng công suất AC (Watt)
  online_inverters: Number,          // Số inverter online
  total_inverters: Number            // Tổng số inverter
}
```

**Changes**:
- Đơn giản hóa, chỉ còn 3 fields
- Tên field có đơn vị `_w` (Watt)
- Bỏ: reactive_power, power_factor, frequency, energy_5min, system_state

## 3. Thay đổi lớn ở data.inverters[]

### Cũ (phẳng):
```javascript
{
  id: Number,
  slave_address: Number,
  model: String,
  ac_power: Number,
  ac_voltage_l1: Number,
  ac_current_l1: Number,
  power_factor: Number,
  grid_frequency: Number,
  daily_yield: Number,
  device_state: String,
  alarm_code: Number,
  efficiency: Number,
  internal_temp: Number
}
```

### Mới (nested structure):
```javascript
{
  info: {
    modbus_address: Number,      // (thay slave_address)
    serial_number: String,
    model_name: String,
    inverter_type: String,        // "hybrid_3_phase"
    rated_power_w: Number,
    hw_version: String,
    protocol: String              // "modbus_rtu"
  },
  operating_state: {
    work_mode: String,            // "normal" / "standby" / "fault"
    grid_mode: String             // "on_grid" / "off_grid"
  },
  sign_convention: {
    grid_exchange_active_power: String,  // "positive_import"
    battery_dc_active_power: String      // "positive_charge"
  },
  ac_measurements: {
    voltage_l1n_v: Number,
    voltage_l2n_v: Number,
    voltage_l3n_v: Number,
    current_l1_a: Number,
    current_l2_a: Number,
    current_l3_a: Number,
    inverter_ac_bus_active_power_w: Number,
    inverter_ac_reactive_power_var: Number,
    inverter_ac_apparent_power_va: Number,
    inverter_ac_bus_active_power_l1_w: Number,
    inverter_ac_bus_active_power_l2_w: Number,
    inverter_ac_bus_active_power_l3_w: Number
  },
  grid_interaction: {
    exchange_active_power_w: Number,
    import_active_power_w: Number,
    export_active_power_w: Number,
    import_energy_today_kwh: Number,
    import_energy_total_kwh: Number,
    export_energy_today_kwh: Number,
    export_energy_total_kwh: Number,
    zero_export_enabled: Boolean,
    export_power_limit_w: Number,
    frequency_hz: Number
  },
  pv_input: {
    dc_bus_voltage_v: Number,
    pv_inputs: [
      {
        mppt: Number,
        voltage_v: Number,
        current_a: Number,
        dc_power_w: Number
      }
    ]
  },
  battery_storage: {
    mode: String,                 // "charge" / "discharge" / "idle"
    active_power_w: Number,
    voltage_v: Number,
    current_a: Number,
    soc_percent: Number,
    soh_percent: Number,          // State of Health
    energy_charge_today_kwh: Number,
    energy_discharge_today_kwh: Number,
    charge_limit_w: Number,
    discharge_limit_w: Number
  },
  load: {
    active_power_w: Number
  },
  performance: {
    inverter_efficiency_percent: Number
  },
  alarm: {
    count: Number,
    data: [
      {
        type: String,             // "warning" / "error"
        code: String,             // Mã lỗi (có thể là string hoặc number)
        text: String,             // Mô tả
        first_seen_ts: Number,    // Unix timestamp
        last_seen_ts: Number      // Unix timestamp
      }
    ]
  },
  thermal_hardware: {
    inverter_temp_c: Number,
    heatsink_temp_c: Number,
    transformer_temp_c: Number | null,
    ambient_temp_c: Number
  },
  quality: {
    source: String,               // "modbus", "iec104", "cache"
    device_online: Boolean,
    poll_interval_ms: Number
  }
}
```

**Changes**:
- Cấu trúc nested thay vì phẳng
- Thêm nhiều sections mới: `sign_convention`, `pv_input`, `load`, `thermal_hardware`, `quality`
- Chi tiết hơn về AC measurements (3-phase)
- Alarm structure thay đổi: từ `alarm_code` (single) thành `alarm.data[]` (array)

## 4. Thay đổi ở Alarm Processing

### Cũ:
- Alarms gửi riêng trong field `alarms[]` ở root level
- Mỗi alarm có: `alarm_code`, `severity`, `description`, `inverter_id`, `start_time`

### Mới:
- Alarms nằm trong từng inverter: `inverters[].alarm.data[]`
- Cấu trúc alarm:
  - `type`: "warning" / "error" (thay cho severity)
  - `code`: String hoặc Number
  - `text`: Mô tả
  - `first_seen_ts`: Unix timestamp
  - `last_seen_ts`: Unix timestamp

**Action**: Cần cập nhật logic xử lý alarm để đọc từ `inverters[].alarm.data[]` thay vì `alarms[]`.

## 5. Battery Structure

### Cũ:
```javascript
battery: {
  soc: Number,
  charge_power: Number,
  discharge_power: Number,
  charge_energy_today: Number,
  discharge_energy_today: Number
}
```

### Mới:
Battery nằm trong từng inverter:
```javascript
inverters[].battery_storage: {
  mode: String,
  active_power_w: Number,
  voltage_v: Number,
  current_a: Number,
  soc_percent: Number,
  soh_percent: Number,
  energy_charge_today_kwh: Number,
  energy_discharge_today_kwh: Number,
  charge_limit_w: Number,
  discharge_limit_w: Number
}
```

**Changes**:
- Battery gắn với từng inverter (không phải system-level)
- Thêm nhiều fields: mode, voltage, current, soh, limits
- Tên field có đơn vị rõ ràng

## 6. Power Flow

### Cũ:
Có schema `power_flow` riêng:
```javascript
power_flow: {
  pv_to_grid: Number,
  pv_to_home: Number,
  pv_to_battery: Number,
  battery_to_home: Number,
  battery_to_grid: Number,
  grid_to_home: Number
}
```

### Mới:
Không có `power_flow` riêng. Có thể tính từ:
- `grid_interaction.import_active_power_w` / `export_active_power_w`
- `pv_input.pv_inputs[].dc_power_w`
- `battery_storage.active_power_w` (theo sign_convention)
- `load.active_power_w`

**Action**: Backend cần tính toán power flow từ các fields mới hoặc xóa field này.

## 7. Tóm tắt Action Items

1. ✅ **Cập nhật DataPoint Model**:
   - Thêm support cho cấu trúc nested mới
   - Giữ backward compatibility nếu cần

2. ✅ **Cập nhật data.js Route**:
   - Map `logger_id` → `device_id`
   - Xử lý `schema_version` để validate
   - Xử lý cấu trúc inverter mới
   - Xử lý alarm từ `inverters[].alarm.data[]`

3. ✅ **Cập nhật Alarm Processing**:
   - Đọc alarm từ inverter.alarm.data[]
   - Map `type` → `severity` (warning→MINOR, error→CRITICAL/MAJOR)
   - Map `code` (có thể là string)

4. ✅ **Cập nhật các routes khác**:
   - `devices.js`: Extract data từ cấu trúc mới
   - `analytics.js`: Tính toán từ fields mới
   - Dashboard: Hiển thị dữ liệu mới

5. ✅ **Validation**:
   - Kiểm tra `schema_version` để biết payload format
   - Support cả payload cũ (schema < 0.9.0) và mới (schema >= 0.9.0)

