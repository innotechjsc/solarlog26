// Monitoring Dashboard Main Script
class MonitoringDashboard {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.selectedDevice = null;
    this.plantPowerChart = null;
    this.energyManagementChart = null;
    this.revenueChart = null;
  }

  init() {
    this.loadSummaryData();
    this.setupEventListeners();
    this.loadPlantPowerChart();
    this.loadEnergyManagement();
    this.loadRevenue();
    
    // Listen for device selection
    window.addEventListener('deviceSelected', (e) => {
      this.selectedDevice = e.detail;
      this.loadDeviceData(e.detail.device_id);
    });
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  async loadSummaryData() {
    try {
      // Load first device for summary
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        const deviceId = devicesResult.devices[0].device_id;
        await Promise.all([
          this.loadDeviceSummary(deviceId),
          this.loadAlerts(deviceId),
          this.loadPlantDetails(deviceId)
        ]);
      }
    } catch (error) {
      console.error('Error loading summary data:', error);
    }
  }

  async loadDeviceSummary(deviceId) {
    try {
      // Today's production
      const energyResponse = await fetch(`${this.API_BASE}/analytics/energy?deviceId=${deviceId}&period=7days`);
      const energyResult = await energyResponse.json();
      
      if (energyResult.status === 'success') {
        const todayData = energyResult.analytics.daily_data[energyResult.analytics.daily_data.length - 1];
        document.getElementById('productionToday').textContent = (todayData?.energy || 0).toFixed(2);
        document.getElementById('totalProduction').textContent = (energyResult.analytics.total_energy || 0).toFixed(2);
      }

      // Environmental
      const envResponse = await fetch(`${this.API_BASE}/analytics/environmental?deviceId=${deviceId}&period=lifetime`);
      const envResult = await envResponse.json();
      
      if (envResult.status === 'success') {
        const env = envResult.analytics.environmental;
        document.getElementById('coalSaved').textContent = env.coal_saved.toFixed(2);
        document.getElementById('co2Avoided').textContent = env.co2_avoided.toFixed(2);
        document.getElementById('treesPlanted').textContent = env.trees_equivalent;
      }

      // Energy management for consumption
      const emResponse = await fetch(`${this.API_BASE}/analytics/energy-management?deviceId=${deviceId}&period=day`);
      const emResult = await emResponse.json();
      
      if (emResult.status === 'success') {
        const summary = emResult.analytics.summary;
        document.getElementById('consumptionToday').textContent = (summary.total_consumption || 0).toFixed(2);
        document.getElementById('consumptionFromPV').textContent = (summary.consumed_from_pv || 0).toFixed(2);
      }
      
      // Load new data from payload 0.9.0
      await this.loadRealtimeData(deviceId);
    } catch (error) {
      console.error('Error loading device summary:', error);
    }
  }
  
  async loadRealtimeData(deviceId) {
    try {
      const response = await fetch(`${this.API_BASE}/devices/${deviceId}/realtime`);
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        const data = result.data;
        const inverters = data.inverters || [];
        const isNewSchema = data.schema_version && parseFloat(data.schema_version) >= 0.9;
        
        if (inverters.length > 0) {
          // Get first inverter data
          const inv = inverters[0];
          
          // Grid Frequency
          if (isNewSchema && inv.grid_interaction) {
            const freq = inv.grid_interaction.frequency_hz || 0;
            const freqEl = document.getElementById('gridFrequency');
            const freqStatusEl = document.getElementById('gridFrequencyStatus');
            
            if (freqEl && freq > 0) {
              freqEl.textContent = freq.toFixed(2);
              
              // Color based on frequency (50 Hz ± 0.5 Hz is normal)
              if (freq >= 49.5 && freq <= 50.5) {
                freqEl.style.color = '#4caf50';
                if (freqStatusEl) {
                  freqStatusEl.textContent = 'Bình thường';
                  freqStatusEl.style.color = '#4caf50';
                }
              } else {
                freqEl.style.color = '#f44336';
                if (freqStatusEl) {
                  freqStatusEl.textContent = 'Cảnh báo';
                  freqStatusEl.style.color = '#f44336';
                }
              }
            }
          }
          
          // Temperature
          if (isNewSchema && inv.thermal_hardware) {
            const temp = inv.thermal_hardware.inverter_temp_c || 0;
            const ambient = inv.thermal_hardware.ambient_temp_c || 0;
            const tempEl = document.getElementById('inverterTemperature');
            const ambientEl = document.getElementById('ambientTemperature');
            
            if (tempEl && temp > 0) {
              tempEl.textContent = temp.toFixed(1);
              
              // Color based on temperature
              if (temp <= 50) {
                tempEl.style.color = '#4caf50';
              } else if (temp <= 60) {
                tempEl.style.color = '#ff9800';
              } else {
                tempEl.style.color = '#f44336';
              }
            }
            
            if (ambientEl && ambient > 0) {
              ambientEl.textContent = `Môi trường: ${ambient.toFixed(1)}°C`;
            }
          }
          
          // Battery Health
          if (isNewSchema && inv.battery_storage) {
            const soh = inv.battery_storage.soh_percent || 0;
            const soc = inv.battery_storage.soc_percent || 0;
            const sohEl = document.getElementById('batterySOH');
            const socEl = document.getElementById('batterySOC');
            
            if (sohEl && soh > 0) {
              sohEl.textContent = soh.toFixed(1);
              
              // Color based on SOH
              if (soh >= 80) {
                sohEl.style.color = '#4caf50';
              } else if (soh >= 60) {
                sohEl.style.color = '#ff9800';
              } else {
                sohEl.style.color = '#f44336';
              }
            }
            
            if (socEl && soc > 0) {
              socEl.textContent = `SOC: ${soc.toFixed(1)}%`;
            }
          }
          
          // Operating State
          if (isNewSchema && inv.operating_state) {
            const workMode = inv.operating_state.work_mode || 'unknown';
            const gridMode = inv.operating_state.grid_mode || 'unknown';
            const workModeEl = document.getElementById('workModeStatus');
            const gridModeEl = document.getElementById('gridModeStatus');
            
            if (workModeEl) {
              const modeText = {
                'normal': 'Bình thường',
                'standby': 'Chờ',
                'fault': 'Lỗi'
              };
              workModeEl.textContent = modeText[workMode] || workMode;
              
              // Color based on work mode
              if (workMode === 'normal') {
                workModeEl.style.color = '#4caf50';
              } else if (workMode === 'standby') {
                workModeEl.style.color = '#ff9800';
              } else if (workMode === 'fault') {
                workModeEl.style.color = '#f44336';
              }
            }
            
            if (gridModeEl) {
              const gridText = {
                'on_grid': 'Kết nối lưới',
                'off_grid': 'Tách lưới'
              };
              gridModeEl.textContent = `Grid: ${gridText[gridMode] || gridMode}`;
              
              // Color based on grid mode
              if (gridMode === 'on_grid') {
                gridModeEl.style.color = '#2196f3';
              } else {
                gridModeEl.style.color = '#9e9e9e';
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading realtime data:', error);
    }
  }

  async loadAlerts(deviceId) {
    try {
      const response = await fetch(`${this.API_BASE}/analytics/alarms?deviceId=${deviceId}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const stats = result.statistics;
        document.getElementById('alertCount').textContent = stats.total;
        document.getElementById('alertCritical').textContent = stats.by_severity.CRITICAL || 0;
        document.getElementById('alertMajor').textContent = stats.by_severity.MAJOR || 0;
        document.getElementById('alertMinor').textContent = stats.by_severity.MINOR || 0;
        document.getElementById('alertWarning').textContent = stats.by_severity.WARNING || 0;
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  async loadPlantDetails(deviceId) {
    try {
      const deviceResponse = await fetch(`${this.API_BASE}/devices`);
      const deviceResult = await deviceResponse.json();
      
      if (deviceResult.status === 'success') {
        const device = deviceResult.devices.find(d => d.device_id === deviceId);
        if (device) {
          document.getElementById('plantAddress').textContent = device.location || '-';
          document.getElementById('totalCapacity').textContent = '-'; // Need to get from device metadata
          document.getElementById('gridConnectionDate').textContent = device.metadata?.installation_date 
            ? new Date(device.metadata.installation_date).toISOString().split('T')[0] 
            : '-';
        }
      }
    } catch (error) {
      console.error('Error loading plant details:', error);
    }
  }

  async loadPlantPowerChart(deviceId = null) {
    if (!deviceId) {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        deviceId = devicesResult.devices[0].device_id;
      } else {
        return;
      }
    }

    try {
      const end = Math.floor(Date.now() / 1000);
      const start = end - (24 * 60 * 60);
      
      const response = await fetch(`${this.API_BASE}/devices/${deviceId}/history?start=${start}&end=${end}&interval=5min`);
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.length > 0) {
        this.renderPlantPowerChart(result.data);
      }
    } catch (error) {
      console.error('Error loading plant power chart:', error);
    }
  }

  renderPlantPowerChart(data) {
    const ctx = document.getElementById('plantPowerChart');
    if (!ctx) return;

    if (this.plantPowerChart) {
      this.plantPowerChart.destroy();
    }

    const labels = data.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    });

    // Extract power flow data
    const toGrid = data.map(d => (d.power_flow?.pv_to_grid || 0) + (d.power_flow?.battery_to_grid || 0));
    const toHome = data.map(d => d.power_flow?.pv_to_home || 0);
    const toBattery = data.map(d => d.power_flow?.pv_to_battery || 0);
    const fromBattery = data.map(d => d.power_flow?.battery_to_home || 0);
    const fromSolar = data.map(d => d.system?.total_ac_power || 0);
    const fromGrid = data.map(d => d.power_flow?.grid_to_home || 0);

    this.plantPowerChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'To Grid',
            data: toGrid,
            borderColor: '#90caf9',
            backgroundColor: 'rgba(144, 202, 249, 0.1)',
            tension: 0.4
          },
          {
            label: 'To Home',
            data: toHome,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4
          },
          {
            label: 'To Battery',
            data: toBattery,
            borderColor: '#81c784',
            backgroundColor: 'rgba(129, 199, 132, 0.1)',
            tension: 0.4
          },
          {
            label: 'From Battery',
            data: fromBattery,
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4
          },
          {
            label: 'From Solar',
            data: fromSolar,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            tension: 0.4
          },
          {
            label: 'From Grid',
            data: fromGrid,
            borderColor: '#9e9e9e',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
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
              text: 'Power (kW)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          }
        }
      }
    });
  }

  async loadEnergyManagement(deviceId = null) {
    if (!deviceId) {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        deviceId = devicesResult.devices[0].device_id;
      } else {
        return;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('energyDate').value = today;

    try {
      const response = await fetch(`${this.API_BASE}/analytics/energy-management?deviceId=${deviceId}&period=day&date=${today}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        this.updateEnergySummary(result.analytics.summary);
        this.renderEnergyManagementChart(result.analytics.hourly_data);
      }
    } catch (error) {
      console.error('Error loading energy management:', error);
    }
  }

  updateEnergySummary(summary) {
    document.getElementById('pvOutput').textContent = `${(summary.pv_output || 0).toFixed(2)} kWh`;
    document.getElementById('totalConsumption').textContent = (summary.total_consumption || 0).toFixed(2);
    document.getElementById('fedToGrid').textContent = `${(summary.fed_to_grid || 0).toFixed(2)} (`;
    document.getElementById('fedToGridPercent').textContent = (summary.fed_to_grid_percent || 0).toFixed(2);
    document.getElementById('deviceConsumption').textContent = `${(summary.total_consumption || 0).toFixed(2)} kWh`;
    document.getElementById('fromPV').textContent = `${(summary.consumed_from_pv || 0).toFixed(2)} (`;
    document.getElementById('fromPVPercent').textContent = (summary.pv_consumption_percent || 0).toFixed(2);
    document.getElementById('fromGrid').textContent = `${(summary.consumed_from_grid || 0).toFixed(2)} (`;
    document.getElementById('fromGridPercent').textContent = (summary.grid_consumption_percent || 0).toFixed(2);
  }

  renderEnergyManagementChart(hourlyData) {
    const ctx = document.getElementById('energyManagementChart');
    if (!ctx) return;

    if (this.energyManagementChart) {
      this.energyManagementChart.destroy();
    }

    const labels = hourlyData.map(h => {
      const date = new Date(h.hour);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit' });
    });

    // For now, use energy data (in real implementation, would have separate power flow data)
    const pvOutput = hourlyData.map(h => h.energy || 0);
    const totalConsumption = hourlyData.map(h => h.energy * 0.7 || 0); // Estimate
    const consumedFromPV = hourlyData.map(h => h.energy * 0.5 || 0); // Estimate
    const batterySOC = hourlyData.map(h => 50); // Placeholder
    const batteryCharge = hourlyData.map(h => h.energy * 0.2 || 0); // Estimate

    this.energyManagementChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'PV output',
            data: pvOutput,
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.4
          },
          {
            label: 'Total consumption',
            data: totalConsumption,
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4
          },
          {
            label: 'Consumed from PV',
            data: consumedFromPV,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4
          },
          {
            label: 'Battery SOC',
            data: batterySOC,
            borderColor: '#90caf9',
            backgroundColor: 'rgba(144, 202, 249, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Battery (charge)',
            data: batteryCharge,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
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
              text: 'Energy (kWh)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'SOC (%)'
            },
            grid: {
              drawOnChartArea: false
            }
          },
          x: {
            title: {
              display: true,
              text: 'Hour'
            }
          }
        }
      }
    });
  }

  async loadRevenue(deviceId = null) {
    if (!deviceId) {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        deviceId = devicesResult.devices[0].device_id;
      } else {
        return;
      }
    }

    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('revenueDate').value = month;

    try {
      const response = await fetch(`${this.API_BASE}/analytics/revenue?deviceId=${deviceId}&period=month`);
      const result = await response.json();
      
      if (result.status === 'success') {
        document.getElementById('totalRevenue').textContent = this.formatCurrency(result.analytics.total_revenue);
        this.renderRevenueChart(result.analytics.daily_data);
      }
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  }

  renderRevenueChart(dailyData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const labels = dailyData.map(d => {
      const date = new Date(d.date);
      return date.getDate();
    });

    const revenue = dailyData.map(d => d.revenue || 0);

    this.revenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Doanh thu (VND)',
          data: revenue,
          backgroundColor: '#4caf50',
          borderColor: '#2e7d32',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Doanh thu (VND)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Ngày'
            }
          }
        }
      }
    });
  }

  setupEventListeners() {
    // Tab buttons for plant power
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        const parent = e.target.closest('.card-tabs');
        parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Handle tab change
        if (e.target.closest('.section-card').querySelector('#plantPowerChart')) {
          // Switch between power and energy
          // Implementation would reload chart with different data
        }
      });
    });

    // Date selectors
    document.getElementById('energyDate')?.addEventListener('change', (e) => {
      this.loadEnergyManagement(this.selectedDevice?.device_id);
    });

    document.getElementById('revenueDate')?.addEventListener('change', (e) => {
      this.loadRevenue(this.selectedDevice?.device_id);
    });

    // Date navigation
    document.getElementById('prevDate')?.addEventListener('click', () => {
      const input = document.getElementById('energyDate');
      const date = new Date(input.value);
      date.setDate(date.getDate() - 1);
      input.value = date.toISOString().split('T')[0];
      this.loadEnergyManagement(this.selectedDevice?.device_id);
    });

    document.getElementById('nextDate')?.addEventListener('click', () => {
      const input = document.getElementById('energyDate');
      const date = new Date(input.value);
      date.setDate(date.getDate() + 1);
      input.value = date.toISOString().split('T')[0];
      this.loadEnergyManagement(this.selectedDevice?.device_id);
    });
  }

  loadDeviceData(deviceId) {
    this.loadPlantPowerChart(deviceId);
    this.loadEnergyManagement(deviceId);
    this.loadRevenue(deviceId);
    this.loadDeviceSummary(deviceId);
    this.loadAlerts(deviceId);
    this.loadPlantDetails(deviceId);
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(value));
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new MonitoringDashboard();
    dashboard.init();
  });
} else {
  const dashboard = new MonitoringDashboard();
  dashboard.init();
}

