# 📊 Phân tích Payload 0.9.0 và Đề xuất Bổ sung Báo cáo

**Ngày phân tích**: 2026-01-06  
**Schema Version**: 0.9.0

## 🔍 Tổng quan

Tài liệu này phân tích các field trong payload schema 0.9.0, đánh giá mức độ sử dụng hiện tại trong dashboard/báo cáo, và đề xuất bổ sung các tính năng mới.

---

## 1. PHÂN TÍCH THEO TỪNG NHÓM FIELD

### 1.1. Header Fields

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `logger_id` | ✅ | Device tracking | - |
| `timestamp` | ✅ | Tất cả báo cáo | - |
| `timezone` | ⚠️ | Một phần | Hiển thị timezone trong reports |
| `fw_version` | ❌ | Chưa | Device info page |
| `schema_version` | ✅ | Backend validation | Hiển thị trong device details |

**Đề xuất:**
- ✅ Hiển thị `fw_version` trong Device Info page
- ✅ Hiển thị `schema_version` để biết format dữ liệu
- ✅ Sử dụng `timezone` để format thời gian đúng theo khu vực

---

### 1.2. System Level (`data.system`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `total_ac_active_power_w` | ✅ | Dashboard chính | - |
| `online_inverters` | ✅ | Dashboard stats | ✅ **Bổ sung: Inverter Status Widget** |
| `total_inverters` | ✅ | Dashboard stats | ✅ **Bổ sung: Inverter Health Report** |

**Phân tích:**
- ✅ `online_inverters` / `total_inverters` đang hiển thị trong dashboard chính (line 407-408 của dashboard/index.html)
- ⚠️ Chưa có báo cáo chi tiết về trạng thái inverter theo thời gian
- ⚠️ Chưa có alert khi `online_inverters < total_inverters`

**Đề xuất bổ sung:**
1. **Inverter Status Widget** - Widget hiển thị:
   - Online: X / Total: Y
   - Percentage: (X/Y) * 100%
   - Inverter nào đang offline
   - Thời gian offline

2. **Inverter Health Report**:
   - Số giờ inverter hoạt động / ngày
   - Tỷ lệ uptime của từng inverter
   - Lịch sử online/offline
   - Biểu đồ trạng thái theo thời gian

---

### 1.3. Inverter Info (`inverters[].info`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `modbus_address` | ⚠️ | Components API | ✅ **Inverter Details Page** |
| `serial_number` | ❌ | Chưa | ✅ Device Info, Reports |
| `model_name` | ⚠️ | Components API | ✅ Inverter Comparison Report |
| `inverter_type` | ❌ | Chưa | ✅ Device Configuration |
| `rated_power_w` | ❌ | Chưa | ✅ Capacity Utilization Report |
| `hw_version` | ❌ | Chưa | ✅ Device Info |
| `protocol` | ❌ | Chưa | ✅ System Info |

**Đề xuất bổ sung:**
1. **Inverter Details Page**:
   - Serial number, Model, Type, Rated power
   - Hardware version, Protocol
   - Thông tin cấu hình chi tiết

2. **Inverter Comparison Report**:
   - So sánh hiệu suất theo model
   - So sánh theo rated power
   - Phân loại theo inverter_type

3. **Capacity Utilization Report**:
   - `rated_power_w` vs `actual_power_w`
   - Tỷ lệ sử dụng công suất
   - Recommendation khi capacity < 50%

---

### 1.4. Operating State (`inverters[].operating_state`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `work_mode` | ❌ | Chưa | ✅ **Operating State Dashboard** |
| `grid_mode` | ❌ | Chưa | ✅ **Grid Connection Status** |

**Phân tích:**
- ⚠️ Hai field này quan trọng để biết inverter có đang hoạt động bình thường không
- ⚠️ `work_mode: "fault"` hoặc `grid_mode: "off_grid"` cần được cảnh báo

**Đề xuất bổ sung:**
1. **Operating State Dashboard**:
   - Widget hiển thị work_mode (normal/standby/fault) với màu sắc
   - Widget hiển thị grid_mode (on_grid/off_grid)
   - Alert khi có inverter ở chế độ fault
   - Lịch sử chuyển đổi giữa các mode

2. **Grid Connection Status Report**:
   - Thời gian on_grid vs off_grid
   - Lý do chuyển sang off_grid (nếu có)
   - Tần suất chuyển đổi

---

### 1.5. Sign Convention (`inverters[].sign_convention`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `grid_exchange_active_power` | ❌ | Chưa | ✅ **Backend validation & UI tooltip** |
| `battery_dc_active_power` | ❌ | Chưa | ✅ **Backend validation & UI tooltip** |

