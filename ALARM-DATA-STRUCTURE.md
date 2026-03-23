# 🔔 Cấu trúc Alarm Data trong `inverters[].alarm.data[]`

## 📋 Tổng quan

Trong schema mới (v0.9.0+), alarm data được lưu trong `inverters[].alarm.data[]` của mỗi inverter trong DataPoint.

---

## 🏗️ Cấu trúc dữ liệu

### Trong DataPoint Collection

```javascript
{
  device_id: "SL-2025-0001",
  timestamp: ISODate("2026-01-23T07:42:44.000Z"),
  inverters: [
    {
      info: {
        modbus_address: 1,
        serial_number: "SN00112345678",
        model_name: "DEYE-SUN-12K-SG04LP3"
      },
      alarm: {
        count: 2,                    // Tổng số alarm
        data: [                      // Mảng các alarm
          {
            type: "warning",         // Loại: "warning" hoặc "error"
            code: 102,               // Mã alarm (có thể là number hoặc string)
            text: "Grid phase wrong", // Mô tả alarm
            first_seen_ts: 1703761600, // Unix timestamp (giây)
            last_seen_ts: 1703761800   // Unix timestamp (giây)
          },
          {
            type: "error",
            code: 2051,
            text: "DC/DC Softstart Fault",
            first_seen_ts: 1703761500,
            last_seen_ts: 1703761800
          }
        ]
      }
    }
  ]
}
```

---

## 📊 Các trường trong `alarm.data[]`

| Field | Type | Mô tả | Ví dụ |
|-------|------|-------|-------|
| `type` | String | Loại alarm: `"warning"` hoặc `"error"` | `"warning"`, `"error"` |
| `code` | Mixed (Number/String) | Mã alarm | `102`, `2051`, `"ALM-001"` |
| `text` | String | Mô tả chi tiết alarm | `"Grid phase wrong"` |
| `first_seen_ts` | Number | Unix timestamp (giây) khi alarm xuất hiện lần đầu | `1703761600` |
| `last_seen_ts` | Number | Unix timestamp (giây) khi alarm xuất hiện lần cuối | `1703761800` |
| `current_value` | Number (optional) | Giá trị hiện tại (nếu có) | `51.5` |
| `threshold` | Number (optional) | Ngưỡng (nếu có) | `51.0` |

---

## 🔄 Mapping sang `alarms` Collection

Khi API `/api/v1/data` nhận payload, nó sẽ xử lý `inverters[].alarm.data[]` và tạo records trong collection `alarms`:

### Logic xử lý:

```javascript
// Duyệt qua tất cả inverters
data.inverters.forEach((inverter, index) => {
  if (inverter.alarm && inverter.alarm.data && Array.isArray(inverter.alarm.data)) {
    inverter.alarm.data.forEach(alarmData => {
      // Map sang Alarm model
      const alarm = {
        device_id: device_id,
        alarm_code: alarmData.code,              // Từ code
        severity: mapTypeToSeverity(alarmData.type), // "warning" → "MINOR", "error" → "CRITICAL"
        description: alarmData.text,            // Từ text
        inverter_id: inverter.info?.modbus_address || index + 1,
        start_time: new Date(alarmData.first_seen_ts * 1000),
        status: 'ACTIVE',
        current_value: alarmData.current_value,
        threshold: alarmData.threshold
      };
      
      // Chỉ tạo nếu chưa có alarm ACTIVE với cùng device_id và alarm_code
      if (!existingAlarm) {
        await new Alarm(alarm).save();
      }
    });
  }
});
```

### Mapping Table:

| `inverters[].alarm.data[]` | `alarms` Collection |
|---------------------------|---------------------|
| `type: "warning"` | `severity: "MINOR"` |
| `type: "error"` | `severity: "CRITICAL"` |
| `type: "critical"` | `severity: "CRITICAL"` |
| `code` | `alarm_code` |
| `text` | `description` |
| `first_seen_ts` | `start_time` (convert Unix → Date) |
| `inverter.info.modbus_address` | `inverter_id` |
| `current_value` | `current_value` |
| `threshold` | `threshold` |

