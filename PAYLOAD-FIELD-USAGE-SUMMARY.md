# 📋 Tóm tắt Sử dụng Field trong Payload 0.9.0

**Ngày**: 2026-01-06  
**Quick Reference**

---

## ✅ ĐANG SỬ DỤNG TỐT

| Field | Dashboard | Reports | Analytics |
|-------|-----------|---------|-----------|
| `online_inverters` / `total_inverters` | ✅ Stats | ❌ | ⚠️ |
| `total_ac_active_power_w` | ✅ Main | ✅ | ✅ |
| `inverter_efficiency_percent` | ✅ Stats | ✅ | ✅ |
| `alarm.count`, `alarm.data[]` | ✅ Alarms | ✅ | ✅ |
| `battery_storage.soc_percent` | ✅ Battery | ⚠️ | ⚠️ |

---

## ⚠️ SỬ DỤNG MỘT PHẦN (Cần cải thiện)

| Field | Đang dùng | Nên bổ sung |
|-------|-----------|-------------|
| `grid_interaction.import_active_power_w` | ⚠️ Tính toán | ✅ Widget riêng |
| `grid_interaction.export_active_power_w` | ⚠️ Tính toán | ✅ Widget riêng |
| `pv_input.pv_inputs[]` | ⚠️ Tổng | ✅ Chi tiết từng MPPT |
| `battery_storage.mode` | ⚠️ Tính toán | ✅ Widget hiển thị |
| `battery_storage.active_power_w` | ⚠️ Analytics | ✅ Dashboard widget |

---

## ❌ CHƯA SỬ DỤNG (Cần bổ sung)

### 3-Phase Measurements
- ❌ `ac_measurements.voltage_l1n_v`, `l2n_v`, `l3n_v` → ✅ **3-Phase Voltage Monitor**
- ❌ `ac_measurements.current_l1_a`, `l2_a`, `l3_a` → ✅ **3-Phase Current Monitor**
- ❌ `ac_measurements.inverter_ac_bus_active_power_l1_w`, `l2_w`, `l3_w` → ✅ **Phase Balance Report**
- ❌ `ac_measurements.inverter_ac_reactive_power_var` → ✅ **Power Factor Analysis**
- ❌ `ac_measurements.inverter_ac_apparent_power_va` → ✅ **Power Factor Analysis**

### Grid Interaction
- ❌ `grid_interaction.exchange_active_power_w` → ✅ **Grid Exchange Widget**
- ❌ `grid_interaction.import_energy_today_kwh` / `total_kwh` → ✅ **Daily Energy Exchange Report**
- ❌ `grid_interaction.export_energy_today_kwh` / `total_kwh` → ✅ **Daily Energy Exchange Report**
- ❌ `grid_interaction.zero_export_enabled` → ✅ **Zero Export Status Widget**
- ❌ `grid_interaction.export_power_limit_w` → ✅ **Configuration Display**
- ❌ `grid_interaction.frequency_hz` → ✅ **Grid Frequency Monitor & Alert**

### PV Input
- ❌ `pv_input.dc_bus_voltage_v` → ✅ **DC Bus Voltage Monitor**
- ❌ `pv_input.pv_inputs[].mppt` → ✅ **MPPT Selector**
- ❌ `pv_input.pv_inputs[].voltage_v`, `current_a`, `dc_power_w` → ✅ **MPPT Detailed Dashboard**

### Battery
- ❌ `battery_storage.voltage_v` → ✅ **Battery Health Monitor**
- ❌ `battery_storage.current_a` → ✅ **Battery Health Monitor**
- ❌ `battery_storage.soh_percent` → ✅ **Battery Health Report** (Priority 1!)
- ❌ `battery_storage.charge_limit_w` / `discharge_limit_w` → ✅ **Battery Configuration**

### Operating State
- ❌ `operating_state.work_mode` → ✅ **Operating State Dashboard**
- ❌ `operating_state.grid_mode` → ✅ **Grid Connection Status**

### Inverter Info
- ❌ `info.serial_number` → ✅ **Device Info Page**
- ❌ `info.model_name` → ✅ **Inverter Comparison Report**
- ❌ `info.inverter_type` → ✅ **Device Configuration**
- ❌ `info.rated_power_w` → ✅ **Capacity Utilization Report**
- ❌ `info.hw_version` → ✅ **Device Info**
- ❌ `info.protocol` → ✅ **System Info**

### Sign Convention
- ❌ `sign_convention.grid_exchange_active_power` → ✅ **UI Tooltip**
- ❌ `sign_convention.battery_dc_active_power` → ✅ **UI Tooltip**

### Thermal
- ❌ `thermal_hardware.inverter_temp_c` → ✅ **Temperature Monitor** (Priority 1!)
- ❌ `thermal_hardware.heatsink_temp_c` → ✅ **Temperature Monitor**
- ❌ `thermal_hardware.transformer_temp_c` → ✅ **Temperature Monitor**
- ❌ `thermal_hardware.ambient_temp_c` → ✅ **Ambient Temperature Analysis**

### Quality
- ❌ `quality.source` → ✅ **Data Source Indicator**
- ❌ `quality.device_online` → ✅ **Connection Status Widget**
- ❌ `quality.poll_interval_ms` → ✅ **System Info Display**

### Header
- ❌ `fw_version` → ✅ **Device Info Page**
- ❌ `schema_version` → ✅ **Device Details**

---

## 🎯 TOP PRIORITY (Cần bổ sung ngay)

1. ✅ **Battery SOH (State of Health)** - Quan trọng cho battery health tracking
2. ✅ **Temperature Monitor** - Quan trọng cho inverter protection
3. ✅ **Grid Frequency Monitor** - Quan trọng cho grid safety
4. ✅ **Operating State Dashboard** - Quan trọng để biết inverter status
5. ✅ **Inverter Status Widget** - Cải thiện monitoring

---

## 📊 Ví dụ: Field nào hiển thị ở báo cáo nào?

### Dashboard Overview
- `online_inverters` / `total_inverters` → **Stats card** (line 407-408)
- `total_ac_active_power_w` → **Total Power** (line 396-397)
- `inverter_efficiency_percent` → **Efficiency** (line 404-405)

### Dashboard Monitoring
- `power_flow` (schema cũ) → **Power Flow Chart** (monitoring.js line 167-172)
- `battery.soc` (schema cũ) → **Battery SOC** (line 502-503)

### Reports
- `daily_summaries.total_energy` → **Energy Report**
- `hourly_summaries.avg_power` → **Power Report**

### Analytics
- `grid_interaction.import/export` (tính toán) → **Energy Management** (analytics.js)
- `pv_input.pv_inputs[]` (tổng) → **Energy Management** (line 502)

---

## 🔍 Kiểm tra nhanh: Field có đang dùng không?

**Command để tìm:**
```bash
# Tìm field trong code
grep -r "online_inverters" backend-system/
grep -r "grid_exchange" backend-system/
grep -r "battery_storage" backend-system/
grep -r "thermal_hardware" backend-system/
grep -r "pv_input" backend-system/
```

**Kết quả:**
- `online_inverters`: ✅ Đã tìm thấy (dashboard/index.html, routes)
- `grid_exchange`: ❌ Chưa tìm thấy (chưa sử dụng)
- `battery_storage`: ⚠️ Một phần (routes/devices.js)
- `thermal_hardware`: ❌ Chưa tìm thấy (chưa sử dụng)
- `pv_input`: ⚠️ Một phần (routes/analytics.js - tính tổng)

---

**Xem chi tiết**: `PAYLOAD-ANALYSIS-REPORTS.md`

