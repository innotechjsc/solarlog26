# 📊 Mapping Payload → Database

Tài liệu này mô tả chi tiết cách từng trường trong payload được lưu vào các collection trong MongoDB.

## 🔄 Tổng quan

API `POST /api/v1/data` nhận payload và lưu vào các collection sau:
1. **`data_points`** - Dữ liệu chính (DataPoint model)
2. **`devices`** - Thông tin thiết bị (Device model)
3. **`alarms`** - Cảnh báo (Alarm model)
4. **`notifications`** - Thông báo (Notification model)
5. **`hourly_summaries`** - Tổng hợp theo giờ (HourlySummary model)
6. **`daily_summaries`** - Tổng hợp theo ngày (DailySummary model)

---

## 📋 Mapping chi tiết theo Schema

### Schema mới (v0.9.0+)

#### 1. Root Level Fields

| Payload Field | Collection | Field Path | Ghi chú |
|--------------|------------|------------|---------|
| `logger_id` hoặc `device_id` | `data_points` | `device_id` | Lưu trực tiếp |
| `logger_id` hoặc `device_id` | `devices` | `device_id` | Dùng để tìm/cập nhật device |
| `timestamp` | `data_points` | `timestamp` | Convert từ Unix timestamp (s) → Date |
| `timezone` | `data_points` | `timezone` | Mặc định: "Asia/Ho_Chi_Minh" |
| `fw_version` | `data_points` | `fw_version` | Firmware version |
| `fw_version` | `data_points` | `version` | Nếu không có `version` thì dùng `fw_version` |
| `schema_version` | `data_points` | `schema_version` | "0.9.0" nếu >= 0.9 |

---

#### 2. `data.system` → `data_points.system`

| Payload Field | Collection | Field Path | Type |
|--------------|------------|------------|------|
| `data.system.total_ac_active_power_w` | `data_points` | `system.total_ac_active_power_w` | Number (Watt) |
| `data.system.online_inverters` | `data_points` | `system.online_inverters` | Number |
| `data.system.total_inverters` | `data_points` | `system.total_inverters` | Number |
| `data.system.total_inverters` | `devices` | `total_inverters` | Cập nhật vào Device |

**Lưu ý**: `system` được lưu dạng `Mixed` type trong MongoDB, nên tất cả fields trong `data.system` đều được lưu nguyên vẹn.

---

#### 3. `data.inverters[]` → `data_points.inverters[]`

Mỗi inverter trong mảng được lưu nguyên vẹn vào `data_points.inverters[]` (dạng `Mixed` type).

##### 3.1. `inverters[].info` → `data_points.inverters[].info` + `devices.device_info`

| Payload Field | Collection | Field Path | Ghi chú |
|--------------|------------|------------|---------|
| `inverters[0].info.modbus_address` | `data_points` | `inverters[0].info.modbus_address` | Lưu trong DataPoint |
| `inverters[0].info.modbus_address` | `devices` | `device_info.modbus_address` | **Chỉ lấy từ inverter đầu tiên** |
| `inverters[0].info.serial_number` | `data_points` | `inverters[0].info.serial_number` | Lưu trong DataPoint |
| `inverters[0].info.serial_number` | `devices` | `device_info.serial_number` | **Chỉ lấy từ inverter đầu tiên** |
| `inverters[0].info.model_name` | `data_points` | `inverters[0].info.model_name` | Lưu trong DataPoint |
| `inverters[0].info.model_name` | `devices` | `device_info.model_name` | **Chỉ lấy từ inverter đầu tiên** |
| `inverters[0].info.inverter_type` | `data_points` | `inverters[0].info.inverter_type` | Lưu trong DataPoint |
| `inverters[0].info.inverter_type` | `devices` | `device_info.inverter_type` | **Chỉ lấy từ inverter đầu tiên** |
| `inverters[0].info.rated_power_w` | `data_points` | `inverters[0].info.rated_power_w` | Lưu trong DataPoint |
| `inverters[0].info.rated_power_w` | `devices` | `device_info.rated_power_w` | **Chỉ lấy từ inverter đầu tiên** |
| `inverters[0].info.hw_version` | `data_points` | `inverters[0].info.hw_version` | Lưu trong DataPoint |
| `inverters[0].info.hw_version` | `devices` | `device_info.hw_version` | **Chỉ lấy từ inverter đầu tiên** |
| `inverters[0].info.protocol` | `data_points` | `inverters[0].info.protocol` | Lưu trong DataPoint |
| `inverters[0].info.protocol` | `devices` | `device_info.protocol` | **Chỉ lấy từ inverter đầu tiên** |

