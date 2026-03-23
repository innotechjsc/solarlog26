# Checklist cập nhật dự án theo tài liệu IoT / API mới nhất

## Quyết định đã chốt (stakeholder + mặc định kỹ thuật)

| Chủ đề | Quyết định |
|--------|------------|
| **Thay đổi topic/payload** | Team **logger** cập nhật / bổ sung tài liệu trong `api/` (giống hiện tại) để thông báo thay đổi; backend và các hệ thống khác chỉnh theo bản đó. |
| **`device_id`** | Serial number logger, **duy nhất toàn hệ thống** (envelope §1). |
| **`site_id`** | Nhóm theo địa điểm lắp đặt; **giá trị từ logger** qua HTTP ingest; **CMS có thể chỉnh và “khóa”** để không bị ghi đè bởi ingest (xem `site_id_cms_locked`, `site_id_reported`). Gỡ khóa: PUT device với `site_id_follow_device: true`. |
| **E.1 HTTP vs MQTT ingest** | **HTTP (`POST /api/v1/data`) là ingest telemetry/bulk chính.** MQTT subscribe `telemetry/*` / tách G1 chỉ triển khai **khi có tài liệu trong `api/`** và bật chủ động (service + env), tránh trùng đường dữ liệu với HTTP. |
| **C.4–C.5 OTA** | Hợp đồng MQTT command + progress/result: **`docs/DEVICE-OTA-MQTT-CONTRACT.md`**. Backend đã gửi `command_id`, `size_bytes`, `reboot_after`, `rollback_on_failure`; firmware echo `command_id` trên progress/result. |
| **F (dispatch/config)** | **Hoãn** tới khi có spec trong `api/` + nhu cầu VPP: không thêm REST/MQTT dispatch ngoài OTA trong giai đoạn này. |
| **G (alarm G4)** | **Giữ model/UI Alarm hiện tại**; mở rộng `event_type` / `requires_ack` / webhook khi có bản `fault`/event chuẩn trong `api/` và yêu cầu vận hành. |

---

Tài liệu tham chiếu trong repo:

| Tài liệu | Đường dẫn |
|----------|-----------|
| Payload & nhóm G1–G9 (MQTT/HTTP) | `api/solar_logger_payload_desc.md` (workspace root) |
| OTA topic lệnh | `docs/OTA-TOPIC-COMMAND-GUIDE.md` |
| Payload OTA backend ↔ device | `docs/DEVICE-OTA-MQTT-CONTRACT.md` |
| OpenAPI đã công bố | `swagger.yaml` → `/api-docs` |

**Lưu ý:** Trong `api/` có thể có PDF (`solar_logger_iot_api.pdf`, …) — giữ đồng bộ với Markdown khi đổi spec.

---

## Phase A — Theo dõi & đồng bộ tài liệu

- [x] **A.1** Checklist này làm điểm vào cho mọi thay đổi theo spec
- [x] **A.2** Ghi chú mapping phiên bản schema (`0.9.x` backend vs envelope `1.0.0` trong tài liệu IoT) trong Swagger mô tả `POST /api/v1/data`
- [x] **A.3** Nguồn spec thiết bị: dùng tài liệu trong `api/` (Markdown/PDF) do logger duy trì; không bắt buộc file tên `solar_logger_iot_api.md` nếu PDF/MD tương đương đã có

---

## Phase B — Ingest HTTP & định danh site (theo envelope §1)

- [x] **B.1** Lưu `site_id` trên `Device` và tùy chọn trên `DataPoint` khi logger gửi kèm
- [x] **B.2** Chấp nhận `sequence`, `payload_type` trên ingest (lưu vào `DataPoint`, hỗ trợ gap/replay sau này)
- [x] **B.3** CMS/Admin PUT device: chỉnh `site_id` → bật `site_id_cms_locked`; `site_id_follow_device: true` → gỡ khóa; ingest luôn cập nhật `site_id_reported`
- [ ] **B.4** Truy vấn theo `site_id` (list device / aggregate) khi vận hành đa site cần filter API/dashboard

---

## Phase C — OTA (theo G7 + guide hiện tại)

- [x] **C.1** Publish lệnh `ota/cm4/<device_id>/command`
- [x] **C.2** Subscribe `.../progress`, `.../result`
- [x] **C.3** `GET /api/v1/devices/:deviceId/ota-status`
- [x] **C.4** Tài liệu cho firmware: `DEVICE-OTA-MQTT-CONTRACT.md` + `OTA-TOPIC-COMMAND-GUIDE.md` §6
- [x] **C.5** Payload publish mở rộng: `command_id`, `size_bytes`, `reboot_after`, `rollback_on_failure` (tùy chọn trên `POST .../publish`)

---

## Phase D — OpenAPI (Swagger)

- [x] **D.1** BearerAuth + auth, OTA public, dashboard, logs, ota-status
- [ ] **D.2** Liệt kê đầy đủ analytics, CMS, admin, notifications (tách file hoặc `$ref`)

---

## Phase E — MQTT ingest telemetry & báo cáo (G1–G2, G8–G9)

- [x] **E.1** (Một phần) MQTT telemetry `\<root\>/\<site_id\>/\<device_id\>/telemetry/\<kind\>` + chuẩn hoá envelope (bật `MQTT_TELEMETRY_INGEST_ENABLED=true`). Đủ slice G1 & topic thực tế: theo cập nhật `api/` + firmware
- [ ] **E.2** Ingest báo cáo G2 nếu logger tách khỏi `POST /data`
- [ ] **E.3** `sync/data` + `sync/ack` — khi logger offline buffer theo spec G8
- [ ] **E.4** Metering G9 — khi triển khai đối soát EVN

---

## Phase F — Điều khiển & cấu hình (G5–G6)

- [ ] **F.1–F.3** Chờ spec trong `api/` + phạm vi VPP; ưu tiên TLS MQTT + API key thiết bị khi triển khai

---

## Phase G — Alarm & sự kiện (G4)

- [ ] **G.1–G.2** Mở rộng khi có event catalog (`fault` / payload desc G4) và SLA vận hành

---

## Trạng thái tổng quan

| Phase | Ghi chú |
|-------|---------|
| A–C | Đồng bộ tài liệu + site + OTA contract đã chốt |
| D | Swagger đầy đủ (D.2) còn lại |
| E | HTTP ingest chính; MQTT telemetry theo spec sau |
| F–G | Theo roadmap `api/` |

_Sửa file này và đánh dấu `[x]` khi hoàn thành từng mục._
