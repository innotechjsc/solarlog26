# Deploy các phần mới (OTA spec, subscribed-devices, admin chọn thiết bị)

Tài liệu này hướng dẫn deploy các thay đổi: MQTT OTA theo spec `ota/cm4/<device_id>/command`, API subscribed-devices, và modal Admin chọn thiết bị khi push OTA.

**Giải thích topic `ota/cm4/<device_id>/command` (ở đâu, hoạt động thế nào):** xem [docs/OTA-TOPIC-COMMAND-GUIDE.md](docs/OTA-TOPIC-COMMAND-GUIDE.md).

---

## 1. Các file đã thay đổi / thêm (trong `backend-system`)

### Backend (bắt buộc nếu dùng OTA)

| File | Mô tả |
|------|--------|
| `services/mqttOtaService.js` | Topic spec, `publishUpdateCommand`, `publishUpdateToDevices`, `getCommandTopic` |
| `routes/ota.js` | `device_ids` / `all_devices`, `GET /ota/subscribed-devices`, require `Device` |
| `models/Release.js` | (đã có sẵn, không đổi) |
| `models/Device.js` | (đã có sẵn, không đổi) |

### Admin (giao diện)

| File | Mô tả |
|------|--------|
| `admin/admin.js` | Modal Push MQTT: chọn thiết bị đang sub / tất cả / chọn từng device / broadcast |

### Broker (tùy chọn – chỉ khi chạy Aedes)

| File | Mô tả |
|------|--------|
| `scripts/mqtt-broker-local.js` | Theo dõi subscription `ota/cm4/<id>/command`, HTTP `GET /subscribed-devices` |

### Cấu hình & tài liệu

| File | Mô tả |
|------|--------|
| `env.example` | Ghi chú MQTT, `MQTT_OTA_TOPIC_PREFIX` |
| `MQTT-TOPICS-COMPARISON.md` | So sánh spec vs implementation |
| `MQTT-AND-ADMIN-DEVICES.md` | MQTT broker + quản trị thiết bị OTA trong admin |

---

## 2. Deploy khi server chạy từ **backend-system** (đầy đủ)

Áp dụng khi bạn deploy toàn bộ thư mục `backend-system` (Node/PM2 hoặc IIS trỏ vào đây).

### Bước 1: Copy file lên server

- Copy **đè** các file đã sửa từ máy dev lên server (giữ cấu trúc thư mục):
  - `services/mqttOtaService.js`
  - `routes/ota.js`
  - `admin/admin.js`
- (Tùy chọn) Copy `scripts/mqtt-broker-local.js` nếu dùng Aedes.

### Bước 2: Cấu hình env trên server

Trong `.env` trên server, thêm hoặc sửa:

```env
# Đã có sẵn, giữ nguyên
MQTT_BROKER_URL=mqtt://...
MQTT_OTA_TOPIC=ota/release
MQTT_USERNAME=...
MQTT_PASSWORD=...

# Thêm (nếu chưa có) – topic command theo spec
MQTT_OTA_TOPIC_PREFIX=ota/cm4

# Chỉ khi chạy Aedes (mqtt-broker-local.js) – để API /ota/subscribed-devices hoạt động
MQTT_STATS_URL=http://localhost:1884
```

### Bước 3: Khởi động lại ứng dụng

- **PM2:**  
  `pm2 restart solarlogger-api`  
  (hoặc tên process tương ứng)
- **IIS/iisnode:** recycle Application Pool hoặc restart site.
- **Node trực tiếp:** dừng process rồi `node server.js` lại.

### Bước 4: (Tùy chọn) Chạy broker Aedes

Nếu muốn dùng Aedes và lấy danh sách device đang sub:

```bash
cd backend-system
node scripts/mqtt-broker-local.js
```

Nên chạy dưới PM2 hoặc service riêng, port 1883 (MQTT) và 1884 (HTTP stats). Đảm bảo `MQTT_BROKER_URL` trỏ tới broker này (ví dụ `mqtt://localhost:1883`).

---

## 3. Deploy khi server dùng **iis-deploy**

Đã đồng bộ OTA vào `iis-deploy`: có sẵn `models/Release.js`, `services/mqttOtaService.js`, `routes/ota.js` và `server.js` đã mount `otaRoutes`.

### Trên server (deploy từ iis-deploy)

1. Copy toàn bộ thư mục **iis-deploy** (hoặc chỉ các file đã đổi) lên server.
2. Copy **admin** có modal OTA: từ `backend-system/admin/admin.js` → `iis-deploy/admin/admin/admin.js` (hoặc copy cả thư mục admin nếu cấu trúc giống nhau). Trên server: copy `admin/admin/admin.js` lên đúng path admin.
3. Trong `.env` trên server thêm (nếu chưa có): `MQTT_BROKER_URL`, `MQTT_OTA_TOPIC`, `MQTT_OTA_TOPIC_PREFIX=ota/cm4`, `MQTT_STATS_URL` (tùy chọn).
4. Cài dependency (nếu chưa): `npm install mqtt` trong thư mục deploy.
5. Tạo thư mục `releases` (hoặc cấu hình `RELEASES_DIR`), recycle Application Pool / restart site.

---

## 4. Kiểm tra sau khi deploy

1. **API OTA – publish theo device:**
   ```bash
   curl -X POST "https://your-domain/api/v1/ota/releases/1.0.0/publish" \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{"device_ids":["SL-2025-0001"]}'
   ```
   Trả về success và `mqtt_topic` dạng `ota/cm4/<device_id>/command`.

2. **API subscribed-devices** (chỉ có khi dùng Aedes + MQTT_STATS_URL):
   ```bash
   curl -H "Authorization: Bearer <JWT>" "https://your-domain/api/v1/ota/subscribed-devices"
   ```
   Trả về `device_ids`, `count` (hoặc rỗng nếu broker khác Aedes).

3. **Admin:** Đăng nhập → tab OTA → bấm **Push MQTT** một bản release → mở modal có: thiết bị đang sub (nếu có), “Gửi đến tất cả thiết bị”, chọn từng thiết bị, Broadcast.

---

## 5. Checklist deploy

- [ ] Backup code và `.env` trên server
- [ ] Copy `services/mqttOtaService.js`, `routes/ota.js`, `admin/admin.js`
- [ ] (iis-deploy) Copy thêm `models/Release.js`, sửa `server.js` và đồng bộ admin
- [ ] Thêm/sửa `.env`: `MQTT_OTA_TOPIC_PREFIX`, (tùy chọn) `MQTT_STATS_URL`
- [ ] Restart ứng dụng (PM2 / IIS / node)
- [ ] (Tùy chọn) Chạy Aedes: `node scripts/mqtt-broker-local.js`
- [ ] Test publish với `device_ids` và test modal OTA trong Admin