**⚠️ Lưu ý quan trọng**: Chỉ lấy thông tin từ `inverters[0]` (inverter đầu tiên) để cập nhật vào `devices.device_info`.

##### 3.2. `inverters[].operating_state` → `data_points.inverters[].operating_state`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].operating_state.work_mode` | `data_points` | `inverters[i].operating_state.work_mode` |
| `inverters[i].operating_state.grid_mode` | `data_points` | `inverters[i].operating_state.grid_mode` |

##### 3.3. `inverters[].sign_convention` → `data_points.inverters[].sign_convention`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].sign_convention.grid_exchange_active_power` | `data_points` | `inverters[i].sign_convention.grid_exchange_active_power` |
| `inverters[i].sign_convention.battery_dc_active_power` | `data_points` | `inverters[i].sign_convention.battery_dc_active_power` |

##### 3.4. `inverters[].ac_measurements` → `data_points.inverters[].ac_measurements`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].ac_measurements.voltage_l1n_v` | `data_points` | `inverters[i].ac_measurements.voltage_l1n_v` |
| `inverters[i].ac_measurements.voltage_l2n_v` | `data_points` | `inverters[i].ac_measurements.voltage_l2n_v` |
| `inverters[i].ac_measurements.voltage_l3n_v` | `data_points` | `inverters[i].ac_measurements.voltage_l3n_v` |
| `inverters[i].ac_measurements.current_l1_a` | `data_points` | `inverters[i].ac_measurements.current_l1_a` |
| `inverters[i].ac_measurements.current_l2_a` | `data_points` | `inverters[i].ac_measurements.current_l2_a` |
| `inverters[i].ac_measurements.current_l3_a` | `data_points` | `inverters[i].ac_measurements.current_l3_a` |
| `inverters[i].ac_measurements.inverter_ac_bus_active_power_w` | `data_points` | `inverters[i].ac_measurements.inverter_ac_bus_active_power_w` |
| `inverters[i].ac_measurements.inverter_ac_reactive_power_var` | `data_points` | `inverters[i].ac_measurements.inverter_ac_reactive_power_var` |
| `inverters[i].ac_measurements.inverter_ac_apparent_power_va` | `data_points` | `inverters[i].ac_measurements.inverter_ac_apparent_power_va` |
| `inverters[i].ac_measurements.inverter_ac_bus_active_power_l1_w` | `data_points` | `inverters[i].ac_measurements.inverter_ac_bus_active_power_l1_w` |
| `inverters[i].ac_measurements.inverter_ac_bus_active_power_l2_w` | `data_points` | `inverters[i].ac_measurements.inverter_ac_bus_active_power_l2_w` |
| `inverters[i].ac_measurements.inverter_ac_bus_active_power_l3_w` | `data_points` | `inverters[i].ac_measurements.inverter_ac_bus_active_power_l3_w` |

##### 3.5. `inverters[].grid_interaction` → `data_points.inverters[].grid_interaction`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].grid_interaction.exchange_active_power_w` | `data_points` | `inverters[i].grid_interaction.exchange_active_power_w` |
| `inverters[i].grid_interaction.import_active_power_w` | `data_points` | `inverters[i].grid_interaction.import_active_power_w` |
| `inverters[i].grid_interaction.export_active_power_w` | `data_points` | `inverters[i].grid_interaction.export_active_power_w` |
| `inverters[i].grid_interaction.import_energy_today_kwh` | `data_points` | `inverters[i].grid_interaction.import_energy_today_kwh` |
| `inverters[i].grid_interaction.import_energy_total_kwh` | `data_points` | `inverters[i].grid_interaction.import_energy_total_kwh` |
| `inverters[i].grid_interaction.export_energy_today_kwh` | `data_points` | `inverters[i].grid_interaction.export_energy_today_kwh` |
| `inverters[i].grid_interaction.export_energy_total_kwh` | `data_points` | `inverters[i].grid_interaction.export_energy_total_kwh` |
| `inverters[i].grid_interaction.zero_export_enabled` | `data_points` | `inverters[i].grid_interaction.zero_export_enabled` |
| `inverters[i].grid_interaction.export_power_limit_w` | `data_points` | `inverters[i].grid_interaction.export_power_limit_w` |
| `inverters[i].grid_interaction.frequency_hz` | `data_points` | `inverters[i].grid_interaction.frequency_hz` |

