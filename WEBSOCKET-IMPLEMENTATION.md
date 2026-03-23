# 🔌 WebSocket Implementation Guide

**Ngày**: 2026-01-06

---

## 📋 Vấn đề hiện tại

### 1. Quá nhiều API calls
- **Vấn đề**: Dashboard gọi `/devices` nhiều lần (mỗi function gọi 1 lần)
- **Vấn đề**: Loop qua từng device gọi API riêng cho mỗi device
- **Ví dụ**: Với 10 devices, có thể lên đến 76+ requests khi load trang!

### 2. Polling thay vì Real-time
- **Vấn đề**: Dashboard phải polling mỗi 5 phút để refresh data
- **Vấn đề**: Notifications phải polling để lấy mới
- **Vấn đề**: Rate limiting do quá nhiều requests

---

## ✅ Giải pháp

### 1. WebSocket với Socket.IO
- ✅ Real-time updates không cần polling
- ✅ Push notifications khi có alarm mới
- ✅ Giảm số lượng HTTP requests

### 2. Aggregation Endpoint
- ✅ `/api/v1/dashboard/overview` - Trả về tất cả overview data trong 1 request
- ✅ Giảm từ 76 requests xuống còn 1 request!

---

## 🚀 Implementation

### Bước 1: Cài đặt Socket.IO

```bash
cd backend-system
npm install socket.io
```

### Bước 2: Cập nhật `server.js`

Thêm vào đầu file:
```javascript
const http = require('http');
const websocketService = require('./services/websocketService');
const dashboardRoutes = require('./routes/dashboard');
```

Thay đổi `app.listen()` thành:
```javascript
// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
websocketService.initialize(server);

// Register dashboard routes
app.use('/api', dashboardRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`SolarLogger Backend API server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
  // ... rest of code
});
```

### Bước 3: Cập nhật `routes/data.js`

Thêm sau khi tạo alarm:
```javascript
const websocketService = require('../services/websocketService');

// ... trong POST /api/v1/data handler, sau khi save alarm:

// Emit alarm via WebSocket
if (alarm && device) {
  websocketService.emitAlarm(
    {
      alarm_code: alarm.alarm_code,
      severity: alarm.severity,
      description: alarm.description,
      device_id: device_id,
      start_time: alarm.start_time
    },
    device_id,
    device.area_id
  );
}
```

### Bước 4: Cập nhật Frontend

Thêm vào `dashboard/overview.html`:
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script>
// Initialize WebSocket
const socket = io('http://localhost:5023', {
  transports: ['websocket', 'polling']
});

// Subscribe to dashboard updates
socket.emit('subscribe', {
  project_id: null, // or specific project_id
  area_id: null,    // or specific area_id
  device_id: null   // or specific device_id
});

// Listen for dashboard data updates
socket.on('dashboard_data', (data) => {
  console.log('Dashboard data update:', data);
  if (window.overviewDashboard) {
    window.overviewDashboard.updateFromWebSocket(data.data);
  }
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // Update notification badge
  if (window.navbar) {
    window.navbar.loadNotifications();
  }
});

// Listen for alarms
socket.on('alarm', (data) => {
  console.log('New alarm:', data);
  // Update alarms
  if (window.overviewDashboard) {
    window.overviewDashboard.loadAlerts();
  }
});
</script>
```

### Bước 5: Cập nhật `overview.js`

