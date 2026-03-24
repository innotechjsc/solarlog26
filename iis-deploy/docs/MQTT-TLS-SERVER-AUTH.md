# MQTT TLS (server-auth) - Port 8883

Muc tieu: backend va logger ket noi MQTT qua TLS (`mqtts://`) voi xac thuc username/password + cert server.

## 1) Broker

- Bat listener TLS `8883` tren broker (Mosquitto/EMQX/HiveMQ).
- Cai cert server hop le cho hostname MQTT (vi du `mqtt.sol.adtrade.site`).
- Tat anonymous, bat username/password + ACL topic.
- Mo firewall/security-group TCP `8883`.

## 2) Cau hinh backend (`.env`)

```env
MQTT_BROKER_URL=mqtts://mqtt.sol.adtrade.site:8883
MQTT_USERNAME=your-user
MQTT_PASSWORD=your-pass
MQTT_TLS_ENABLED=true
MQTT_TLS_REJECT_UNAUTHORIZED=true
MQTT_TLS_CA_FILE=/path/to/ca.pem
MQTT_TLS_SERVERNAME=mqtt.sol.adtrade.site
```

Ghi chu:
- `MQTT_TLS_ENABLED` mac dinh tu dong bat khi URL bat dau bang `mqtts://`.
- `MQTT_TLS_CA_FILE` co the bo trong neu he dieu hanh da trust root CA.
- `MQTT_TLS_REJECT_UNAUTHORIZED=false` chi dung de debug tam thoi, khong dung production.

## 3) Deploy / restart

```bash
npm install
pm2 restart ecosystem.config.js --env production
pm2 logs solarlogger-api --lines 50
```

## 4) Kiem tra nhanh

- `openssl s_client -connect mqtt.sol.adtrade.site:8883 -servername mqtt.sol.adtrade.site`
- Kiem tra backend log co dong `[MQTT OTA] Connected to mqtts://...` hoac `[MQTT telemetry] connected mqtts://...`
- Test publish/subscribe:
  - OTA command: `ota/cm4/<device_id>/command`
  - Telemetry: `<root>/<site_id>/<device_id>/telemetry/<kind>`

## 5) Migration khong downtime

1. Chay song song 1883 + 8883.
2. Chuyen backend sang 8883.
3. Chuyen logger theo lo.
4. Theo doi reconnect/auth fail.
5. Tat 1883 khi da on dinh.
