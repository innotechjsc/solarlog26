// Performance Dashboard Script
class PerformanceDashboard {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.selectedDevice = null;
    this.selectedPeriod = '7days';
    this.performanceChart = null;
    this.efficiencyChart = null;
  }

  init() {
    this.loadDevices();
    this.setupEventListeners();
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  async loadDevices() {
    try {
      const response = await fetch(`${this.API_BASE}/devices`);
      const result = await response.json();
      
      if (result.status === 'success' && result.devices) {
        const select = document.getElementById('deviceSelect');
        result.devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.device_id;
          option.textContent = device.site_name || device.device_id;
          select.appendChild(option);
        });
        
        // Load data for first device or all devices
        if (result.devices.length > 0) {
          this.selectedDevice = result.devices[0].device_id;
          this.loadPerformanceData();
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  setupEventListeners() {
    document.getElementById('deviceSelect').addEventListener('change', (e) => {
      this.selectedDevice = e.target.value || null;
      this.loadPerformanceData();
    });

    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedPeriod = e.target.dataset.period;
        this.loadPerformanceData();
      });
    });
  }

  async loadPerformanceData() {
    try {
      if (this.selectedDevice) {
        await Promise.all([
          this.loadEnergyAnalytics(),
          this.loadPerformanceMetrics(),
          this.loadDeviceComparison()
        ]);
      } else {
        await this.loadAllDevicesPerformance();
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  }

  async loadEnergyAnalytics() {
    try {
      const response = await fetch(`${this.API_BASE}/analytics/energy?deviceId=${this.selectedDevice}&period=${this.selectedPeriod}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const analytics = result.analytics;
        
        document.getElementById('totalEnergy').textContent = analytics.total_energy.toFixed(1);
        document.getElementById('avgDailyEnergy').textContent = analytics.avg_daily_energy.toFixed(1);
        
        // Show trend
        const trend = analytics.trend || 0;
        const trendElement = document.getElementById('energyTrend');
        if (trend > 0) {
          trendElement.innerHTML = `<span class="trend-up">↑ ${trend.toFixed(1)}%</span>`;
        } else if (trend < 0) {
          trendElement.innerHTML = `<span class="trend-down">↓ ${Math.abs(trend).toFixed(1)}%</span>`;
        } else {
          trendElement.innerHTML = `<span>→ 0%</span>`;
        }
        
        this.renderPerformanceChart(analytics.daily_data);
      }
    } catch (error) {
      console.error('Error loading energy analytics:', error);
    }
  }

  async loadPerformanceMetrics() {
    try {
      const end = Math.floor(Date.now() / 1000);
      let start;
      
      switch (this.selectedPeriod) {
        case '7days':
          start = end - (7 * 24 * 60 * 60);
          break;
        case '30days':
          start = end - (30 * 24 * 60 * 60);
          break;
        case '1year':
          start = end - (365 * 24 * 60 * 60);
          break;
        default:
          start = end - (7 * 24 * 60 * 60);
      }
      
      const response = await fetch(`${this.API_BASE}/analytics/performance?deviceId=${this.selectedDevice}&start=${start}&end=${end}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const analytics = result.analytics;
        
        document.getElementById('avgPower').textContent = analytics.avg_power.toFixed(2);
        document.getElementById('maxPower').textContent = analytics.max_power.toFixed(2);
        document.getElementById('avgEfficiency').textContent = analytics.efficiency.toFixed(1);
        document.getElementById('availability').textContent = analytics.availability.toFixed(1);
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  }

  async loadDeviceComparison() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        const comparisonContainer = document.getElementById('deviceComparison');
        comparisonContainer.innerHTML = '';
        
        const end = Math.floor(Date.now() / 1000);
        const start = end - (7 * 24 * 60 * 60);
        
        const comparisons = await Promise.all(
          devicesResult.devices.slice(0, 6).map(async (device) => {
            try {
              const perfResponse = await fetch(`${this.API_BASE}/analytics/performance?deviceId=${device.device_id}&start=${start}&end=${end}`);
              const perfResult = await perfResponse.json();
              
              const energyResponse = await fetch(`${this.API_BASE}/analytics/energy?deviceId=${device.device_id}&period=7days`);
              const energyResult = await energyResponse.json();
              
              if (perfResult.status === 'success' && energyResult.status === 'success') {
                return {
                  device_id: device.device_id,
                  site_name: device.site_name || device.device_id,
                  total_energy: energyResult.analytics.total_energy,
                  avg_power: perfResult.analytics.avg_power,
                  efficiency: perfResult.analytics.efficiency,
                  availability: perfResult.analytics.availability
                };
              }
            } catch (error) {
              console.error(`Error loading data for device ${device.device_id}:`, error);
            }
            return null;
          })
        );
        
        const validComparisons = comparisons.filter(c => c !== null);
        
        if (validComparisons.length === 0) {
          comparisonContainer.innerHTML = '<div class="loading">Không có dữ liệu</div>';
          return;
        }
        
        validComparisons.forEach(comp => {
          const card = document.createElement('div');
          card.className = 'device-card';
          card.innerHTML = `
            <h4>${comp.site_name}</h4>
            <div class="device-metric">
              <span class="device-metric-label">Tổng năng lượng:</span>
              <span class="device-metric-value">${comp.total_energy.toFixed(1)} kWh</span>
            </div>
            <div class="device-metric">
              <span class="device-metric-label">Công suất TB:</span>
              <span class="device-metric-value">${comp.avg_power.toFixed(2)} kW</span>
            </div>
            <div class="device-metric">
              <span class="device-metric-label">Hiệu suất:</span>
              <span class="device-metric-value">${comp.efficiency.toFixed(1)}%</span>
            </div>
            <div class="device-metric">
              <span class="device-metric-label">Tỷ lệ hoạt động:</span>
              <span class="device-metric-value">${comp.availability.toFixed(1)}%</span>
            </div>
          `;
          comparisonContainer.appendChild(card);
        });
      }
    } catch (error) {
      console.error('Error loading device comparison:', error);
      document.getElementById('deviceComparison').innerHTML = '<div class="error">Lỗi khi tải dữ liệu</div>';
    }
  }

  async loadAllDevicesPerformance() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        // Aggregate data from all devices
        let totalEnergy = 0;
        let totalPower = 0;
        let totalEfficiency = 0;
        let totalAvailability = 0;
        let deviceCount = 0;
        
        const end = Math.floor(Date.now() / 1000);
        let start;
        switch (this.selectedPeriod) {
          case '7days':
            start = end - (7 * 24 * 60 * 60);
            break;
          case '30days':
            start = end - (30 * 24 * 60 * 60);
            break;
          case '1year':
            start = end - (365 * 24 * 60 * 60);
            break;
          default:
            start = end - (7 * 24 * 60 * 60);
        }
        
        for (const device of devicesResult.devices) {
          try {
            const perfResponse = await fetch(`${this.API_BASE}/analytics/performance?deviceId=${device.device_id}&start=${start}&end=${end}`);
            const perfResult = await perfResponse.json();
            
            const energyResponse = await fetch(`${this.API_BASE}/analytics/energy?deviceId=${device.device_id}&period=${this.selectedPeriod}`);
            const energyResult = await energyResponse.json();
            
            if (perfResult.status === 'success' && energyResult.status === 'success') {
              totalEnergy += energyResult.analytics.total_energy || 0;
              totalPower += perfResult.analytics.avg_power || 0;
              totalEfficiency += perfResult.analytics.efficiency || 0;
              totalAvailability += perfResult.analytics.availability || 0;
              deviceCount++;
            }
          } catch (error) {
            console.error(`Error loading data for device ${device.device_id}:`, error);
          }
        }
        
        if (deviceCount > 0) {
          document.getElementById('totalEnergy').textContent = totalEnergy.toFixed(1);
          document.getElementById('avgPower').textContent = (totalPower / deviceCount).toFixed(2);
          document.getElementById('avgEfficiency').textContent = (totalEfficiency / deviceCount).toFixed(1);
          document.getElementById('availability').textContent = (totalAvailability / deviceCount).toFixed(1);
          document.getElementById('avgDailyEnergy').textContent = (totalEnergy / (this.selectedPeriod === '7days' ? 7 : this.selectedPeriod === '30days' ? 30 : 365)).toFixed(1);
        }
        
        await this.loadDeviceComparison();
      }
    } catch (error) {
      console.error('Error loading all devices performance:', error);
    }
  }

  renderPerformanceChart(dailyData) {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    if (this.performanceChart) {
      this.performanceChart.destroy();
    }

    const labels = dailyData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    const energy = dailyData.map(d => d.energy || 0);
    const maxPower = dailyData.map(d => d.max_power || 0);

    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Năng lượng (kWh)',
            data: energy,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            yAxisID: 'y',
            tension: 0.4
          },
          {
            label: 'Công suất tối đa (kW)',
            data: maxPower,
            borderColor: '#f57c00',
            backgroundColor: 'rgba(245, 124, 0, 0.1)',
            yAxisID: 'y1',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Năng lượng (kWh)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Công suất (kW)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  async loadEfficiencyTrend() {
    try {
      if (!this.selectedDevice) return;
      
      const end = Math.floor(Date.now() / 1000);
      const start = end - (30 * 24 * 60 * 60);
      
      const response = await fetch(`${this.API_BASE}/devices/${this.selectedDevice}/history?start=${start}&end=${end}&interval=1day`);
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.length > 0) {
        this.renderEfficiencyChart(result.data);
      }
    } catch (error) {
      console.error('Error loading efficiency trend:', error);
    }
  }

  renderEfficiencyChart(data) {
    const ctx = document.getElementById('efficiencyChart');
    if (!ctx) return;

    if (this.efficiencyChart) {
      this.efficiencyChart.destroy();
    }

    const labels = data.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    // Calculate efficiency from inverter data
    const efficiency = data.map(d => {
      if (d.inverters && d.inverters.length > 0) {
        const avgEff = d.inverters.reduce((sum, inv) => sum + (inv.efficiency || 0), 0) / d.inverters.length;
        return avgEff;
      }
      return 0;
    });

    this.efficiencyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hiệu suất (%)',
          data: efficiency,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 90,
            max: 100,
            title: {
              display: true,
              text: 'Hiệu suất (%)'
            }
          }
        }
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new PerformanceDashboard();
    dashboard.init();
  });
} else {
  const dashboard = new PerformanceDashboard();
  dashboard.init();
}

