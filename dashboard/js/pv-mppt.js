// PV Input MPPT Dashboard
class PVMPPTDashboard {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.currentDeviceId = null;
    this.autoRefreshInterval = null;
    this.charts = {};
    this.init();
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  async init() {
    await this.loadDevices();
    this.setupEventListeners();
    
    // Setup WebSocket if available
    if (window.webSocketClient) {
      this.setupWebSocketListeners();
    }
  }

  setupEventListeners() {
    document.getElementById('deviceSelect')?.addEventListener('change', (e) => {
      if (e.target.value) {
        this.currentDeviceId = e.target.value;
        this.loadData();
      }
    });

    document.getElementById('periodSelect')?.addEventListener('change', () => {
      if (this.currentDeviceId) {
        this.loadData();
      }
    });
  }

  setupWebSocketListeners() {
    if (!window.webSocketClient) return;
    
    window.webSocketClient.on('dashboard_data', (data) => {
      if (data.device_id === this.currentDeviceId) {
        this.updateRealtimeData(data);
      }
    });
  }

  async loadDevices() {
    try {
      const response = await fetch(`${this.API_BASE}/devices`);
      const result = await response.json();
      
      if (result.status === 'success' && result.devices) {
        const select = document.getElementById('deviceSelect');
        select.innerHTML = '<option value="">Chọn thiết bị...</option>';
        
        result.devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.device_id;
          option.textContent = `${device.device_id} - ${device.site_name || 'Unknown'}`;
          select.appendChild(option);
        });
        
        // Auto-select first device
        if (result.devices.length > 0) {
          select.value = result.devices[0].device_id;
          this.currentDeviceId = result.devices[0].device_id;
          this.loadData();
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      this.showError('Không thể tải danh sách thiết bị: ' + error.message);
    }
  }

  async loadData() {
    if (!this.currentDeviceId) {
      this.showError('Vui lòng chọn thiết bị');
      return;
    }

    try {
      // Load realtime data
      await this.loadRealtimeData();
      
      // Load historical data
      await this.loadHistoricalData();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Không thể tải dữ liệu: ' + error.message);
    }
  }