Thêm method mới:
```javascript
async loadData() {
  try {
    // Try to use aggregation endpoint first (single request!)
    try {
      const response = await this.fetchWithRetry(`${this.API_BASE}/dashboard/overview`);
      if (response && response.status === 'success') {
        this.updateFromAggregation(response.data);
        return; // Success! Exit early
      }
    } catch (error) {
      console.warn('Aggregation endpoint failed, falling back to individual calls:', error);
    }

    // Fallback to individual calls (old way)
    await this.loadDataIndividual();
  } catch (error) {
    console.error('Error loading overview data:', error);
  }
}

updateFromAggregation(data) {
  // Update all widgets from aggregated data
  // Revenue
  if (data.revenue) {
    document.getElementById('revenueToday').textContent = this.formatCurrency(data.revenue.today);
    document.getElementById('totalRevenue').textContent = this.formatCurrency(data.revenue.lifetime);
  }

  // Energy
  if (data.energy) {
    document.getElementById('energyToday').textContent = data.energy.today.toFixed(1);
    document.getElementById('totalEnergy').textContent = (data.energy.lifetime / 1000).toFixed(1);
  }

  // Battery
  if (data.battery) {
    document.getElementById('chargeToday').textContent = data.battery.charge_today.toFixed(1);
    document.getElementById('dischargeToday').textContent = data.battery.discharge_today.toFixed(1);
    
    // Battery Health
    const sohEl = document.getElementById('batterySOH');
    const socEl = document.getElementById('batterySOC');
    if (sohEl && data.battery.avg_soh !== null) {
      sohEl.textContent = data.battery.avg_soh.toFixed(1);
      sohEl.style.color = data.battery.avg_soh >= 80 ? '#4caf50' : 
                          data.battery.avg_soh >= 60 ? '#ff9800' : '#f44336';
    }
    if (socEl && data.battery.avg_soc !== null) {
      socEl.textContent = `SOC: ${data.battery.avg_soc.toFixed(1)}%`;
    }
  }

  // Inverter Status
  if (data.inverter_status) {
    const statusEl = document.getElementById('inverterStatus');
    const healthEl = document.getElementById('inverterHealthPercent');
    if (statusEl) {
      statusEl.textContent = `${data.inverter_status.online} / ${data.inverter_status.total}`;
    }
    if (healthEl) {
      healthEl.textContent = `Tỷ lệ: ${data.inverter_status.health_percent}%`;
      const healthPercent = parseFloat(data.inverter_status.health_percent);
      healthEl.style.color = healthPercent >= 90 ? '#4caf50' : 
                             healthPercent >= 70 ? '#ff9800' : '#f44336';
    }
  }

  // Temperature
  if (data.temperature) {
    const tempEl = document.getElementById('inverterTemp');
    const ambientEl = document.getElementById('ambientTemp');
    if (tempEl && data.temperature.inverter !== null) {
      tempEl.textContent = data.temperature.inverter.toFixed(1);
      const temp = data.temperature.inverter;
      tempEl.style.color = temp <= 50 ? '#4caf50' : temp <= 60 ? '#ff9800' : '#f44336';
    }
    if (ambientEl && data.temperature.ambient !== null) {
      ambientEl.textContent = `Môi trường: ${data.temperature.ambient.toFixed(1)}°C`;
    }
  }

  // Grid Frequency
  if (data.grid_frequency) {
    const freqEl = document.getElementById('gridFrequency');
    const statusEl = document.getElementById('gridFrequencyStatus');
    if (freqEl && data.grid_frequency.value !== null) {
      freqEl.textContent = data.grid_frequency.value.toFixed(2);
      const isNormal = data.grid_frequency.status === 'normal';
      freqEl.style.color = isNormal ? '#4caf50' : '#f44336';
      if (statusEl) {
        statusEl.textContent = isNormal ? 'Bình thường' : 'Cảnh báo';
        statusEl.style.color = isNormal ? '#4caf50' : '#f44336';
      }
    }
  }

  // Operating State
  if (data.operating_state) {
    this.renderOperatingState(data.operating_state);
  }

  // Alarms
  if (data.alarms) {
    document.getElementById('alertCount').textContent = data.alarms.total;
    document.getElementById('alertCritical').textContent = data.alarms.breakdown.CRITICAL || 0;
    document.getElementById('alertMajor').textContent = data.alarms.breakdown.MAJOR || 0;
    document.getElementById('alertMinor').textContent = data.alarms.breakdown.MINOR || 0;
    document.getElementById('alertWarning').textContent = data.alarms.breakdown.WARNING || 0;
    this.renderAlertGauge(data.alarms);
  }

  // Plant Status
  if (data.plant_status) {
    document.getElementById('plantCount').textContent = data.plant_status.total;
    document.getElementById('plantNormal').textContent = data.plant_status.normal;
    document.getElementById('plantError').textContent = data.plant_status.error;
    document.getElementById('plantDisconnected').textContent = data.plant_status.disconnected;
    this.renderPlantGauge(data.plant_status);
  }

  // Environmental
  if (data.environmental) {
    document.getElementById('coalSaved').textContent = data.environmental.coal_saved.toFixed(2);
    document.getElementById('co2Avoided').textContent = data.environmental.co2_avoided.toFixed(2);
    document.getElementById('treesEquivalent').textContent = data.environmental.trees_equivalent;
  }
}

updateFromWebSocket(data) {
  // Update from WebSocket real-time updates
  this.updateFromAggregation(data);
}

renderOperatingState(operatingState) {
  const gridEl = document.getElementById('operatingStateGrid');
  if (!gridEl || !operatingState) return;

  const workMode = operatingState.work_mode || {};
  const gridMode = operatingState.grid_mode || {};

  gridEl.innerHTML = `
    <div class="state-item normal">
      <div class="state-label">Work Mode: Normal</div>
      <div class="state-value">${workMode.normal || 0}</div>
      <div class="state-count">Inverter</div>
    </div>
    <div class="state-item standby">
      <div class="state-label">Work Mode: Standby</div>
      <div class="state-value">${workMode.standby || 0}</div>
      <div class="state-count">Inverter</div>
    </div>
    <div class="state-item fault">
      <div class="state-label">Work Mode: Fault</div>
      <div class="state-value">${workMode.fault || 0}</div>
      <div class="state-count">Inverter</div>
    </div>
    <div class="state-item on-grid">
      <div class="state-label">Grid Mode: On Grid</div>
      <div class="state-value">${gridMode.on_grid || 0}</div>
      <div class="state-count">Inverter</div>
    </div>
    <div class="state-item off-grid">
      <div class="state-label">Grid Mode: Off Grid</div>
      <div class="state-value">${gridMode.off_grid || 0}</div>
      <div class="state-count">Inverter</div>
    </div>
  `;
}

// Rename old loadData to loadDataIndividual (fallback)
async loadDataIndividual() {
  // ... existing code with individual calls
}
```

