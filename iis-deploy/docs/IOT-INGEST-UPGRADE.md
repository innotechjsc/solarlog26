# Nâng cấp ingest theo `api/` (solar_logger_payload_desc.md)

## Đã triển khai trong backend

| Nội dung spec | Code |
|---------------|------|
| Envelope: `payload`, ISO `timestamp`, `schema_version`, `payload_type`, `sequence`, `site_id` | `services/iotIngestNormalizer.js` + `POST /api/v1/data` |
| Payload phẳng kiểu `telemetry/inverter` (một phần G1) | Chuẩn hoá → `data.system` + `data.inverters[0]` |
| Payload dạng `data_uploader` lồng `payload.data` | Hỗ trợ |
| Lưu + alarm + aggregation như trước | `services/dataIngestService.js` |
| MQTT telemetry | `services/mqttTelemetryIngestService.js` — topic: `<MQTT_TELEMETRY_ROOT>/<site_id>/<device_id>/telemetry/<kind>` |

**Env:** `env.example` — `MQTT_TELEMETRY_INGEST_ENABLED`, `MQTT_TELEMETRY_ROOT`, `MQTT_TELEMETRY_SUBSCRIBE_TOPICS`.

## Chưa bao phủ (cần phase sau)

- G1 đầy đủ: mọi slice (grid, bess, weather, …) và mọi quy ước topic thực tế từ firmware.
- G2–G4, G5–G6, G8–G9: collection/API/worker riêng; sync/ack; dispatch/config; metering pháp lý.
- Auth MQTT (TLS/client cert) và mapping tenant.

**Quy trình:** firmware cập nhật `api/` → chỉnh normalizer / topic pattern / persistence theo bản mới.
