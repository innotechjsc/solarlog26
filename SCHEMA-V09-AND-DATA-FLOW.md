# Schema v0.9.0 và luồng ghi khi gọi POST /api/v1/data

Tài liệu tổng hợp **payload schema mới nhất (v0.9.0)** và **cách ghi/lưu dữ liệu** khi gọi API `POST /api/v1/data`.

---

## 1. Payload schema mới nhất (v0.9.0)

API hỗ trợ **hai schema**: cũ (< 0.9.0) và mới (≥ 0.9.0). Phần dưới là **schema mới (v0.9.0)**.

### 1.1. Root level

| Field | Type | Bắt buộc | Ghi chú |
|-------|------|----------|---------|
| `logger_id` | string | * (1) | ID logger; dùng nếu không có `device_id` |
| `device_id` | string | * (1) | ID thiết bị (schema cũ); dùng nếu không có `logger_id` |
| `timestamp` | integer | ✓ | Unix timestamp (giây) |
| `timezone` | string | | Mặc định: `Asia/Ho_Chi_Minh` |
| `fw_version` | string | | Phiên bản firmware, VD: `0.9.0` |
| `schema_version` | string | | Phiên bản schema, VD: `0.9.0` (≥ 0.9 = schema mới) |
| `data` | object | ✓ | Chứa `system` và `inverters` |
| `alarms` | array | | Chỉ schema cũ; schema mới dùng `inverters[].alarm.data[]` |

(1) Cần ít nhất một trong hai: `logger_id` hoặc `device_id`.

### 1.2. data.system (schema v0.9.0)

| Field | Type | Ghi chú |
|-------|------|---------|
| `total_ac_active_power_w` | integer | Tổng công suất AC (W) |
| `online_inverters` | integer | Số inverter online |
| `total_inverters` | integer | Tổng số inverter |

*Lưu ý:* Trong DB, `system` lưu dạng **Mixed** nên mọi field payload gửi thêm đều được lưu nguyên.

### 1.3. data.inverters[] (schema v0.9.0)

Mỗi phần tử inverter có thể chứa các section sau (tất cả optional, tùy firmware):

| Section | Mô tả ngắn |
|---------|-------------|
| **info** | Thông tin định danh inverter |
| **operating_state** | Chế độ vận hành / lưới |
| **sign_convention** | Quy ước dấu công suất |
| **ac_measurements** | Đo lường AC 3 pha |
| **grid_interaction** | Tương tác lưới (import/export) |
| **pv_input** | Đầu vào PV (MPPT) |
| **battery_storage** | Pin (SOC, SOH, công suất) |
| **load** | Tải |
| **performance** | Hiệu suất inverter |
| **alarm** | Cảnh báo (count + data[]) |
| **thermal_hardware** | Nhiệt độ phần cứng |
| **quality** | Chất lượng dữ liệu (source, online, poll_interval) |

#### info

| Field | Type |
|-------|------|
| `modbus_address` | integer |
| `serial_number` | string |
| `model_name` | string |
| `inverter_type` | string (VD: hybrid_3_phase) |
| `rated_power_w` | integer |
| `hw_version` | string |
| `protocol` | string (VD: modbus_rtu) |

#### operating_state

| Field | Type | enum |
|-------|------|------|
| `work_mode` | string | normal, standby, fault |
| `grid_mode` | string | on_grid, off_grid |

#### sign_convention

| Field | Type |
|-------|------|
| `grid_exchange_active_power` | string (VD: positive_import) |
| `battery_dc_active_power` | string (VD: positive_charge) |

#### ac_measurements

| Field | Type |
|-------|------|
| `voltage_l1n_v`, `voltage_l2n_v`, `voltage_l3n_v` | number |
| `current_l1_a`, `current_l2_a`, `current_l3_a` | number |
| `inverter_ac_bus_active_power_w` | integer |
| `inverter_ac_reactive_power_var`, `inverter_ac_apparent_power_va` | integer |
| `inverter_ac_bus_active_power_l1_w`, `_l2_w`, `_l3_w` | integer |

#### grid_interaction

| Field | Type |
|-------|------|
| `exchange_active_power_w`, `import_active_power_w`, `export_active_power_w` | integer |
| `import_energy_today_kwh`, `import_energy_total_kwh` | number |
| `export_energy_today_kwh`, `export_energy_total_kwh` | number |
| `zero_export_enabled` | boolean |
| `export_power_limit_w`, `frequency_hz` | number |

#### pv_input

| Field | Type |
|-------|------|
| `dc_bus_voltage_v` | number |
| `pv_inputs` | array of { mppt, voltage_v, current_a, dc_power_w } |

#### battery_storage

