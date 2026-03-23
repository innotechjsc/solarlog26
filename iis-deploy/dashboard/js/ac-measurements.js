// 3-Phase AC Measurements Dashboard
class ACMeasurementsDashboard {
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
    
    // Get first inverter with AC measurements (v0.9.0 schema)
    let acMeasurements = null;
    let isNewSchema = false;
    
    if (data.inverters && data.inverters.length > 0) {
      const inverter = data.inverters[0];
      if (inverter.ac_measurements) {
        acMeasurements = inverter.ac_measurements;
        isNewSchema = true;
      }
    }

    if (!acMeasurements) {
      contentArea.innerHTML = '<div class="error">Không có dữ liệu AC measurements (cần payload v0.9.0)</div>';
      return;
    }

    // Calculate phase imbalance
    const voltages = [
      acMeasurements.voltage_l1n_v || 0,
      acMeasurements.voltage_l2n_v || 0,
      acMeasurements.voltage_l3n_v || 0
    ];
    const avgVoltage = voltages.reduce((a, b) => a + b, 0) / 3;
    const maxDeviation = Math.max(...voltages.map(v => Math.abs(v - avgVoltage)));
    const imbalancePercent = (maxDeviation / avgVoltage) * 100;

    // Calculate currents
    const currents = [
      acMeasurements.current_l1_a || 0,
      acMeasurements.current_l2_a || 0,
      acMeasurements.current_l3_a || 0
    ];
    const avgCurrent = currents.reduce((a, b) => a + b, 0) / 3;
    const currentImbalance = Math.max(...currents.map(c => Math.abs(c - avgCurrent))) / avgCurrent * 100;

    // Calculate powers
    const powers = [
      acMeasurements.inverter_ac_bus_active_power_l1_w || 0,
      acMeasurements.inverter_ac_bus_active_power_l2_w || 0,
      acMeasurements.inverter_ac_bus_active_power_l3_w || 0
    ];
    const totalPower = powers.reduce((a, b) => a + b, 0);
    const powerImbalance = Math.max(...powers.map(p => Math.abs(p - totalPower/3))) / (totalPower/3) * 100;

    const html = `
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="label">Tổng công suất</div>
          <div class="value">${(acMeasurements.inverter_ac_bus_active_power_w / 1000).toFixed(2)}<span class="unit">kW</span></div>
        </div>
        <div class="stat-card">
          <div class="label">Công suất phản kháng</div>
          <div class="value">${(acMeasurements.inverter_ac_reactive_power_var / 1000).toFixed(2)}<span class="unit">kVAR</span></div>
        </div>
        <div class="stat-card">
          <div class="label">Công suất biểu kiến</div>
          <div class="value">${(acMeasurements.inverter_ac_apparent_power_va / 1000).toFixed(2)}<span class="unit">kVA</span></div>
        </div>
        <div class="stat-card">
          <div class="label">Độ mất cân bằng điện áp</div>
          <div class="value" style="color: ${imbalancePercent > 3 ? '#f44336' : imbalancePercent > 1 ? '#ff9800' : '#4caf50'}">
            ${imbalancePercent.toFixed(2)}<span class="unit">%</span>
          </div>
        </div>
      </div>

      <!-- Phase Cards -->
      <div class="phase-grid">
        <!-- Phase L1 -->
        <div class="phase-card l1">
          <h3><span>⚡</span> Phase L1</h3>
          <div class="phase-metrics">
            <div class="metric-item">
              <div class="metric-label">Điện áp</div>
              <div class="metric-value">${(acMeasurements.voltage_l1n_v || 0).toFixed(1)}<span class="metric-unit">V</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Dòng điện</div>
              <div class="metric-value">${(acMeasurements.current_l1_a || 0).toFixed(2)}<span class="metric-unit">A</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Công suất</div>
              <div class="metric-value">${((acMeasurements.inverter_ac_bus_active_power_l1_w || 0) / 1000).toFixed(2)}<span class="metric-unit">kW</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">% Tổng</div>
              <div class="metric-value">${totalPower > 0 ? ((powers[0] / totalPower) * 100).toFixed(1) : 0}<span class="metric-unit">%</span></div>
            </div>
          </div>
        </div>

        <!-- Phase L2 -->
        <div class="phase-card l2">
          <h3><span>⚡</span> Phase L2</h3>
          <div class="phase-metrics">
            <div class="metric-item">
              <div class="metric-label">Điện áp</div>
              <div class="metric-value">${(acMeasurements.voltage_l2n_v || 0).toFixed(1)}<span class="metric-unit">V</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Dòng điện</div>
              <div class="metric-value">${(acMeasurements.current_l2_a || 0).toFixed(2)}<span class="metric-unit">A</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Công suất</div>
              <div class="metric-value">${((acMeasurements.inverter_ac_bus_active_power_l2_w || 0) / 1000).toFixed(2)}<span class="metric-unit">kW</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">% Tổng</div>
              <div class="metric-value">${totalPower > 0 ? ((powers[1] / totalPower) * 100).toFixed(1) : 0}<span class="metric-unit">%</span></div>
            </div>
          </div>
        </div>

        <!-- Phase L3 -->
        <div class="phase-card l3">
          <h3><span>⚡</span> Phase L3</h3>
          <div class="phase-metrics">
            <div class="metric-item">
              <div class="metric-label">Điện áp</div>
              <div class="metric-value">${(acMeasurements.voltage_l3n_v || 0).toFixed(1)}<span class="metric-unit">V</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Dòng điện</div>
              <div class="metric-value">${(acMeasurements.current_l3_a || 0).toFixed(2)}<span class="metric-unit">A</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Công suất</div>
              <div class="metric-value">${((acMeasurements.inverter_ac_bus_active_power_l3_w || 0) / 1000).toFixed(2)}<span class="metric-unit">kW</span></div>
            </div>
            <div class="metric-item">
              <div class="metric-label">% Tổng</div>
              <div class="metric-value">${totalPower > 0 ? ((powers[2] / totalPower) * 100).toFixed(1) : 0}<span class="metric-unit">%</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Imbalance Alert -->
      ${imbalancePercent > 1 ? `
        <div class="imbalance-alert ${imbalancePercent > 3 ? 'critical' : 'warning'}">
          <strong>⚠️ Cảnh báo mất cân bằng pha:</strong>
          <ul style="margin: 8px 0 0 20px; padding: 0;">
            <li>Điện áp: ${imbalancePercent.toFixed(2)}% (${imbalancePercent > 3 ? 'NGUY HIỂM' : 'CẢNH BÁO'})</li>
            <li>Dòng điện: ${currentImbalance.toFixed(2)}%</li>
            <li>Công suất: ${powerImbalance.toFixed(2)}%</li>
          </ul>
          ${imbalancePercent > 3 ? '<p style="margin: 8px 0 0 0; font-weight: bold;">Cần kiểm tra ngay lập tức!</p>' : ''}
        </div>
      ` : ''}

      <!-- Charts Section -->
      <div class="charts-section">
        <h2>Biểu đồ theo thời gian</h2>
        <div class="chart-container">
          <canvas id="voltageChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="currentChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="powerChart"></canvas>
        </div>
      </div>
    `;

