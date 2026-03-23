# IIS: Phục vụ file releases (tùy chọn)

File firmware có thể được tải bởi thiết bị qua **API** (đã có sẵn):

- `GET /api/v1/ota/latest` → metadata (version, url, checksum, size)
- `GET /api/v1/ota/releases/:version/file` → download file

URL trong metadata do backend sinh từ `OTA_BASE_URL` (vd `https://your-domain.com`). Không bắt buộc phải cấu hình IIS riêng cho thư mục releases.

Nếu bạn vẫn muốn **IIS phục vụ trực tiếp** thư mục releases (giảm tải cho API):

1. Tạo thư mục vật lý, ví dụ: `D:\releases`.
2. Cấu hình Backend: trong `.env` đặt `RELEASES_DIR=D:\releases` (và upload từ admin vẫn ghi vào đây nếu backend có quyền ghi).
3. Trong IIS:
   - Tạo **Virtual Directory** hoặc **Application** trỏ tới `D:\releases`.
   - Alias: `releases`.
   - Trong site chính (vd Default Web Site), URL sẽ là: `https://your-server/releases/v1.0.0/firmware.bin`.
4. Cập nhật `OTA_BASE_URL=https://your-server` để URL trong MQTT message trỏ tới IIS thay vì API.

Lưu ý: Nếu dùng API download (`/api/v1/ota/releases/:version/file`), backend đọc file từ `RELEASES_DIR` và stream — không cần bước IIS trên.