---

## 📊 So sánh

### Trước (Old Way):
- **76+ requests** khi load dashboard
- **Polling** mỗi 5 phút
- **Rate limiting** issues
- **Chậm** do quá nhiều requests

### Sau (New Way):
- **1 request** khi load dashboard (`/dashboard/overview`)
- **Real-time** updates qua WebSocket
- **Không rate limiting** issues
- **Nhanh** hơn nhiều

---

## 🔌 WebSocket Events

### Client → Server:
- `subscribe` - Subscribe to updates
- `unsubscribe` - Unsubscribe from updates

### Server → Client:
- `dashboard_data` - Aggregated dashboard data
- `notification` - New notification
- `alarm` - New alarm
- `device_update` - Device data update

---

## ⚠️ Lưu ý

1. **Socket.IO version**: Sử dụng version 4.x cho compatibility
2. **CORS**: Đảm bảo CORS cho WebSocket
3. **Fallback**: Giữ fallback cho các trình duyệt không support WebSocket
4. **Reconnection**: Socket.IO tự động reconnect khi mất kết nối

---

## 🚀 Testing

1. **Install dependencies**:
```bash
npm install socket.io
```

2. **Update server.js** (theo hướng dẫn trên)

3. **Update frontend** (theo hướng dẫn trên)

4. **Test WebSocket**:
- Mở browser console
- Check "WebSocket connected" message
- Send test alarm để test real-time notification

---

**Tác giả**: AI Assistant  
**Ngày**: 2026-01-06