**Phân tích:**
- ⚠️ Field này quan trọng để hiểu ý nghĩa dấu công suất
- ⚠️ Hiện tại backend đã lưu nhưng chưa sử dụng để hiển thị

**Đề xuất bổ sung:**
1. **Tooltip/Info icon** trong dashboard:
   - Hiển thị sign convention khi hover vào power values
   - Giải thích: "Dương = nhập lưới" hoặc "Dương = sạc pin"

2. **Backend validation**:
   - Đảm bảo xử lý đúng dấu công suất theo sign_convention
   - Log warning nếu sign_convention không hợp lệ

---

### 1.6. AC Measurements (`inverters[].ac_measurements`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `voltage_l1n_v`, `voltage_l2n_v`, `voltage_l3n_v` | ❌ | Chưa | ✅ **3-Phase Voltage Monitor** |
| `current_l1_a`, `current_l2_a`, `current_l3_a` | ❌ | Chưa | ✅ **3-Phase Current Monitor** |
| `inverter_ac_bus_active_power_w` | ⚠️ | Gián tiếp | ✅ Power Dashboard |
| `inverter_ac_reactive_power_var` | ❌ | Chưa | ✅ **Power Factor Analysis** |
| `inverter_ac_apparent_power_va` | ❌ | Chưa | ✅ Power Factor Analysis |
| `inverter_ac_bus_active_power_l1_w`, `l2_w`, `l3_w` | ❌ | Chưa | ✅ **Phase Balance Report** |

**Phân tích:**
- ⚠️ Dashboard hiện tại chỉ hiển thị total power, chưa có chi tiết 3-phase
- ⚠️ Chưa có phân tích cân bằng pha (phase balance)
- ⚠️ Chưa có power factor analysis

**Đề xuất bổ sung:**
1. **3-Phase Voltage Monitor Widget**:
   - Hiển thị điện áp 3 pha: L1, L2, L3
   - Cảnh báo khi voltage imbalance > 5%
   - Biểu đồ voltage theo thời gian (3 đường)

2. **3-Phase Current Monitor Widget**:
   - Hiển thị dòng điện 3 pha
   - Cảnh báo khi current imbalance
   - Phân tích tải theo pha

3. **Phase Balance Report**:
   - So sánh công suất theo pha (L1, L2, L3)
   - Tính imbalance percentage
   - Recommendation để cân bằng tải

4. **Power Factor Analysis**:
   - Power Factor = Active Power / Apparent Power
   - Cảnh báo khi PF < 0.9
   - Report về reactive power consumption

---

### 1.7. Grid Interaction (`inverters[].grid_interaction`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `exchange_active_power_w` | ❌ | Chưa | ✅ **Grid Exchange Dashboard** |
| `import_active_power_w` | ⚠️ | Analytics (tính toán) | ✅ Grid Import/Export Widget |
| `export_active_power_w` | ⚠️ | Analytics (tính toán) | ✅ Grid Import/Export Widget |
| `import_energy_today_kwh` | ❌ | Chưa | ✅ **Daily Energy Exchange Report** |
| `import_energy_total_kwh` | ❌ | Chưa | ✅ Lifetime Energy Report |
| `export_energy_today_kwh` | ❌ | Chưa | ✅ Daily Energy Exchange Report |
| `export_energy_total_kwh` | ❌ | Chưa | ✅ Lifetime Energy Report |
| `zero_export_enabled` | ❌ | Chưa | ✅ **Zero Export Status Widget** |
| `export_power_limit_w` | ❌ | Chưa | ✅ Configuration Display |
| `frequency_hz` | ❌ | Chưa | ✅ **Grid Frequency Monitor** |

**Phân tích:**
- ⚠️ Đây là các field quan trọng cho energy management
- ⚠️ Hiện tại chỉ tính toán từ power_flow (schema cũ)
- ⚠️ Chưa có widget/biểu đồ riêng cho grid interaction

**Đề xuất bổ sung:**
1. **Grid Exchange Dashboard**:
   - Widget hiển thị: Import: X kW, Export: Y kW
   - Biểu đồ import/export theo thời gian
   - Net energy exchange (import - export)

2. **Daily Energy Exchange Report**:
   - Import energy today / total
   - Export energy today / total
   - Net energy (tiết kiệm/thừa)
   - So sánh với ngày trước

3. **Zero Export Status Widget**:
   - Hiển thị trạng thái zero export (enabled/disabled)
   - Cảnh báo nếu zero export bị tắt nhưng cần bật
   - Export limit hiển thị

