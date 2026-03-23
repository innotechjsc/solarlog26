# Hợp đồng OTA MQTT (backend ↔ firmware)

Cập nhật theo quyết định dự án: khi đổi topic/payload, **team logger** bổ sung/cập nhật tài liệu trong thư mục `api/` (Markdown/PDF); backend chỉnh theo bản đó.

## Lệnh xuống thiết bị

- **Topic:** `<MQTT_OTA_TOPIC_PREFIX>/<device_id>/command` (mặc định prefix `ota/cm4`).
- **QoS:** 1  
- **Payload JSON (backend gửi):**

| Field | Bắt buộc | Mô tả |
|--------|----------|--------|
| `action` | ✅ | Luôn `"update"` |
| `url` | ✅ | HTTPS tải firmware |
| `version` | ✅ | Chuỗi phiên bản (semver) |
| `checksum` | Khuyến nghị | `sha256:<hex>` |
| `command_id` | ✅ (backend) | UUID một lần publish (cùng ID cho mọi `device_id` trong một lần admin push, trừ khi body gửi `command_id` tùy chỉnh) — dùng khớp `progress`/`result` |
| `size_bytes` | Khuyến nghị | Kích thước file (từ `Release.size`) |
| `reboot_after` | Tùy chọn | Mặc định `true` nếu không gửi trong `POST .../publish` |
| `rollback_on_failure` | Tùy chọn | Mặc định `true` nếu không gửi trong `POST .../publish` |

**Publish API:** `POST /api/v1/ota/releases/:version/publish`  
Body tùy chọn: `device_ids` | `all_devices`, `command_id`, `reboot_after`, `rollback_on_failure`.

## Thiết bị báo lên

- **Progress:** `<prefix>/<device_id>/progress` — JSON nên có `command_id` (echo), `stage`, `progress_pct`, `message`, … (G7 trong `api/solar_logger_payload_desc.md`)
- **Result:** `<prefix>/<device_id>/result` — `command_id`, `status`, `version`, `error_code`, …

Backend subscribe wildcard và lưu vào `Device.ota_status`; đọc: `GET /api/v1/devices/:deviceId/ota-status`.

## Tương thích ngược

Firmware chỉ đọc `action`, `url`, `version`, `checksum` vẫn hoạt động; các field mới nên **bỏ qua nếu không hỗ trợ**.
