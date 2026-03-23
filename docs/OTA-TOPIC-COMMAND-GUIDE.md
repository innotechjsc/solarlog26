# Topic `ota/cm4/<device_id>/command` – Ở đâu và hoạt động thế nào

Bảng field payload command / progress / result (hợp đồng với firmware): **`DEVICE-OTA-MQTT-CONTRACT.md`**.

## 1. Topic này là gì?

- **Chuỗi topic:** `ota/cm4/<device_id>/command`
  - `ota` – nhóm OTA
  - `cm4` – loại thiết bị (ví dụ board CM4)
  - `<device_id>` – **thay bằng ID thật** của từng thiết bị (vd: `SL-2025-0002` hoặc `fd96fac7-0641-45b5-8a79-887ae62a5bce`)
  - `command` – kênh để **server gửi lệnh**, thiết bị **subscribe** topic này để **nhận lệnh**

- **Ví dụ topic thật:**
  - `ota/cm4/SL-2025-0002/command` → chỉ thiết bị có `device_id = SL-2025-0002` nhận
  - `ota/cm4/fd96fac7-0641-45b5-8a79-887ae62a5bce/command` → chỉ thiết bị có ID đó nhận

---

## 2. Ở đâu định nghĩa / dùng topic này?

| Nơi | File / Env | Việc làm |
|-----|------------|----------|
| **Prefix topic** | `.env`: `MQTT_OTA_TOPIC_PREFIX=ota/cm4` | Nếu không set thì mặc định `ota/cm4` |
| **Tạo topic đầy đủ** | `services/mqttOtaService.js` | Hàm `getCommandTopic(deviceId)` → trả về `ota/cm4/<device_id>/command` |
| **Publish lệnh** | `services/mqttOtaService.js` | `publishUpdateCommand(deviceId, release)` publish JSON lên **đúng topic** của 1 device; `publishUpdateToDevices(deviceIds, ...)` gửi lần lượt từng device |
| **Route API** | `routes/ota.js` | Khi Admin push có `device_ids` (hoặc `all_devices: true`), gọi `publishUpdateToDevices` → mỗi device nhận đúng topic của nó |
| **Broker (Aedes)** | `scripts/mqtt-broker-local.js` | Đọc env `MQTT_OTA_TOPIC_PREFIX` (mặc định `ota/cm4`), dùng regex để **theo dõi** client nào subscribe topic dạng `ota/cm4/<device_id>/command` → phục vụ API **GET /subscribed-devices** (danh sách device_id đang sub) |

**Tóm lại:** Topic **được tạo trong code** từ prefix `ota/cm4` + `device_id` + `/command`, **không** có file cấu hình tách riêng; env chỉ cấu hình **prefix** (`MQTT_OTA_TOPIC_PREFIX`).

---

## 3. Hoạt động như thế nào?

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROKER MQTT (vd: mqtt.adtrade.site hoặc localhost:1883)                 │
│  Topic thật ví dụ: ota/cm4/SL-2025-0002/command                          │
└─────────────────────────────────────────────────────────────────────────┘
         │                                    ▲
         │ subscribe                           │ publish
         │ "ota/cm4/SL-2025-0002/command"      │ (cùng topic + payload JSON)
         ▼                                    │