4. **Grid Frequency Monitor**:
   - Hiển thị frequency_hz real-time
   - Cảnh báo khi frequency < 49.5 Hz hoặc > 50.5 Hz
   - Biểu đồ frequency theo thời gian
   - So sánh với tiêu chuẩn (50 Hz ± 0.5 Hz)

---

### 1.8. PV Input (`inverters[].pv_input`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `dc_bus_voltage_v` | ❌ | Chưa | ✅ **DC Bus Voltage Monitor** |
| `pv_inputs[]` (MPPT) | ⚠️ | Analytics (tổng) | ✅ **MPPT Detailed Dashboard** |
| `pv_inputs[].mppt` | ❌ | Chưa | MPPT selector |
| `pv_inputs[].voltage_v` | ❌ | Chưa | MPPT Performance Report |
| `pv_inputs[].current_a` | ❌ | Chưa | MPPT Performance Report |
| `pv_inputs[].dc_power_w` | ⚠️ | Analytics (tổng) | ✅ MPPT Comparison Report |

**Phân tích:**
- ⚠️ Hiện tại chỉ tính tổng power từ tất cả MPPT
- ⚠️ Chưa có phân tích riêng từng MPPT
- ⚠️ Chưa phát hiện MPPT bị lỗi (power = 0 khi có nắng)

**Đề xuất bổ sung:**
1. **MPPT Detailed Dashboard**:
   - Hiển thị từng MPPT: voltage, current, power
   - So sánh hiệu suất giữa các MPPT
   - Cảnh báo khi MPPT có vấn đề

2. **MPPT Performance Report**:
   - Hiệu suất từng MPPT theo thời gian
   - Tỷ lệ đóng góp của mỗi MPPT vào tổng sản lượng
   - Phân tích shading/performance degradation

3. **DC Bus Voltage Monitor**:
   - Hiển thị DC bus voltage
   - Cảnh báo khi voltage ngoài range bình thường
   - Correlation với PV power

---

### 1.9. Battery Storage (`inverters[].battery_storage`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `mode` | ⚠️ | Analytics (tính toán) | ✅ **Battery Mode Widget** |
| `active_power_w` | ⚠️ | Analytics | ✅ Battery Power Dashboard |
| `voltage_v` | ❌ | Chưa | ✅ Battery Health Monitor |
| `current_a` | ❌ | Chưa | Battery Health Monitor |
| `soc_percent` | ✅ | Dashboard (battery) | ✅ **SOC History Chart** |
| `soh_percent` | ❌ | Chưa | ✅ **Battery Health Report** |
| `energy_charge_today_kwh` | ⚠️ | Battery API | ✅ Daily Battery Report |
| `energy_discharge_today_kwh` | ⚠️ | Battery API | ✅ Daily Battery Report |
| `charge_limit_w` | ❌ | Chưa | Battery Configuration |
| `discharge_limit_w` | ❌ | Chưa | Battery Configuration |

**Phân tích:**
- ✅ SOC đã được sử dụng trong dashboard
- ⚠️ SOH (State of Health) chưa được sử dụng - rất quan trọng cho battery health
- ⚠️ Battery mode chưa được hiển thị rõ ràng

**Đề xuất bổ sung:**
1. **Battery Mode Widget**:
   - Icon/Status: Charge / Discharge / Idle
   - Active power với dấu (+ = charge, - = discharge)
   - Mode history timeline

2. **Battery Health Report**:
   - **SOH (State of Health)** - Sức khỏe pin (%)
   - **SOC History** - Lịch sử mức pin
   - **Charge/Discharge Cycles** - Số chu kỳ
   - **Voltage Range** - Min/Max voltage theo thời gian
   - **Capacity Degradation** - Xu hướng giảm dung lượng

3. **Daily Battery Report**:
   - Energy charged today / total
   - Energy discharged today / total
   - Net energy (charge - discharge)
   - Charge/discharge efficiency
   - Number of cycles today

4. **Battery Configuration Display**:
   - Charge limit (W)
   - Discharge limit (W)
   - So sánh với actual power

---

### 1.10. Load (`inverters[].load`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `active_power_w` | ⚠️ | Analytics (tính toán) | ✅ **Load Monitor Widget** |

**Phân tích:**
- ⚠️ Load power hiện tại được tính toán gián tiếp từ power flow
- ⚠️ Chưa có widget riêng hiển thị load power

**Đề xuất bổ sung:**
1. **Load Monitor Widget**:
   - Hiển thị load power real-time
   - So sánh với PV power (self-consumption)
   - Load profile theo giờ trong ngày
   - Peak load detection

