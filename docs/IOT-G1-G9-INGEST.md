# Ingest G1–G9 (khớp `api/solar_logger_payload_desc.md`)

## Luồng

1. `parseEnvelope` — `device_id`, `timestamp`, `payload` (envelope `payload` hoặc body phẳng, trừ legacy `data.system`).
2. `validateStrictEnvelope` — nếu `IOT_ENVELOPE_STRICT=true`: bắt buộc `site_id`, `schema_version`, `payload_type` (không áp legacy uploader).
3. `detectGCategory` — G1…G9 theo nội dung (và `topicMeta.kind` cho MQTT telemetry).
4. **G1** → `normalizeIngestBody` + `ingestDataPoint` (DataPoint + alarm + aggregation).
5. **G2–G6, G8–G9** → collection Mongo tương ứng; **G7** → `persistOtaProgress` / `persistOtaResult` (Device.ota_status).

## Collection

| G   | Model              | Ghi chú                          |
|-----|--------------------|-----------------------------------|
| G1  | DataPoint          | + telemetry slice trong `system` |
| G2  | IotEnergyReport    |                                   |
| G3  | IotDeviceStatus    |                                   |
| G4  | IotAlarmEvent      |                                   |
| G5  | IotDispatchMessage |                                   |
| G6  | IotConfigSnapshot  |                                   |
| G7  | Device.ota_status  | đồng MQTT OTA                     |
| G8  | IotSyncBatch       |                                   |
| G9  | IotMeteringRecord  |                                   |

## HTTP / MQTT

- `POST /api/v1/data` + MQTT telemetry: cùng `processIotIngest` (`services/iotIngestRouter.js`).

## G8 — sync/ack (cloud → logger)

Hiện **chỉ ingest** `sync/data` (logger → cloud). Payload `sync/ack` từ cloud xuống logger qua broker / tác vụ riêng, không qua `POST /api/v1/data`.