##### 3.6. `inverters[].pv_input` → `data_points.inverters[].pv_input`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].pv_input.dc_bus_voltage_v` | `data_points` | `inverters[i].pv_input.dc_bus_voltage_v` |
| `inverters[i].pv_input.pv_inputs[]` | `data_points` | `inverters[i].pv_input.pv_inputs[]` | Mảng các MPPT |
| `inverters[i].pv_input.pv_inputs[j].mppt` | `data_points` | `inverters[i].pv_input.pv_inputs[j].mppt` |
| `inverters[i].pv_input.pv_inputs[j].voltage_v` | `data_points` | `inverters[i].pv_input.pv_inputs[j].voltage_v` |
| `inverters[i].pv_input.pv_inputs[j].current_a` | `data_points` | `inverters[i].pv_input.pv_inputs[j].current_a` |
| `inverters[i].pv_input.pv_inputs[j].dc_power_w` | `data_points` | `inverters[i].pv_input.pv_inputs[j].dc_power_w` |

##### 3.7. `inverters[].battery_storage` → `data_points.inverters[].battery_storage`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].battery_storage.mode` | `data_points` | `inverters[i].battery_storage.mode` |
| `inverters[i].battery_storage.active_power_w` | `data_points` | `inverters[i].battery_storage.active_power_w` |
| `inverters[i].battery_storage.voltage_v` | `data_points` | `inverters[i].battery_storage.voltage_v` |
| `inverters[i].battery_storage.current_a` | `data_points` | `inverters[i].battery_storage.current_a` |
| `inverters[i].battery_storage.soc_percent` | `data_points` | `inverters[i].battery_storage.soc_percent` |
| `inverters[i].battery_storage.soh_percent` | `data_points` | `inverters[i].battery_storage.soh_percent` |
| `inverters[i].battery_storage.energy_charge_today_kwh` | `data_points` | `inverters[i].battery_storage.energy_charge_today_kwh` |
| `inverters[i].battery_storage.energy_discharge_today_kwh` | `data_points` | `inverters[i].battery_storage.energy_discharge_today_kwh` |
| `inverters[i].battery_storage.charge_limit_w` | `data_points` | `inverters[i].battery_storage.charge_limit_w` |
| `inverters[i].battery_storage.discharge_limit_w` | `data_points` | `inverters[i].battery_storage.discharge_limit_w` |

##### 3.8. `inverters[].load` → `data_points.inverters[].load`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].load.active_power_w` | `data_points` | `inverters[i].load.active_power_w` |

##### 3.9. `inverters[].performance` → `data_points.inverters[].performance`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].performance.inverter_efficiency_percent` | `data_points` | `inverters[i].performance.inverter_efficiency_percent` |

##### 3.10. `inverters[].thermal_hardware` → `data_points.inverters[].thermal_hardware`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].thermal_hardware.inverter_temp_c` | `data_points` | `inverters[i].thermal_hardware.inverter_temp_c` |
| `inverters[i].thermal_hardware.heatsink_temp_c` | `data_points` | `inverters[i].thermal_hardware.heatsink_temp_c` |
| `inverters[i].thermal_hardware.transformer_temp_c` | `data_points` | `inverters[i].thermal_hardware.transformer_temp_c` |
| `inverters[i].thermal_hardware.ambient_temp_c` | `data_points` | `inverters[i].thermal_hardware.ambient_temp_c` |

##### 3.11. `inverters[].quality` → `data_points.inverters[].quality`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `inverters[i].quality.source` | `data_points` | `inverters[i].quality.source` |
| `inverters[i].quality.device_online` | `data_points` | `inverters[i].quality.device_online` |
| `inverters[i].quality.poll_interval_ms` | `data_points` | `inverters[i].quality.poll_interval_ms` |

---

#### 4. `inverters[].alarm.data[]` → `alarms` Collection

**Schema mới**: Alarms nằm trong `inverters[].alarm.data[]`