---

### 1.11. Performance (`inverters[].performance`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `inverter_efficiency_percent` | ✅ | Dashboard stats | ✅ **Efficiency Trend Report** |

**Phân tích:**
- ✅ Efficiency đã hiển thị trong dashboard chính
- ⚠️ Chưa có phân tích xu hướng efficiency theo thời gian

**Đề xuất bổ sung:**
1. **Efficiency Trend Report**:
   - Biểu đồ efficiency theo thời gian
   - So sánh efficiency giữa các inverter
   - Correlation với temperature
   - Cảnh báo khi efficiency < threshold (ví dụ: < 90%)

---

### 1.12. Alarm (`inverters[].alarm`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `count` | ✅ | Dashboard | ✅ Alarm Count Widget |
| `data[]` | ✅ | Dashboard | ✅ **Enhanced Alarm Dashboard** |
| `data[].type` | ✅ | Backend (mapping) | ✅ Alarm Type Filter |
| `data[].code` | ✅ | Display | ✅ Alarm Code Search |
| `data[].text` | ✅ | Display | ✅ Alarm Description Search |
| `data[].first_seen_ts` | ✅ | Display | ✅ Alarm Timeline |
| `data[].last_seen_ts` | ✅ | Display | ✅ Alarm Duration |

**Phân tích:**
- ✅ Alarm đã được xử lý và hiển thị
- ⚠️ Chưa có alarm analytics chi tiết

**Đề xuất bổ sung:**
1. **Enhanced Alarm Dashboard**:
   - Alarm timeline (first_seen_ts → last_seen_ts)
   - Alarm duration calculation
   - Alarm frequency analysis
   - Most common alarms report

2. **Alarm Analytics**:
   - Alarm by type (warning/error)
   - Alarm by inverter
   - Alarm trend (tăng/giảm theo thời gian)
   - Resolution time tracking

---

### 1.13. Thermal Hardware (`inverters[].thermal_hardware`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `inverter_temp_c` | ❌ | Chưa | ✅ **Temperature Monitor Dashboard** |
| `heatsink_temp_c` | ❌ | Chưa | ✅ Temperature Monitor |
| `transformer_temp_c` | ❌ | Chưa | Temperature Monitor |
| `ambient_temp_c` | ❌ | Chưa | ✅ **Ambient Temperature Analysis** |

**Phân tích:**
- ⚠️ Nhiệt độ là chỉ số quan trọng cho inverter health
- ⚠️ Chưa có monitoring nhiệt độ nào

**Đề xuất bổ sung:**
1. **Temperature Monitor Dashboard**:
   - Inverter temperature
   - Heatsink temperature
   - Transformer temperature (nếu có)
   - Ambient temperature
   - Temperature difference (inverter - ambient)
   - Cảnh báo khi temperature > threshold (ví dụ: > 60°C)

2. **Temperature Trend Report**:
   - Biểu đồ nhiệt độ theo thời gian
   - Correlation với power output
   - Cooling efficiency analysis
   - Temperature vs Efficiency correlation

---

### 1.14. Quality (`inverters[].quality`)

| Field | Đang sử dụng | Sử dụng ở đâu | Cần bổ sung |
|-------|--------------|---------------|-------------|
| `source` | ❌ | Chưa | ✅ **Data Source Indicator** |
| `device_online` | ❌ | Chưa | ✅ Connection Status Widget |
| `poll_interval_ms` | ❌ | Chưa | ✅ System Info Display |

**Phân tích:**
- ⚠️ Quality data giúp đánh giá độ tin cậy dữ liệu
- ⚠️ Chưa được sử dụng trong dashboard

**Đề xuất bổ sung:**
1. **Data Source Indicator**:
   - Hiển thị source: modbus / iec104 / cache
   - Cảnh báo khi source = "cache" (dữ liệu cũ)
   - Indicator màu: green (modbus) / yellow (cache)

2. **Connection Status Widget**:
   - `device_online`: true/false
   - Last poll time
   - Poll interval
   - Connection reliability %

3. **Data Quality Report**:
   - Tỷ lệ dữ liệu từ cache vs real-time
   - Connection uptime %
   - Data gaps detection

---

## 2. TỔNG HỢP ĐỀ XUẤT BỔ SUNG

### 2.1. Dashboard Widgets Cần Thêm

1. ✅ **Inverter Status Widget**
   - Online/Total inverters
   - Health percentage
   - Offline inverter list

