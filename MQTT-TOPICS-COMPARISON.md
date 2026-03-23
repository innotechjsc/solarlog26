# So sánh MQTT topic & command với yêu cầu (mqtt_topics.pdf)

## Yêu cầu từ payload/mqtt_topics.pdf

### Topic format
- Pattern: `ota/cm4/<device_id>/<channel>`
- Channels: `command` (device subscribe để nhận lệnh), `status`, `progress` (device publish)

### Subscribe (device nhận lệnh)
| Topic | QoS | Mô tả |
|-------|-----|-------|
| `ota/cm4/<device_id>/command` | 1 | Nhận command điều khiển |

Ví dụ: `ota/cm4/SL-2025-0002/command`

### Command format (JSON) khi server gửi lệnh update
```json
{
  "action": "update",
  "url": "http://server/firmware.bin",
  "version": "1.2.0",
  "checksum": "sha256:abc123..."
}
```
- `action`: bắt buộc, với update là `"update"`
- `url`: required
- `version`: required
- `checksum`: optional

---

## Hiện trạng backend (trước khi sửa)

### Topic
- Dùng **một topic cố định**: `ota/release` (env: `MQTT_OTA_TOPIC=ota/release`)
- **Không** có `device_id`, **không** có channel `command`
- Mọi device subscribe cùng topic `ota/release` → broadcast

### Payload publish
```json
{
  "version": "1.2.0",
  "url": "https://...",
  "checksum_sha256": "sha256:...",
  "size": 12345,
  "release_notes": "...",
  "published_at": "2026-03-03T10:00:00.000Z"
}
```
- **Không** có field `action: "update"`
- Dùng `checksum_sha256` thay vì `checksum`
- Có thêm `size`, `release_notes`, `published_at` (không nằm trong spec command)

---

## Kết luận so sánh

| Hạng mục | Yêu cầu (PDF) | Backend hiện tại | Đúng? |
|----------|----------------|------------------|--------|
| **Topic** | `ota/cm4/<device_id>/command` | `ota/release` | ❌ Sai |
| **Payload có `action`** | `"action": "update"` | Không có | ❌ Sai |
| **Tên field checksum** | `checksum` (optional) | `checksum_sha256` | ❌ Sai (tên khác) |
| **url, version** | required | Có | ✅ |
| **QoS command** | 1 | 1 | ✅ |

---

## Hướng chỉnh đã áp dụng

1. **Topic (spec):** Publish đến `ota/cm4/<device_id>/command` (env `MQTT_OTA_TOPIC_PREFIX=ota/cm4`). Legacy: không truyền `device_ids` thì vẫn broadcast `ota/release`.
2. **Payload command:** Khi publish theo device_ids: `{"action": "update", "url": "...", "version": "...", "checksum": "sha256:..."}` (checksum optional).
3. **API:** `POST .../publish` nhận body `{ "device_ids": ["SL-2025-0001", ...] }`. Có device_ids → topic + format spec; không có → ota/release.