| Payload Field | Collection | Field Path | Mapping Logic |
|--------------|------------|------------|---------------|
| `inverters[i].alarm.data[j].code` | `alarms` | `alarm_code` | Lưu trực tiếp |
| `inverters[i].alarm.data[j].type` | `alarms` | `severity` | Map: "warning"→MINOR, "error"→CRITICAL, "critical"→CRITICAL |
| `inverters[i].alarm.data[j].text` | `alarms` | `description` | Lưu trực tiếp |
| `inverters[i].alarm.data[j].first_seen_ts` | `alarms` | `start_time` | Convert Unix timestamp → Date |
| `inverters[i].info.modbus_address` hoặc `i+1` | `alarms` | `inverter_id` | Lấy từ inverter info hoặc index |
| `device_id` (từ root) | `alarms` | `device_id` | Lấy từ root payload |
| `inverters[i].alarm.data[j].current_value` | `alarms` | `current_value` | Nếu có |
| `inverters[i].alarm.data[j].threshold` | `alarms` | `threshold` | Nếu có |

**Điều kiện**: Chỉ tạo alarm mới nếu chưa có alarm ACTIVE với cùng `device_id` và `alarm_code`.

---

#### 5. Device Status Update → `devices` Collection

| Payload Field | Collection | Field Path | Logic |
|--------------|------------|------------|-------|
| `logger_id` hoặc `device_id` | `devices` | `device_id` | Dùng để tìm device |
| - | `devices` | `status` | **Luôn set = "online"** khi nhận data |
| - | `devices` | `last_seen` | **Luôn set = Date.now()** khi nhận data |

---

### Schema cũ (< 0.9.0)

#### 1. Root Level Fields

| Payload Field | Collection | Field Path | Ghi chú |
|--------------|------------|------------|---------|
| `device_id` | `data_points` | `device_id` | Lưu trực tiếp |
| `device_id` | `devices` | `device_id` | Dùng để tìm/cập nhật device |
| `timestamp` | `data_points` | `timestamp` | Convert từ Unix timestamp (s) → Date |
| `timezone` | `data_points` | `timezone` | Mặc định: "Asia/Ho_Chi_Minh" |
| `version` | `data_points` | `version` | Lưu trực tiếp |

---

#### 2. `data.system` → `data_points.system`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `data.system.total_ac_power` | `data_points` | `system.total_ac_power` |
| `data.system.total_reactive_power` | `data_points` | `system.total_reactive_power` |
| `data.system.avg_power_factor` | `data_points` | `system.avg_power_factor` |
| `data.system.avg_frequency` | `data_points` | `system.avg_frequency` |
| `data.system.online_inverters` | `data_points` | `system.online_inverters` |
| `data.system.total_inverters` | `data_points` | `system.total_inverters` |
| `data.system.energy_5min` | `data_points` | `system.energy_5min` |
| `data.system.system_state` | `data_points` | `system.system_state` |

---

#### 3. `data.inverters[]` → `data_points.inverters[]`

| Payload Field | Collection | Field Path |
|--------------|------------|------------|
| `data.inverters[i].id` | `data_points` | `inverters[i].id` |
| `data.inverters[i].slave_address` | `data_points` | `inverters[i].slave_address` |
| `data.inverters[i].model` | `data_points` | `inverters[i].model` |
| `data.inverters[i].ac_power` | `data_points` | `inverters[i].ac_power` |
| `data.inverters[i].ac_voltage_l1` | `data_points` | `inverters[i].ac_voltage_l1` |
| `data.inverters[i].ac_current_l1` | `data_points` | `inverters[i].ac_current_l1` |
| `data.inverters[i].power_factor` | `data_points` | `inverters[i].power_factor` |
| `data.inverters[i].grid_frequency` | `data_points` | `inverters[i].grid_frequency` |
| `data.inverters[i].daily_yield` | `data_points` | `inverters[i].daily_yield` |
| `data.inverters[i].device_state` | `data_points` | `inverters[i].device_state` |
| `data.inverters[i].alarm_code` | `data_points` | `inverters[i].alarm_code` |
| `data.inverters[i].efficiency` | `data_points` | `inverters[i].efficiency` |
| `data.inverters[i].internal_temp` | `data_points` | `inverters[i].internal_temp` |

---

#### 4. `alarms[]` (root level) → `alarms` Collection