┌─────────────────────┐            ┌─────────────────────┐
│  Thiết bị (device)   │            │  Backend (API +      │
│  device_id =         │            │  mqttOtaService)     │
│  SL-2025-0002        │            │                     │
│  – Kết nối MQTT      │            │  Khi Admin "Push     │
│  – Subscribe đúng    │            │  MQTT" với 1 hoặc    │
│    topic của mình    │            │  nhiều device_id →   │
│  – Nhận message →    │            │  với mỗi id gọi     │
│    cập nhật firmware │            │  getCommandTopic(id)│
│                      │            │  → publish 1 message │
└─────────────────────┘            └─────────────────────┘
```

### Bước từng bước

1. **Thiết bị (firmware/CM4):**
   - Kết nối tới MQTT broker (vd: `mqtt.adtrade.site`).
   - **Subscribe** topic `ota/cm4/<device_id_của_nó>/command` (ví dụ `ota/cm4/SL-2025-0002/command`).
   - Chỉ khi có message trên **đúng topic đó** thì thiết bị mới nhận.

2. **Backend (server):**
   - Admin chọn release và chọn thiết bị (hoặc “tất cả”), gửi **device_ids** (vd: `["SL-2025-0002", "SL-2025-0003"]`).
   - `mqttOtaService.publishUpdateToDevices(deviceIds, release)`:
     - Với mỗi `device_id` → `getCommandTopic(deviceId)` → topic = `ota/cm4/<device_id>/command`.
     - Publish **một message** (JSON: `action`, `url`, `version`, `checksum`) lên **đúng topic đó**, QoS 1.

3. **Broker:**
   - Chỉ gửi message tới **client đang subscribe đúng topic**.
   - Ví dụ: message trên `ota/cm4/SL-2025-0002/command` chỉ tới thiết bị đã sub topic này; thiết bị khác không nhận.

4. **Kết quả:**
   - Mỗi device chỉ nhận lệnh OTA trên **topic riêng** của nó → **đẩy theo đúng device_id**, không broadcast chung một topic.

---

## 4. So với topic broadcast `ota/release`

| | `ota/cm4/<device_id>/command` | `ota/release` |
|---|-------------------------------|----------------|
| **Định nghĩa** | Trong code: prefix + device_id + `/command` (mqttOtaService + env) | Env `MQTT_OTA_TOPIC=ota/release` (1 topic cố định) |
| **Số topic** | N topic (mỗi device 1 topic) | 1 topic |
| **Ai nhận** | Chỉ device subscribe đúng `ota/cm4/<device_id>/command` | Mọi client subscribe `ota/release` |
| **Khi nào dùng** | Khi Admin push có **device_ids** (hoặc all_devices) | Khi Admin chọn **Broadcast (ota/release)** |
| **Payload** | `{ "action": "update", "url", "version", "checksum" }` (spec) | Payload release đầy đủ (version, url, checksum_sha256, size, …) |

---

## 5. Xem topic và nội dung ở đâu?

- **MQTT Explorer:** Kết nối tới broker → cây topic bên trái sẽ có nhánh dạng `ota/cm4/<device_id>/command` (nếu đã có thiết bị sub hoặc server đã publish). Click vào topic → tab **Value** bên phải là **nội dung điều khiển** (JSON).
- **Admin (sau khi push):** Response API trả về `mqtt_topic` (pattern hoặc topic thật), `payload_summary`, `device_ids` đã gửi; alert sau khi push hiển thị nội dung điều khiển và danh sách device_id đã đẩy.

Nếu bạn muốn, có thể thêm ví dụ gọi API hoặc đoạn code firmware subscribe topic này vào cuối file.

---

## 6. Topic `progress` và `result` (server subscribe)

Theo `api/solar_logger_payload_desc.md` (G7 — OTA), thiết bị có thể publish tiến trình và kết quả lên:

| Topic | Ví dụ | Hướng |
|--------|--------|--------|
| `<prefix>/<device_id>/progress` | `ota/cm4/SL-2025-0002/progress` | Logger → cloud |
| `<prefix>/<device_id>/result` | `ota/cm4/SL-2025-0002/result` | Logger → cloud |

- **Prefix** giống lệnh: env `MQTT_OTA_TOPIC_PREFIX` (mặc định `ota/cm4`).
- Backend **subscribe** wildcard `ota/cm4/+/progress` và `ota/cm4/+/result` (khi `MQTT_OTA_SUBSCRIBE_STATUS` không phải `0`/`false`/`no`), parse JSON và cập nhật `Device.ota_status` trong MongoDB.
- **Đọc qua HTTP:** `GET /api/v1/devices/<device_id>/ota-status` trả về `ota_status.progress` và `ota_status.result` gần nhất.

Payload gợi ý khớp tài liệu IoT: `command_id`, `stage`, `progress_pct`, `message`, … (progress); `status`, `version`, `previous_version`, `error_code`, … (result).
