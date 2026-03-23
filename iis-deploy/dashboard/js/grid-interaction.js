// Grid Interaction Dashboard
class GridInteractionDashboard {
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
        case 'today':
          start = new Date().setHours(0, 0, 0, 0) / 1000;
          break;
        case '7days':
          start = end - (7 * 24 * 60 * 60);
          break;
        case '30days':
          start = end - (30 * 24 * 60 * 60);
          break;
        case '1year':
          start = end - (365 * 24 * 60 * 60);
          break;
      }

      const response = await fetch(
        `${this.API_BASE}/devices/${this.currentDeviceId}/history?start=${start}&end=${end}&interval=${period === 'today' ? '5min' : '1hour'}`
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
    
    // Get first inverter with grid interaction (v0.9.0 schema)
    let gridInteraction = null;
    
    if (data.inverters && data.inverters.length > 0) {
      const inverter = data.inverters[0];
      if (inverter.grid_interaction) {
        gridInteraction = inverter.grid_interaction;
      }
    }

    if (!gridInteraction) {
      contentArea.innerHTML = '<div class="error">Không có dữ liệu grid interaction (cần payload v0.9.0)</div>';
      return;
    }

    const exchangePower = gridInteraction.exchange_active_power_w || 0;
    const importPower = gridInteraction.import_active_power_w || 0;
    const exportPower = gridInteraction.export_active_power_w || 0;
    const zeroExportEnabled = gridInteraction.zero_export_enabled || false;
    const exportLimit = gridInteraction.export_power_limit_w || 0;
    const frequency = gridInteraction.frequency_hz || 0;

    // Determine if importing or exporting
    const isImporting = exchangePower > 0 || importPower > 0;
    const isExporting = exportPower > 0;

    const html = `
      <!-- Zero Export Alert -->
      <div class="zero-export-alert ${zeroExportEnabled ? 'active' : ''}">
        <div class="icon">${zeroExportEnabled ? '✅' : '⚠️'}</div>
        <div class="content">
          <div class="status">Zero Export: ${zeroExportEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}</div>
          <div class="card-subvalue">
            ${zeroExportEnabled 
              ? `Giới hạn xuất lưới: ${(exportLimit / 1000).toFixed(2)} kW` 
              : 'Hệ thống đang cho phép xuất điện ra lưới'}
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card ${isImporting ? 'import' : 'net'}">
          <div class="card-label">Trao đổi với lưới</div>
          <div class="card-value" style="color: ${isImporting ? '#f44336' : '#4caf50'}">
            ${isImporting ? '+' : '-'}${(Math.abs(exchangePower) / 1000).toFixed(2)}<span class="card-unit">kW</span>
          </div>
          <div class="card-subvalue">${isImporting ? 'Nhập từ lưới' : 'Xuất ra lưới'}</div>
        </div>

        <div class="summary-card import">
          <div class="card-label">Nhập từ lưới</div>
          <div class="card-value" style="color: #f44336">
            ${(importPower / 1000).toFixed(2)}<span class="card-unit">kW</span>
          </div>
          <div class="card-subvalue">
            Hôm nay: ${(gridInteraction.import_energy_today_kwh || 0).toFixed(2)} kWh<br>
            Tổng: ${(gridInteraction.import_energy_total_kwh || 0).toFixed(2)} kWh
          </div>
        </div>

        <div class="summary-card export">
          <div class="card-label">Xuất ra lưới</div>
          <div class="card-value" style="color: #4caf50">
            ${(exportPower / 1000).toFixed(2)}<span class="card-unit">kW</span>
          </div>
          <div class="card-subvalue">
            Hôm nay: ${(gridInteraction.export_energy_today_kwh || 0).toFixed(2)} kWh<br>
            Tổng: ${(gridInteraction.export_energy_total_kwh || 0).toFixed(2)} kWh
          </div>
        </div>

        <div class="summary-card frequency">
          <div class="card-label">Tần số lưới</div>
          <div class="card-value" style="color: ${frequency >= 49.5 && frequency <= 50.5 ? '#4caf50' : '#f44336'}">
            ${frequency.toFixed(2)}<span class="card-unit">Hz</span>
          </div>
          <div class="card-subvalue">
            ${frequency >= 49.5 && frequency <= 50.5 ? 'Bình thường' : 'Cảnh báo: Tần số ngoài phạm vi cho phép'}
          </div>
        </div>
      </div>

      <!-- Power Flow Visual -->
      <div class="power-flow-visual">
        <svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#333" />
            </marker>
          </defs>
          
          <!-- Grid -->
          <rect x="50" y="80" width="100" height="40" fill="#e0e0e0" stroke="#333" stroke-width="2" rx="4"/>
          <text x="100" y="105" text-anchor="middle" font-size="14" font-weight="600">Lưới điện</text>
          
          <!-- Inverter -->
          <rect x="250" y="80" width="100" height="40" fill="#fff" stroke="#667eea" stroke-width="2" rx="4"/>
          <text x="300" y="105" text-anchor="middle" font-size="14" font-weight="600">Inverter</text>
          
          <!-- Load -->
          <rect x="450" y="80" width="100" height="40" fill="#fff" stroke="#9c27b0" stroke-width="2" rx="4"/>
          <text x="500" y="105" text-anchor="middle" font-size="14" font-weight="600">Tải tiêu thụ</text>
          
          <!-- Arrows -->
          ${isImporting ? `
            <path class="flow-arrow import" d="M 150 100 L 250 100" />
            <text x="200" y="90" text-anchor="middle" class="flow-label" fill="#f44336">
              ${(importPower / 1000).toFixed(2)} kW
            </text>
          ` : `
            <path class="flow-arrow export" d="M 250 100 L 150 100" />
            <text x="200" y="90" text-anchor="middle" class="flow-label" fill="#4caf50">
              ${(exportPower / 1000).toFixed(2)} kW
            </text>
          `}
          
          <path class="flow-arrow" d="M 350 100 L 450 100" stroke="#9c27b0" stroke-width="4" fill="none" marker-end="url(#arrowhead)"/>
          <text x="400" y="90" text-anchor="middle" class="flow-label" fill="#9c27b0">
            Load
          </text>
        </svg>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <h2>Biểu đồ theo thời gian</h2>
        <div class="chart-container">
          <canvas id="powerChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="energyChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="frequencyChart"></canvas>
        </div>
      </div>
    `;

    contentArea.innerHTML = html;
  }

  renderHistoricalCharts(data) {
    if (!data || data.length === 0) return;

    const timestamps = data.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleString('vi-VN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    });

    const importPowers = [];
    const exportPowers = [];
    const exchangePowers = [];
    const frequencies = [];
    const importEnergies = [];
    const exportEnergies = [];

    data.forEach(dp => {
      if (dp.inverters && dp.inverters.length > 0) {
        const inv = dp.inverters[0];
        if (inv.grid_interaction) {
          const gi = inv.grid_interaction;
          importPowers.push((gi.import_active_power_w || 0) / 1000);
          exportPowers.push((gi.export_active_power_w || 0) / 1000);
          exchangePowers.push((gi.exchange_active_power_w || 0) / 1000);
          frequencies.push(gi.frequency_hz || 0);
          importEnergies.push(gi.import_energy_today_kwh || 0);
          exportEnergies.push(gi.export_energy_today_kwh || 0);
        } else {
          importPowers.push(0);
          exportPowers.push(0);
          exchangePowers.push(0);
          frequencies.push(0);
          importEnergies.push(0);
          exportEnergies.push(0);
        }
      } else {
        importPowers.push(0);
        exportPowers.push(0);
        exchangePowers.push(0);
        frequencies.push(0);
        importEnergies.push(0);
        exportEnergies.push(0);
      }
    });

    // Power Chart
    this.renderChart('powerChart', {
      labels: timestamps,
      datasets: [
        {
          label: 'Nhập từ lưới (kW)',
          data: importPowers,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4
        },
        {
          label: 'Xuất ra lưới (kW)',
          data: exportPowers,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        },
        {
          label: 'Trao đổi (kW)',
          data: exchangePowers,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    }, 'Công suất trao đổi với lưới (kW)');

    // Energy Chart
    this.renderChart('energyChart', {
      labels: timestamps,
      datasets: [
        {
          label: 'Năng lượng nhập (kWh)',
          data: importEnergies,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4
        },
        {
          label: 'Năng lượng xuất (kWh)',
          data: exportEnergies,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        }
      ]
    }, 'Năng lượng trao đổi (kWh)');

    // Frequency Chart
    this.renderChart('frequencyChart', {
      labels: timestamps,
      datasets: [
        {
          label: 'Tần số (Hz)',
          data: frequencies,
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4
        },
        {
          label: 'Giới hạn trên (50.5 Hz)',
          data: frequencies.map(() => 50.5),
          borderColor: '#f44336',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0
        },
        {
          label: 'Giới hạn dưới (49.5 Hz)',
          data: frequencies.map(() => 49.5),
          borderColor: '#f44336',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    }, 'Tần số lưới điện (Hz)');
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
  dashboard = new GridInteractionDashboard();
});