2. ✅ **Grid Exchange Widget**
   - Import/Export power
   - Net energy exchange
   - Zero export status

3. ✅ **Battery Mode Widget**
   - Charge/Discharge/Idle status
   - Active power
   - SOC display

4. ✅ **3-Phase Voltage Monitor**
   - L1, L2, L3 voltage
   - Imbalance detection

5. ✅ **Temperature Monitor**
   - Inverter, Heatsink, Ambient temperature
   - Temperature alerts

6. ✅ **Data Quality Indicator**
   - Source (modbus/cache)
   - Connection status
   - Poll interval

---

### 2.2. Báo cáo Cần Thêm

1. ✅ **Inverter Health Report**
   - Uptime per inverter
   - Operating mode history
   - Performance comparison

2. ✅ **Grid Interaction Report**
   - Import/Export energy daily/total
   - Grid frequency analysis
   - Zero export compliance

3. ✅ **Battery Health Report**
   - SOH (State of Health) tracking
   - SOC history
   - Charge/discharge cycles
   - Capacity degradation

4. ✅ **MPPT Performance Report**
   - Performance per MPPT
   - Shading analysis
   - MPPT comparison

5. ✅ **Phase Balance Report**
   - L1, L2, L3 power comparison
   - Imbalance percentage
   - Load distribution

6. ✅ **Temperature Analysis Report**
   - Temperature trends
   - Correlation with power/efficiency
   - Cooling effectiveness

7. ✅ **Power Factor Analysis Report**
   - Active/Reactive/Apparent power
   - Power factor trends
   - Reactive power consumption

---

### 2.3. Tính năng Cảnh báo Cần Thêm

1. ✅ **Inverter Offline Alert**
   - Khi `online_inverters < total_inverters`

2. ✅ **Inverter Fault Alert**
   - Khi `work_mode = "fault"`

3. ✅ **Grid Offline Alert**
   - Khi `grid_mode = "off_grid"`

4. ✅ **Battery Health Alert**
   - Khi `soh_percent < 80%`

5. ✅ **Temperature Alert**
   - Khi `inverter_temp_c > 60°C`

6. ✅ **Grid Frequency Alert**
   - Khi `frequency_hz < 49.5` hoặc `> 50.5`

7. ✅ **Voltage Imbalance Alert**
   - Khi imbalance > 5%

8. ✅ **Power Factor Alert**
   - Khi PF < 0.9

9. ✅ **MPPT Failure Alert**
   - Khi MPPT có power = 0 khi có nắng

10. ✅ **Data Quality Alert**
    - Khi source = "cache" quá lâu
    - Khi `device_online = false`

---

## 3. ƯU TIÊN TRIỂN KHAI

### Priority 1 (Cao - Ảnh hưởng vận hành)
1. ✅ Inverter Status Widget
2. ✅ Inverter Fault Alert
3. ✅ Battery Health Report (SOH)
4. ✅ Temperature Monitor & Alert
5. ✅ Grid Frequency Monitor & Alert

### Priority 2 (Trung bình - Cải thiện hiệu quả)
1. ✅ Grid Exchange Dashboard
2. ✅ 3-Phase Voltage/Current Monitor
3. ✅ MPPT Performance Report
4. ✅ Phase Balance Report
5. ✅ Data Quality Indicator

### Priority 3 (Thấp - Nice to have)
1. ✅ Power Factor Analysis
2. ✅ Ambient Temperature Analysis
3. ✅ Enhanced Alarm Analytics
4. ✅ Temperature Trend Report

---

## 4. KẾT LUẬN

### Tóm tắt sử dụng hiện tại:
- ✅ **Đang sử dụng tốt**: Basic power, energy, efficiency, alarm count
- ⚠️ **Sử dụng một phần**: Battery SOC, Grid import/export (tính toán)
- ❌ **Chưa sử dụng**: 3-phase measurements, MPPT details, Thermal data, Quality data, Sign convention

### Lợi ích khi bổ sung:
1. **Vận hành tốt hơn**: Phát hiện sớm các vấn đề (temperature, fault, imbalance)
2. **Hiệu quả cao hơn**: Tối ưu hóa dựa trên MPPT performance, phase balance
3. **Bảo trì tốt hơn**: Battery health tracking, inverter uptime analysis
4. **Giám sát tốt hơn**: Grid interaction, data quality, connection status

---

**Next Steps:**
1. Tạo issue/task cho từng đề xuất
2. Ưu tiên theo Priority 1, 2, 3
3. Thiết kế UI/UX cho các widget mới
4. Implement backend API endpoints
5. Implement frontend dashboard/reports

