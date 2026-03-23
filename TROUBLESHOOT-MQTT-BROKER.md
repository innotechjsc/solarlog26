# MQTT broker bị stop / errored – Cách kiểm tra và xử lý

Khi PM2 báo `mqtt-broker` có status **errored** (và số lần restart tăng), làm lần lượt các bước dưới.

---

## 1. Xem log lỗi (bắt buộc)

Trên server, chạy:

```bash
cd C:\Project\Solar\iis-deploy
pm2 logs mqtt-broker --lines 100
```

Hoặc chỉ log lỗi:

```bash
pm2 logs mqtt-broker --err --lines 100
```

Log sẽ cho biết lý do process thoát (module không tìm thấy, port bận, v.v.).

---

## 2. Các lỗi thường gặp và cách xử lý

### 2.1. `Error: Cannot find module 'aedes'`

**Nguyên nhân:** Thư mục đang chạy (ví dụ `iis-deploy`) chưa cài package `aedes`.

**Cách xử lý:**

```bash
cd C:\Project\Solar\iis-deploy
npm install aedes
pm2 restart mqtt-broker
```

Nếu dùng `backend-system`:

```bash
cd C:\Project\Solar\backend-system
npm install
pm2 restart mqtt-broker
```

---

### 2.2. `EADDRINUSE: address already in use :::1883` (hoặc 1884)

**Nguyên nhân:** Port 1883 (MQTT) hoặc 1884 (HTTP stats) đã bị process khác dùng (Mosquitto, instance broker cũ, v.v.).

**Cách xử lý:**

- **Cách 1 – Đổi port cho broker Node:**  
  Trong `.env` (hoặc biến môi trường PM2):

  ```env
  MQTT_PORT=1885
  MQTT_STATS_PORT=1886
  ```

  Sau đó cấu hình backend/app khác trỏ tới port mới (ví dụ `MQTT_BROKER_URL=mqtt://localhost:1885`, `MQTT_STATS_URL=http://localhost:1886`) và restart mqtt-broker + app.

- **Cách 2 – Giải phóng port:**  
  Tìm process đang chiếm 1883/1884 (Task Manager, `netstat -ano | findstr 1883`) rồi tắt process đó hoặc tắt dịch vụ Mosquitto nếu không cần.

---

### 2.3. Script không tồn tại / path sai

**Triệu chứng:** Log kiểu `Cannot find module '...'` hoặc PM2 báo script không chạy được.

**Kiểm tra:**

- PM2 đang start bằng lệnh gì (ví dụ `node scripts/mqtt-broker-local.js`) và **thư mục làm việc (cwd)** là đâu.
- Đảm bảo file tồn tại đúng path so với cwd, ví dụ:  
  `C:\Project\Solar\iis-deploy\scripts\mqtt-broker-local.js`

Nếu bạn chạy từ `iis-deploy` mà chưa có script:

- Copy `scripts/mqtt-broker-local.js` từ `backend-system` sang `iis-deploy\scripts\`.
- Trong `iis-deploy` cài đủ dependency (ít nhất `aedes`, `dotenv`):  
  `npm install aedes dotenv`

Sau đó:

```bash
pm2 delete mqtt-broker
cd C:\Project\Solar\iis-deploy
pm2 start scripts/mqtt-broker-local.js --name mqtt-broker
pm2 save
```

---

### 2.4. Lỗi khác (throw trong code, lỗi file .env)

- Đọc **dòng cuối** trong `pm2 logs mqtt-broker --err` để thấy stack trace hoặc message.
- Kiểm tra file `.env` (nếu script dùng `dotenv`): path tới `.env` đúng với **cwd** khi PM2 start (thường là thư mục chứa `package.json` / `scripts/`).

---

## 3. Kiểm tra sau khi sửa

```bash
pm2 restart mqtt-broker
pm2 logs mqtt-broker --lines 20
```

Nếu chạy đúng, log sẽ có dạng:

- `[MQTT Broker] Chạy trên port 1883 (mqtt://localhost:1883)`
- `[MQTT Broker] Stats HTTP port 1884 ...`

Kiểm tra port đang listen:

```bash
netstat -an | findstr "1883 1884"
```

---

## 4. Tóm tắt lệnh nhanh

| Mục đích              | Lệnh |
|-----------------------|------|
| Xem log lỗi           | `pm2 logs mqtt-broker --err --lines 100` |
| Xem log tổng hợp      | `pm2 logs mqtt-broker --lines 100` |
| Khởi động lại         | `pm2 restart mqtt-broker` |
| Cài thiếu dependency  | `npm install aedes dotenv` (trong đúng thư mục app) |
| Start lại từ script   | `pm2 start scripts/mqtt-broker-local.js --name mqtt-broker` |

Bước quan trọng nhất là chạy **`pm2 logs mqtt-broker --err --lines 100`** và dựa vào nội dung log để áp dụng đúng mục 2 ở trên.