    contentArea.innerHTML = html;
  }

  renderHistoricalCharts(data) {
    if (!data || data.length === 0) return;

    // Extract data for charts
    const timestamps = data.map(d => new Date(d.timestamp).toLocaleTimeString('vi-VN'));
    
    // Get AC measurements from each data point
    const voltagesL1 = [];
    const voltagesL2 = [];
    const voltagesL3 = [];
    const currentsL1 = [];
    const currentsL2 = [];
    const currentsL3 = [];
    const powersL1 = [];
    const powersL2 = [];
    const powersL3 = [];

    data.forEach(dp => {
      if (dp.inverters && dp.inverters.length > 0) {
        const inv = dp.inverters[0];
        if (inv.ac_measurements) {
          voltagesL1.push(inv.ac_measurements.voltage_l1n_v || 0);
          voltagesL2.push(inv.ac_measurements.voltage_l2n_v || 0);
          voltagesL3.push(inv.ac_measurements.voltage_l3n_v || 0);
          currentsL1.push(inv.ac_measurements.current_l1_a || 0);
          currentsL2.push(inv.ac_measurements.current_l2_a || 0);
          currentsL3.push(inv.ac_measurements.current_l3_a || 0);
          powersL1.push((inv.ac_measurements.inverter_ac_bus_active_power_l1_w || 0) / 1000);
          powersL2.push((inv.ac_measurements.inverter_ac_bus_active_power_l2_w || 0) / 1000);
          powersL3.push((inv.ac_measurements.inverter_ac_bus_active_power_l3_w || 0) / 1000);
        } else {
          voltagesL1.push(0); voltagesL2.push(0); voltagesL3.push(0);
          currentsL1.push(0); currentsL2.push(0); currentsL3.push(0);
          powersL1.push(0); powersL2.push(0); powersL3.push(0);
        }
      } else {
        voltagesL1.push(0); voltagesL2.push(0); voltagesL3.push(0);
        currentsL1.push(0); currentsL2.push(0); currentsL3.push(0);
        powersL1.push(0); powersL2.push(0); powersL3.push(0);
      }
    });

    // Voltage Chart
    this.renderChart('voltageChart', {
      labels: timestamps,
      datasets: [
        {
          label: 'L1 (V)',
          data: voltagesL1,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4
        },
        {
          label: 'L2 (V)',
          data: voltagesL2,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        },
        {
          label: 'L3 (V)',
          data: voltagesL3,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4
        }
      ]
    }, 'Điện áp (V)');

    // Current Chart
    this.renderChart('currentChart', {
      labels: timestamps,
      datasets: [
        {
          label: 'L1 (A)',
          data: currentsL1,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4
        },
        {
          label: 'L2 (A)',
          data: currentsL2,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        },
        {
          label: 'L3 (A)',
          data: currentsL3,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4
        }
      ]
    }, 'Dòng điện (A)');

    // Power Chart
    this.renderChart('powerChart', {
      labels: timestamps,
      datasets: [
        {
          label: 'L1 (kW)',
          data: powersL1,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4
        },
        {
          label: 'L2 (kW)',
          data: powersL2,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        },
        {
          label: 'L3 (kW)',
          data: powersL3,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4
        }
      ]
    }, 'Công suất (kW)');
  }

  renderChart(canvasId, chartData, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart if exists
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
            beginAtZero: false
          }
        }
      }
    });
  }

  updateRealtimeData(data) {
    // Update realtime display if device matches
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
    }, 30000); // Refresh every 30 seconds
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
}

// Global functions for buttons
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new ACMeasurementsDashboard();
});
