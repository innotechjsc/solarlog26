# MQTT broker và quản trị thiết bị OTA trong Admin

## Hệ thống đang dùng MQTT gì?

- **Cấu hình qua env:** `MQTT_BROKER_URL` (mặc định `mqtt://localhost:1883`). Backend **không** cố định một broker cụ thể.
- **Hai cách dùng thường gặp:**
  1. **Aedes** (Node.js): chạy `node scripts/mqtt-broker-local.js` → broker trên port 1883, HTTP stats trên 1884. Khi dùng Aedes có thể lấy **danh sách device_id đang sub** qua `GET /subscribed-devices` (port 1884).
  2. **Mosquitto** (hoặc EMQX, HiveMQ...): cài broker bên ngoài, trỏ `MQTT_BROKER_URL` tới broker đó. Thường **không** có API trả danh sách subscriber → backend trả về `device_ids: []` khi gọi `/ota/subscribed-devices`.

Tóm lại: broker đang dùng là **broker bạn cấu hình** (Aedes local hoặc Mosquitto/khác). Env chỉ cần đúng URL và auth (nếu có).

---

## Trường hợp không lấy được device đang sub

Khi broker **không** trả danh sách thiết bị đang sub (ví dụ dùng Mosquitto), vẫn có thể **tự quản trị trong Admin**:

1. **Danh sách thiết bị** lấy từ CMS (collection `devices` trong MongoDB) — đây là danh sách thiết bị admin đã thêm/quản lý.
2. Trong trang **OTA / Releases**, khi bấm **Push MQTT** sẽ mở **modal** với các lựa chọn:
   - **Thiết bị đang sub** (nếu broker trả về): nút "Gửi đến N thiết bị đang sub".
   - **Gửi đến tất cả thiết bị trong hệ thống**: dùng `all_devices: true` (API lấy toàn bộ `device_id` từ DB).
   - **Chọn từng thiết bị**: danh sách device từ CMS, tích checkbox rồi bấm "Gửi đến thiết bị đã chọn" → API nhận `device_ids: [...]`.
   - **Broadcast (ota/release)**: không gửi device_ids → publish lên topic `ota/release` (cách cũ).

Như vậy dù **không** lấy được danh sách device đang sub, admin vẫn có thể chọn đích gửi OTA từ **danh sách thiết bị đã quản trị trong hệ thống** (CMS).

---

## API liên quan

| Endpoint | Mô tả |
|----------|--------|
| `GET /api/v1/ota/subscribed-devices` | Danh sách device_id đang sub (chỉ có khi broker là Aedes). |
| `GET /api/v1/cms/devices` | Danh sách thiết bị trong CMS (admin dùng cho modal chọn device). |
| `POST /api/v1/ota/releases/:version/publish` | Body: `{ device_ids: [...] }` hoặc `{ all_devices: true }` hoặc không gửi (broadcast). |