---

## 📝 Ví dụ thực tế từ Database

### Query kết quả:

```
📌 Record 1:
   Device ID: SL-2025-0001
   Timestamp: Fri Jan 23 2026 14:42:44 GMT+0700
   Schema Version: 2.0
   Number of Inverters: 2

   🔔 Inverter 1 Alarm:
      Inverter Info:
         Modbus Address: 1
         Serial Number: SN00112345678
         Model: DEYE-SUN-12K-SG04LP3
      Alarm Count: 2
      Number of Alarms: 2

      ⚠️  Alarm 1:
         Type: warning 🟡
         Code: 102
         Text: Grid phase wrong
         First Seen: 18:06:40 28/12/2023
         Last Seen: 18:10:00 28/12/2023

      ⚠️  Alarm 2:
         Type: error 🔴
         Code: 2051
         Text: DC/DC Softstart Fault
         First Seen: 18:05:00 28/12/2023
         Last Seen: 18:10:00 28/12/2023
```

---

## 🔍 Query Examples

### 1. Tìm tất cả DataPoints có alarm

```javascript
const dataPoints = await DataPoint.find({
  'inverters.alarm.data': { $exists: true, $ne: [], $not: { $size: 0 } }
}).sort({ timestamp: -1 });
```

### 2. Tìm alarm cụ thể theo code

```javascript
const dataPoints = await DataPoint.find({
  'inverters.alarm.data.code': 102
}).sort({ timestamp: -1 });
```

### 3. Tìm alarm theo type (error/warning)

```javascript
const dataPoints = await DataPoint.find({
  'inverters.alarm.data.type': 'error'
}).sort({ timestamp: -1 });
```

### 4. Lấy alarm data từ một DataPoint cụ thể

```javascript
const dataPoint = await DataPoint.findOne({ device_id: 'SL-2025-0001' })
  .sort({ timestamp: -1 });

if (dataPoint && dataPoint.inverters) {
  dataPoint.inverters.forEach((inverter, index) => {
    if (inverter.alarm && inverter.alarm.data) {
      console.log(`Inverter ${index + 1} has ${inverter.alarm.data.length} alarms`);
      inverter.alarm.data.forEach(alarm => {
        console.log(`  - ${alarm.type}: ${alarm.code} - ${alarm.text}`);
      });
    }
  });
}
```

---

## ⚠️ Lưu ý quan trọng

1. **Multiple Inverters**: Mỗi inverter có thể có nhiều alarm trong `alarm.data[]`.

2. **Alarm Deduplication**: Khi tạo record trong `alarms` collection, hệ thống chỉ tạo alarm mới nếu chưa có alarm ACTIVE với cùng `device_id` và `alarm_code`.

3. **Timestamp Format**: `first_seen_ts` và `last_seen_ts` là Unix timestamp (giây), cần convert sang Date khi hiển thị:
   ```javascript
   new Date(alarmData.first_seen_ts * 1000)
   ```

4. **Type Mapping**: 
   - `"warning"` → `severity: "MINOR"` trong `alarms` collection
   - `"error"` → `severity: "CRITICAL"` trong `alarms` collection
   - `"critical"` → `severity: "CRITICAL"` trong `alarms` collection

5. **Schema Version**: Cấu trúc này chỉ có trong schema >= 0.9.0. Schema cũ sử dụng `alarms[]` ở root level.

---

## 🛠️ Script Query

Đã tạo script `scripts/query-alarm-data.js` để query top 5 bản ghi có alarm data:

```bash
node scripts/query-alarm-data.js
```

Script này sẽ:
- Kết nối MongoDB từ `.env`
- Query top 5 DataPoints có alarm data
- Hiển thị chi tiết từng alarm trong mỗi inverter
- Format timestamp thành định dạng dễ đọc