| Field | Type |
|-------|------|
| `mode` | string (charge, discharge, idle) |
| `active_power_w`, `voltage_v`, `current_a` | number |
| `soc_percent`, `soh_percent` | integer |
| `energy_charge_today_kwh`, `energy_discharge_today_kwh` | number |
| `charge_limit_w`, `discharge_limit_w` | integer |

#### load

| Field | Type |
|-------|------|
| `active_power_w` | integer |

#### performance

| Field | Type |
|-------|------|
| `inverter_efficiency_percent` | number |

#### alarm (v0.9.0)

| Field | Type |
|-------|------|
| `count` | integer |
| `data` | array of AlarmDataV09 |

**AlarmDataV09:**

| Field | Type | enum |
|-------|------|------|
| `type` | string | warning, error |
| `code` | number/string | Mã alarm |
| `text` | string | Mô tả |
| `first_seen_ts`, `last_seen_ts` | integer | Unix timestamp |
| `current_value`, `threshold` | number | (optional) |

#### thermal_hardware

| Field | Type |
|-------|------|
| `inverter_temp_c`, `heatsink_temp_c`, `ambient_temp_c` | number |
| `transformer_temp_c` | number \| null |

#### quality

| Field | Type |
|-------|------|
| `source` | string (modbus, iec104, cache) |
| `device_online` | boolean |
| `poll_interval_ms` | integer |

---

## 2. Các bảng (collection) và schema MongoDB

### 2.1. data_points (DataPoint)

Lưu từng lần gửi data (mỗi request POST /v1/data → 1 document).

| Field | Type | Ghi chú |
|-------|------|---------|
| `device_id` | String | required |
| `timestamp` | Date | required (từ payload timestamp) |
| `timezone` | String | default Asia/Ho_Chi_Minh |
| `version` | String | fw_version hoặc version |
| `schema_version` | String | VD: 0.9.0 |
| `fw_version` | String | |
| `system` | Mixed | Toàn bộ `data.system` |
| `inverters` | [Mixed] | Toàn bộ `data.inverters[]` |
| `createdAt`, `updatedAt` | Date | timestamps |

- Index: `(device_id, timestamp -1)`, TTL: 7 ngày (`timestamp`).

### 2.2. devices (Device)

Cập nhật theo device_id khi có request; có thể upsert.

| Field | Type | Ghi chú |
|-------|------|---------|
| `device_id` | String | required, unique |
| `project_id`, `area_id` | ObjectId | ref Project, Area |
| `site_name`, `location`, `timezone` | String | |
| `version` | String | default 0.9.0 |
| `total_inverters` | Number | Cập nhật từ payload (schema mới) |
| `status` | String | enum: online, offline |
| `last_seen` | Date | Cập nhật mỗi khi nhận data |
| `device_info` | Object | Chỉ lấy từ **inverters[0].info** (schema mới) |
| `device_info.serial_number`, `model_name`, `inverter_type` | String | |
| `device_info.rated_power_w`, `modbus_address` | Number | |
| `device_info.hw_version`, `protocol` | String | |
| `metadata` | Object | installation_date, notes, ... |

### 2.3. alarms (Alarm)

Chỉ ghi khi có alarm **mới** (chưa tồn tại ACTIVE cùng device_id + alarm_code).

| Field | Type | Ghi chú |
|-------|------|---------|
| `device_id` | String | required |
| `alarm_code` | Number | required |
| `severity` | String | CRITICAL, MAJOR, MINOR, WARNING |
| `description` | String | required |
| `inverter_id` | Number | null nếu không có |
| `start_time` | Date | required |
| `end_time` | Date | null khi ACTIVE |
| `status` | String | ACTIVE, RESOLVED, ACKNOWLEDGED |
| `current_value`, `threshold` | Number | (optional) |
| `acknowledged_by`, `acknowledged_at` | String, Date | |

- Schema mới: map `inverters[].alarm.data[]` → type → severity (warning→MINOR, error→CRITICAL).
- TTL: 2 năm theo `start_time`.

### 2.4. notifications (Notification)

Chỉ tạo khi có **alarm mới** và device có `area_id`; gửi cho area managers.

| Field | Type | Ghi chú |
|-------|------|---------|
| `user_id` | ObjectId | required, ref User |
| `area_id`, `project_id` | ObjectId | ref Area, Project |
| `device_id` | String | |
| `type` | String | alarm, maintenance, performance, ... |
| `severity` | String | info, warning, error, critical |
| `title`, `message` | String | required |
| `data` | Mixed | VD: device_id, alarm_code, alarm_id |
| `read`, `read_at` | Boolean, Date | |

### 2.5. hourly_summaries (HourlySummary)

**Không** ghi trực tiếp trong handler; do **aggregationService** tạo/cập nhật (async sau khi lưu data_point).

