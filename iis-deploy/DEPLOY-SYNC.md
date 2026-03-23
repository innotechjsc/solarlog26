# Đồng bộ `iis-deploy` từ `backend-system`

Thư mục **này** là bản dùng deploy IIS/server thật: giữ **cùng code** với `backend-system` (root), **không** copy `node_modules`, `.env`, `releases/`.

**Lần đồng bộ gần nhất:** toàn bộ nhóm dưới đã chạy từ `backend-system` (PowerShell trong mục *Lệnh đồng bộ lại*), gồm ingest **G1–G9** (`services/iot*.js`, `models/Iot*.js`, `docs/IOT-G1-G9-INGEST.md`).

## Đã copy (lần đồng bộ gần nhất)

| Nhóm | Nội dung |
|------|-----------|
| API | `routes/*.js` |
| Services | `services/*.js` |
| DB models | `models/*.js` |
| Middleware | `middleware/*.js` |
| Scripts | `scripts/*` |
| Frontend gói app | `admin/`, `dashboard/`, `reports/` |
| Cấu hình app | `server.js`, `swagger.yaml`, `package.json`, `package-lock.json`, `web.config`, `iisnode.yml`, `env.example`, `ecosystem.config.js` (nếu có) |
| Tài liệu / test | `docs/`, `__tests__/` |

## Trên server cần tự làm

1. **`.env`** — tạo từ `env.example`, **không** commit bí mật (MongoDB, JWT, API keys, `MQTT_*`, `CORS_ORIGIN`).
2. **Dependencies:** trong thư mục deploy chạy `npm ci` hoặc `npm install --production` (IIS thường dùng `node_modules` đầy đủ; nếu chỉ production có thể `--omit=dev` nếu chắc chắn không cần jest).  
   **Jest:** `package.json` có `testPathIgnorePatterns` bỏ qua đường dẫn `iis-deploy` — chạy `npm test` từ thư mục **`backend-system`** (cha), không chạy trong `iis-deploy`.
3. **Thư mục OTA:** tạo/ủy quyền `releases/` (hoặc `RELEASES_DIR` trỏ đúng path).
4. **MongoDB** — URI trùng môi trường.
5. **IIS:** trỏ site vào thư mục này, `web.config` + pool Node đúng phiên bản; restart sau khi copy.

## Lệnh đồng bộ lại (dev, PowerShell)

Chạy từ `backend-system`:

```powershell
$src = "."; $dst = ".\iis-deploy"
@("routes","services","models","middleware","scripts") | ForEach-Object {
  Copy-Item "$src\$_\*" "$dst\$_\" -Recurse -Force
}
"server.js","swagger.yaml","package.json","package-lock.json","env.example","web.config","iisnode.yml" | ForEach-Object {
  if (Test-Path "$src\$_") { Copy-Item "$src\$_" "$dst\$_" -Force }
}
Copy-Item "$src\docs\*" "$dst\docs\" -Recurse -Force
Copy-Item "$src\__tests__\*" "$dst\__tests__\" -Recurse -Force
Copy-Item "$src\admin\*" "$dst\admin\" -Recurse -Force
Copy-Item "$src\dashboard\*" "$dst\dashboard\" -Recurse -Force
Copy-Item "$src\reports\*" "$dst\reports\" -Recurse -Force
```

Sau đó nén/zcopy **cả thư mục `iis-deploy`** lên server (hoặc chỉ các file đổi — tùy quy trình).