  async loadRealtimeData() {
    try {
      const response = await fetch(`${this.API_BASE}/devices/${this.currentDeviceId}/realtime`);
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        this.renderRealtimeData(result.data);
      }
    } catch (error) {
      console.error('Error loading realtime data:', error);
    }
  }

  async loadHistoricalData() {
    try {
      const period = document.getElementById('periodSelect').value;
      const end = Math.floor(Date.now() / 1000);
      let start = end;
      
      switch (period) {
        case '1hour':
          start = end - (60 * 60);
          break;
        case '6hours':
          start = end - (6 * 60 * 60);
          break;
        case '24hours':
          start = end - (24 * 60 * 60);
          break;
        case '7days':
          start = end - (7 * 24 * 60 * 60);
          break;
      }

      const response = await fetch(
        `${this.API_BASE}/devices/${this.currentDeviceId}/history?start=${start}&end=${end}&interval=5min`
      );
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        this.renderHistoricalCharts(result.data);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  renderRealtimeData(data) {
    const contentArea = document.getElementById('contentArea');
    
    // Get first inverter with PV input (v0.9.0 schema)
    let pvInput = null;
    
    if (data.inverters && data.inverters.length > 0) {
      const inverter = data.inverters[0];
      if (inverter.pv_input) {
        pvInput = inverter.pv_input;
      }
    }

    if (!pvInput) {
      contentArea.innerHTML = '<div class="error">Không có dữ liệu PV input (cần payload v0.9.0)</div>';
      return;
    }

    const dcBusVoltage = pvInput.dc_bus_voltage_v || 0;
    const pvInputs = pvInput.pv_inputs || [];
    
    // Calculate totals
    const totalPower = pvInputs.reduce((sum, input) => sum + (input.dc_power_w || 0), 0);
    const activeInputs = pvInputs.filter(input => (input.dc_power_w || 0) > 0);
    const avgVoltage = activeInputs.length > 0 
      ? activeInputs.reduce((sum, input) => sum + (input.voltage_v || 0), 0) / activeInputs.length 
      : 0;
    const avgCurrent = activeInputs.length > 0
      ? activeInputs.reduce((sum, input) => sum + (input.current_a || 0), 0) / activeInputs.length
      : 0;

    // Calculate efficiency for each MPPT
    const mpptCards = pvInputs.map((input, index) => {
      const power = input.dc_power_w || 0;
      const voltage = input.voltage_v || 0;
      const current = input.current_a || 0;
      const isActive = power > 0;
      
      // Calculate efficiency (power / (voltage * current))
      const theoreticalPower = voltage * current;
      const efficiency = theoreticalPower > 0 ? (power / theoreticalPower) * 100 : 0;
      
      let efficiencyClass = 'low';
      if (efficiency >= 95) efficiencyClass = 'high';
      else if (efficiency >= 85) efficiencyClass = 'medium';

      return `
        <div class="mppt-card ${isActive ? '' : 'inactive'}">
          <h3>
            <span>☀️</span>
            MPPT ${input.mppt || (index + 1)}
            ${!isActive ? '<span style="font-size: 12px; color: #999;">(Không hoạt động)</span>' : ''}
          </h3>
          <div class="mppt-metrics">
            <div class="metric-item">
              <div class="metric-label">Điện áp</div>
              <div class="metric-value">${voltage.toFixed(1)}<span class="metric-unit">V</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Dòng điện</div>
              <div class="metric-value">${current.toFixed(2)}<span class="metric-unit">A</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Công suất</div>
              <div class="metric-value">${(power / 1000).toFixed(2)}<span class="metric-unit">kW</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Hiệu suất</div>
              <div class="metric-value">${efficiency.toFixed(1)}<span class="metric-unit">%</span></div>
              <div class="efficiency-badge ${efficiencyClass}">
                ${efficiencyClass === 'high' ? 'Tốt' : efficiencyClass === 'medium' ? 'Trung bình' : 'Thấp'}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="label">Tổng công suất PV</div>
          <div class="value">${(totalPower / 1000).toFixed(2)}<span class="unit">kW</span></div>
        </div>
        <div class="stat-card">
          <div class="label">Điện áp DC Bus</div>
          <div class="value">${dcBusVoltage.toFixed(1)}<span class="unit">V</span></div>
        </div>
        <div class="stat-card">
          <div class="label">MPPT đang hoạt động</div>
          <div class="value">${activeInputs.length}<span class="unit">/${pvInputs.length}</span></div>
        </div>
        <div class="stat-card">
          <div class="label">Điện áp trung bình</div>
          <div class="value">${avgVoltage.toFixed(1)}<span class="unit">V</span></div>
        </div>
        <div class="stat-card">
          <div class="label">Dòng điện trung bình</div>
          <div class="value">${avgCurrent.toFixed(2)}<span class="unit">A</span></div>
        </div>
      </div>

      <!-- MPPT Cards -->
      <div class="mppt-grid">
        ${mpptCards}
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <h2>Biểu đồ theo thời gian</h2>
        <div class="chart-container">
          <canvas id="powerChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="voltageChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="efficiencyChart"></canvas>
        </div>
      </div>
    `;

    contentArea.innerHTML = html;
  }

  renderHistoricalCharts(data) {
    if (!data || data.length === 0) return;

    const timestamps = data.map(d => new Date(d.timestamp).toLocaleTimeString('vi-VN'));
    
    // Extract MPPT data
    const mpptData = {};
    const maxMppts = 4; // Assume max 4 MPPTs
    
    // Initialize arrays for each MPPT
    for (let i = 1; i <= maxMppts; i++) {
      mpptData[i] = {
        power: [],
        voltage: [],
        efficiency: []
      };
    }

    data.forEach(dp => {
      if (dp.inverters && dp.inverters.length > 0) {
        const inv = dp.inverters[0];
        if (inv.pv_input && inv.pv_input.pv_inputs) {
          inv.pv_input.pv_inputs.forEach(input => {
            const mpptNum = input.mppt || 1;
            const power = (input.dc_power_w || 0) / 1000;
            const voltage = input.voltage_v || 0;
            const current = input.current_a || 0;
            const theoreticalPower = voltage * current;
            const efficiency = theoreticalPower > 0 ? (input.dc_power_w / theoreticalPower) * 100 : 0;
            
            if (mpptData[mpptNum]) {
              mpptData[mpptNum].power.push(power);
              mpptData[mpptNum].voltage.push(voltage);
              mpptData[mpptNum].efficiency.push(efficiency);
            }
          });
        }
      }
      
      // Fill missing data with zeros
      for (let i = 1; i <= maxMppts; i++) {
        if (mpptData[i].power.length < timestamps.length) {
          mpptData[i].power.push(0);
          mpptData[i].voltage.push(0);
          mpptData[i].efficiency.push(0);
        }
      }
    });

    const colors = ['#f44336', '#4caf50', '#2196f3', '#ff9800'];
    
    // Power Chart
    const powerDatasets = [];
    for (let i = 1; i <= maxMppts; i++) {
      if (mpptData[i].power.some(p => p > 0)) {
        powerDatasets.push({
          label: `MPPT ${i} (kW)`,
          data: mpptData[i].power,
          borderColor: colors[i - 1],
          backgroundColor: colors[i - 1] + '20',
          tension: 0.4
        });
      }
    }
    
    this.renderChart('powerChart', {
      labels: timestamps,
      datasets: powerDatasets
    }, 'Công suất MPPT (kW)');

    // Voltage Chart
    const voltageDatasets = [];
    for (let i = 1; i <= maxMppts; i++) {
      if (mpptData[i].voltage.some(v => v > 0)) {
        voltageDatasets.push({
          label: `MPPT ${i} (V)`,
          data: mpptData[i].voltage,
          borderColor: colors[i - 1],
          backgroundColor: colors[i - 1] + '20',
          tension: 0.4
        });
      }
    }
    
    this.renderChart('voltageChart', {
      labels: timestamps,
      datasets: voltageDatasets
    }, 'Điện áp MPPT (V)');

    // Efficiency Chart
    const efficiencyDatasets = [];
    for (let i = 1; i <= maxMppts; i++) {
      if (mpptData[i].efficiency.some(e => e > 0)) {
        efficiencyDatasets.push({
          label: `MPPT ${i} (%)`,
          data: mpptData[i].efficiency,
          borderColor: colors[i - 1],
          backgroundColor: colors[i - 1] + '20',
          tension: 0.4
        });
      }
    }
    
    this.renderChart('efficiencyChart', {
      labels: timestamps,
      datasets: efficiencyDatasets
    }, 'Hiệu suất MPPT (%)');
  }

  renderChart(canvasId, chartData, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(canvas, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16 }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  updateRealtimeData(data) {
    if (data.device_id === this.currentDeviceId) {
      this.loadRealtimeData();
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => {
      if (this.currentDeviceId) {
        this.loadRealtimeData();
      }
    }, 30000);
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
}

// Global functions
let dashboard;

function loadData() {
  if (dashboard) dashboard.loadData();
}

function startAutoRefresh() {
  if (dashboard) dashboard.startAutoRefresh();
}

function stopAutoRefresh() {
  if (dashboard) dashboard.stopAutoRefresh();
}

document.addEventListener('DOMContentLoaded', () => {
  dashboard = new PVMPPTDashboard();
});
