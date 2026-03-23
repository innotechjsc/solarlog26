# Đồng bộ Payload Schema 0.9.0 - Hoàn thành

**Ngày**: 2026-01-06  
**Status**: ✅ Hoàn thành

## Tổng quan

Backend đã được cập nhật để hỗ trợ payload schema version 0.9.0 mới từ Solar Logger, đồng thời vẫn giữ backward compatibility với schema cũ.

## Các thay đổi đã thực hiện

### 1. ✅ DataPoint Model (`models/DataPoint.js`)

**Thay đổi:**
- Thêm hỗ trợ cho cấu trúc nested mới của inverter (schema 0.9.0+)
- Thêm các schema mới: `inverterInfoSchema`, `operatingStateSchema`, `acMeasurementsSchema`, `gridInteractionSchema`, `pvInputSchema`, `batteryStorageSchema`, `alarmSchemaNew`, `thermalHardwareSchema`, `qualitySchema`
- Giữ các schema cũ để backward compatibility
- Thay đổi `system`, `inverters` sang `Mixed` type để hỗ trợ cả cấu trúc cũ và mới
- Thêm fields: `schema_version`, `fw_version`

**Kết quả:**
- Database có thể lưu cả payload cũ và mới
- Không cần migration dữ liệu cũ

### 2. ✅ Data Route (`routes/data.js`)

**Thay đổi:**
- Hỗ trợ cả `device_id` (cũ) và `logger_id` (mới) trong payload
- Tự động detect schema version từ `schema_version` field
- Xử lý alarm từ cấu trúc mới: `inverters[].alarm.data[]`
- Map alarm structure:
  - `type` → `severity` (warning → MINOR, error → CRITICAL)
  - `code` (có thể là string hoặc number)
  - `text` → `description`
  - `first_seen_ts` / `last_seen_ts` → `start_time`

**Kết quả:**
- API endpoint `/api/v1/data` nhận được cả payload cũ và mới
- Alarm được xử lý đúng từ cả hai cấu trúc

### 3. ✅ Devices Route (`routes/devices.js`)

**Thay đổi:**

**Endpoint `/api/v1/devices/:deviceId/components`:**
- Tự động detect schema version
- Extract inverter data từ cấu trúc cũ (flat) hoặc mới (nested)
- Extract battery từ root level (cũ) hoặc `inverters[].battery_storage` (mới)

**Endpoint `/api/v1/devices/:deviceId/battery`:**
- Hỗ trợ cả cấu trúc cũ và mới
- Extract battery từ đúng vị trí tùy theo schema version
- Trả về format nhất quán cho frontend

**Kết quả:**
- Frontend nhận được dữ liệu đúng format bất kể schema version
- Component extraction hoạt động với cả cấu trúc cũ và mới

### 4. ✅ Analytics Route (`routes/analytics.js`)

**Thay đổi:**

**Endpoint `/api/v1/analytics/energy-management`:**
- Tính power flow từ cấu trúc mới nếu schema version >= 0.9.0:
  - PV output: từ `pv_input.pv_inputs[].dc_power_w`
  - Grid interaction: từ `grid_interaction.import_active_power_w` / `export_active_power_w`
  - Battery: từ `battery_storage.active_power_w` và `mode`
  - Load: từ `load.active_power_w`
- Fallback về `power_flow` schema cũ nếu schema < 0.9.0

**Kết quả:**
- Energy management analytics hoạt động với cả schema cũ và mới
- Power flow được tính toán đúng

### 5. ✅ Tài liệu

**Tạo mới:**
- `PAYLOAD-UPDATE-0.9.0.md`: Tài liệu chi tiết về thay đổi giữa schema cũ và mới
- `PAYLOAD-SYNC-COMPLETE.md`: Tài liệu này - tóm tắt công việc đã hoàn thành

## Các điểm quan trọng

### Backward Compatibility

✅ **Backend vẫn hỗ trợ payload cũ (< 0.9.0)**
- Payload không có `schema_version` hoặc `schema_version < 0.9` → xử lý như schema cũ
- Payload có `schema_version >= 0.9` → xử lý như schema mới

### Schema Detection

```javascript
const isNewSchema = schema_version && parseFloat(schema_version) >= 0.9;
```

### Mapping Fields

**Logger ID:**
```javascript
const device_id = req.body.device_id || req.body.logger_id;
```

**Alarm Mapping (New → Old format):**
```javascript
// New: type: "warning" / "error"
// Old: severity: "MINOR" / "CRITICAL"

const typeMap = {
  'warning': 'MINOR',
  'error': 'CRITICAL',
  'critical': 'CRITICAL'
};
```

### Inverter Structure

**Old (Flat):**
```javascript
{
  id: 1,
  slave_address: 1,
  model: "ABC",
  ac_power: 5000,
  ...
}
```

**New (Nested):**
```javascript
{
  info: { modbus_address: 1, model_name: "ABC", ... },
  ac_measurements: { inverter_ac_bus_active_power_w: 5000, ... },
  operating_state: { work_mode: "normal", grid_mode: "on_grid" },
  ...
}
```

## Testing

### Payload Mới (Schema 0.9.0)

```bash
POST /api/v1/data
{
  "logger_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "timezone": "Asia/Ho_Chi_Minh",
  "fw_version": "0.9.0",
  "schema_version": "0.9.0",
  "data": {
    "system": {
      "total_ac_active_power_w": 450500,
      "online_inverters": 1,
      "total_inverters": 1
    },
    "inverters": [
      {
        "info": { ... },
        "operating_state": { ... },
        "ac_measurements": { ... },
        "grid_interaction": { ... },
        "pv_input": { ... },
        "battery_storage": { ... },
        "alarm": { ... }
      }
    ]
  }
}
```

### Payload Cũ (Backward Compatible)

```bash
POST /api/v1/data
{
  "device_id": "SL-2025-0001",
  "timestamp": 1703761800,
  "version": "0.8.0",
  "data": {
    "system": { ... },
    "inverters": [ ... ],
    "battery": { ... },
    "power_flow": { ... }
  },
  "alarms": [ ... ]
}
```

## Các file đã thay đổi

1. ✅ `backend-system/models/DataPoint.js` - Cập nhật schema
2. ✅ `backend-system/routes/data.js` - Xử lý payload mới
3. ✅ `backend-system/routes/devices.js` - Extract components từ cấu trúc mới
4. ✅ `backend-system/routes/analytics.js` - Tính toán từ fields mới
5. ✅ `backend-system/PAYLOAD-UPDATE-0.9.0.md` - Tài liệu thay đổi
6. ✅ `backend-system/PAYLOAD-SYNC-COMPLETE.md` - Tài liệu này

## Next Steps

1. ✅ **Test với payload mới**: Gửi payload mẫu từ `payload/payload/basic_payload.json`
2. ✅ **Verify backward compatibility**: Đảm bảo payload cũ vẫn hoạt động
3. ⏳ **Update aggregation service**: Kiểm tra `services/aggregationService.js` nếu cần
4. ⏳ **Update dashboard frontend**: Cập nhật frontend để hiển thị fields mới nếu cần

## Lưu ý

- Database không cần migration - dữ liệu cũ và mới được lưu cùng nhau
- API responses vẫn giữ format cũ cho backward compatibility
- Frontend có thể cần cập nhật để hiển thị thông tin mới (3-phase measurements, PV MPPT, thermal data, v.v.)
- Alarm code trong schema mới có thể là string, cần xử lý trong Alarm model nếu cần

---

**Hoàn thành bởi**: Auto (Cursor AI)  
**Ngày**: 2026-01-06