| Payload Field | Collection | Field Path | Mapping Logic |
|--------------|------------|------------|---------------|
| `alarms[i].alarm_code` | `alarms` | `alarm_code` | Lưu trực tiếp |
| `alarms[i].severity` | `alarms` | `severity` | Lưu trực tiếp (CRITICAL, MAJOR, MINOR, WARNING) |
| `alarms[i].description` | `alarms` | `description` | Lưu trực tiếp |
| `alarms[i].start_time` | `alarms` | `start_time` | Convert Unix timestamp → Date |
| `alarms[i].inverter_id` | `alarms` | `inverter_id` | Nếu có |
| `device_id` (từ root) | `alarms` | `device_id` | Lấy từ root payload |
| `alarms[i].current_value` | `alarms` | `current_value` | Nếu có |
| `alarms[i].threshold` | `alarms` | `threshold` | Nếu có |

---

## 🔄 Flow xử lý

### Bước 1: Validation & Detection
```javascript
// Detect schema version
const isNewSchema = schema_version && parseFloat(schema_version) >= 0.9;
const device_id = req.body.device_id || req.body.logger_id;
```

### Bước 2: Update Device Status
```javascript
// Luôn cập nhật device status = "online" và last_seen = now
const device = await Device.updateDeviceStatus(device_id, true);
```

### Bước 3: Update Device Info (chỉ schema mới)
```javascript
// Chỉ lấy từ inverters[0].info
if (isNewSchema && data.inverters && data.inverters.length > 0) {
  const firstInverter = data.inverters[0];
  if (firstInverter.info) {
    await Device.findOneAndUpdate(
      { device_id },
      { $set: { 'device_info': {...}, total_inverters: ... } }
    );
  }
}
```

### Bước 4: Save DataPoint
```javascript
const dataPointData = {
  device_id,
  timestamp: timestampDate,
  timezone: timezone || 'Asia/Ho_Chi_Minh',
  version: version || fw_version || '0.9.0',
  schema_version: schema_version || (isNewSchema ? '0.9.0' : undefined),
  fw_version: fw_version,
  system: data.system,        // Lưu nguyên vẹn (Mixed type)
  inverters: data.inverters || []  // Lưu nguyên vẹn (Mixed type)
};
await new DataPoint(dataPointData).save();
```

### Bước 5: Process Alarms
```javascript
// Schema mới: lấy từ inverters[].alarm.data[]
// Schema cũ: lấy từ alarms[] (root level)
// Chỉ tạo alarm mới nếu chưa có ACTIVE alarm với cùng alarm_code
```

### Bước 6: Send Notifications (nếu có alarm và device có area_id)
```javascript
// Tạo notification cho area managers
// Emit qua WebSocket real-time
```

### Bước 7: Trigger Aggregation (async)
```javascript
// Tự động tổng hợp vào hourly_summaries và daily_summaries
aggregationService.processAggregation(device_id, timestampDate);
```

---

## 📌 Lưu ý quan trọng

1. **Mixed Type**: `system` và `inverters` được lưu dạng `Mixed` type, nên **tất cả fields** trong payload đều được lưu nguyên vẹn, kể cả fields không có trong schema định nghĩa.

2. **Device Info**: Chỉ lấy từ `inverters[0]` (inverter đầu tiên) để cập nhật vào `devices.device_info`.

3. **Device Status**: Luôn được cập nhật = "online" và `last_seen = now` mỗi khi nhận data.

4. **Alarm Deduplication**: Chỉ tạo alarm mới nếu chưa có alarm ACTIVE với cùng `device_id` và `alarm_code`.

5. **TTL Index**: 
   - `data_points`: Tự động xóa sau 7 ngày
   - `alarms`: Tự động xóa sau 2 năm

6. **Aggregation**: Chạy async, không block response. Tự động tổng hợp vào `hourly_summaries` và `daily_summaries`.

---

## 🔍 Ví dụ Query

### Query DataPoint với schema mới
```javascript
const dataPoint = await DataPoint.findOne({ device_id: "SL-2025-0001" })
  .sort({ timestamp: -1 });

// Access data
console.log(dataPoint.system.total_ac_active_power_w);
console.log(dataPoint.inverters[0].info.serial_number);
console.log(dataPoint.inverters[0].ac_measurements.voltage_l1n_v);
console.log(dataPoint.inverters[0].battery_storage.soc_percent);
```

### Query Device Info
```javascript
const device = await Device.findOne({ device_id: "SL-2025-0001" });
console.log(device.device_info.serial_number);
console.log(device.device_info.model_name);
console.log(device.status);  // "online" hoặc "offline"
console.log(device.last_seen);
```

### Query Alarms
```javascript
const alarms = await Alarm.find({ 
  device_id: "SL-2025-0001",
  status: "ACTIVE"
}).sort({ start_time: -1 });
```