| Field | Type |
|-------|------|
| `device_id` | String |
| `hour` | Date (đầu giờ) |
| `total_energy`, `max_power`, `min_power`, `avg_power` | Number |
| `avg_power_factor`, `avg_frequency` | Number |
| `online_inverters` | Number |
| `inverter_summaries` | [{ inverter_id, energy, max_power, avg_power, efficiency }] |

- TTL: 1 năm theo `hour`.

### 2.6. daily_summaries (DailySummary)

Cũng do **aggregationService** tạo/cập nhật (async).

| Field | Type |
|-------|------|
| `device_id` | String |
| `date` | Date |
| `total_energy`, `max_power`, `min_power`, `avg_power` | Number |
| `peak_hour`, `sunshine_hours`, `revenue` | Number |
| `battery` | { total_charge, total_discharge, avg_soc } |
| `environmental` | { coal_saved, co2_avoided, trees_equivalent } |
| `inverter_summaries` | [{ inverter_id, energy, max_power, avg_power }] |

- TTL: 5 năm theo `date`.

### 2.7. apilogs (ApiLog)

Ghi bởi **middleware logger** cho mọi request `/api/...` (trừ health, favicon). Mỗi request = 1 document.

| Field | Type |
|-------|------|
| `method`, `path` | String |
| `status_code`, `status_type` | Number, String (success, client_error, server_error) |
| `ip_address`, `user_agent` | String |
| `response_time_ms` | Number |
| `request_size_bytes`, `response_size_bytes` | Number |
| `api_key` | String (rút gọn nếu dài) |
| `user_id` | ObjectId (nếu có) |
| `query_params`, `request_body`, `response_body` | Mixed (body chỉ lưu nếu < 10KB) |
| `error_message` | String (khi lỗi) |
| `createdAt`, `updatedAt` | Date |

---

## 3. Luồng ghi khi gọi POST /api/v1/data

Thứ tự xử lý trong handler và các bảng được ghi:

```
Request POST /api/v1/data (body: device_id/logger_id, timestamp, data.system, data.inverters, ...)
    │
    ├─ 1. Validation (timestamp, data, data.system bắt buộc; device_id hoặc logger_id bắt buộc)
    │
    ├─ 2. devices
    │      Device.updateDeviceStatus(device_id, true)
    │      → status = 'online', last_seen = now (upsert nếu chưa có)
    │
    ├─ 3. devices (chỉ schema ≥ 0.9 và có inverters[0].info)
    │      findOneAndUpdate(device_id, $set: device_info từ inverters[0].info, total_inverters)
    │
    ├─ 4. data_points
    │      new DataPoint({ device_id, timestamp, timezone, version, schema_version, fw_version, system, inverters }).save()
    │      → 1 document mới
    │
    ├─ 5. alarms (với từng alarm mới, chưa ACTIVE trùng device_id + alarm_code)
    │      Schema mới: lấy từ data.inverters[].alarm.data[]
    │      Schema cũ: lấy từ body.alarms[]
    │      → new Alarm({ ... }).save() cho mỗi alarm mới
    │
    ├─ 6. notifications (nếu có alarm mới và device.area_id tồn tại)
    │      Notification.notifyAreaManagers(area_id, 'alarm', severity, title, message, data)
    │      → N document (1 per area manager)
    │      + WebSocket emit notification
    │
    ├─ 7. WebSocket emit alarm (cho mỗi alarm mới)
    │
    ├─ 8. aggregationService.processAggregation(device_id, timestamp) — async, không chờ
    │      → Đọc data_points, ghi/cập nhật hourly_summaries, daily_summaries
    │
    └─ 9. res.json({ status: 'success', message: 'Data received', server_time })
```

Sau khi response gửi xong:

- **10. apilogs**  
  Middleware logger (res.on('finish')) ghi 1 document ApiLog cho request này.

---

## 4. Tóm tắt bảng ghi khi POST /api/v1/data

| Bảng | Khi nào ghi | Ghi gì |
|------|-------------|--------|
| **data_points** | Mỗi request | 1 document: device_id, timestamp, system, inverters (full payload) |
| **devices** | Mỗi request | Update status, last_seen; nếu schema ≥ 0.9 + có info: update device_info, total_inverters |
| **alarms** | Chỉ khi có alarm mới (chưa ACTIVE trùng device_id + alarm_code) | 1 document/alarm |
| **notifications** | Chỉ khi có alarm mới và device có area_id | N document (1/user area manager) |
| **hourly_summaries** | Async qua aggregation | Tạo/cập nhật theo giờ từ data_points |
| **daily_summaries** | Async qua aggregation | Tạo/cập nhật theo ngày từ data_points |
| **apilogs** | Mỗi request (middleware) | 1 document log API request/response |

---

*Tài liệu tham chiếu: swagger.yaml, models/*.js, routes/data.js, middleware/logger.js, services/aggregationService.js, PAYLOAD-DATABASE-MAPPING.md.*
