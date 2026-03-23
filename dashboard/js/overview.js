// Overview Dashboard Script
class OverviewDashboard {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.plantGauge = null;
    this.alertGauge = null;
    this.useAggregation = true; // Use aggregation endpoint by default
    this.useWebSocket = typeof window !== 'undefined' && window.webSocketClient;
  }

  init() {
    // Try to load from aggregation endpoint first (single request!)
    this.loadData();
    
    // Setup WebSocket listeners if available
    if (typeof window !== 'undefined' && window.webSocketClient) {
      this.setupWebSocketListeners();
    }
    
    // Setup auto refresh (fallback if WebSocket not available)
    this.setupAutoRefresh();
  }

  setupWebSocketListeners() {
    if (!window.webSocketClient) return;

    const ws = window.webSocketClient;

    // Subscribe to dashboard updates when connected
    ws.on('dashboard_data', (data) => {
      if (data && data.data) {
        console.log('[Overview] Received dashboard data update via WebSocket');
        this.updateFromAggregation(data.data);
      }
    });

    // Listen for notifications
    ws.on('notification', (data) => {
      console.log('[Overview] New notification received:', data);
      // Update notification badge
      if (window.navbar) {
        window.navbar.loadNotifications();
      }
    });

    // Listen for alarms
    ws.on('alarm', (data) => {
      console.log('[Overview] New alarm received:', data);
      // Refresh alarms
      this.loadAlerts();
    });
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  async loadData() {
    try {
      // Try aggregation endpoint first (single request - MUCH FASTER!)
      if (this.useAggregation) {
        try {
          const response = await this.fetchWithRetry(`${this.API_BASE}/dashboard/overview`);
          if (response && response.status === 'success' && response.data) {
            console.log('[Overview] Using aggregation endpoint - 1 request instead of 76+!');
            this.updateFromAggregation(response.data);
            return; // Success! Exit early - no need for individual calls
          }
        } catch (error) {
          console.warn('[Overview] Aggregation endpoint failed, falling back to individual calls:', error);
        }
      }

      // Fallback: Load devices once and cache (old way)
      let devices = null;
      try {
        const devicesResponse = await this.fetchWithRetry(`${this.API_BASE}/devices`);
        if (devicesResponse && devicesResponse.status === 'success' && devicesResponse.devices) {
          devices = devicesResponse.devices;
        }
      } catch (error) {
        console.error('Error loading devices:', error);
      }

      // Load data sequentially with delay to avoid rate limiting
      await this.loadRevenue();
      await this.delay(100);
      await this.loadEnergy(devices);
      await this.delay(100);
      await this.loadBattery(devices);
      await this.delay(100);
      await this.loadPlantStatus();
      await this.delay(100);
      await this.loadAlerts();
      await this.delay(100);
      await this.loadEnvironmental();
      await this.delay(100);
      
      // Load new widgets with devices
      if (devices) {
        await this.loadInverterStatus(devices);
        await this.delay(100);
        await this.loadBatteryHealth(devices);
        await this.delay(100);
        await this.loadTemperature(devices);
        await this.delay(100);
        await this.loadGridFrequency(devices);
        await this.delay(100);
        await this.loadOperatingState(devices);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    }
  }

  /**
   * Update dashboard from aggregated data (single request)
   * @param {object} data - Aggregated data from /dashboard/overview
   */
  updateFromAggregation(data) {
    // Revenue
    if (data.revenue) {
      const revTodayEl = document.getElementById('revenueToday');
      const revTotalEl = document.getElementById('totalRevenue');
      if (revTodayEl) revTodayEl.textContent = this.formatCurrency(data.revenue.today || 0);
      if (revTotalEl) revTotalEl.textContent = this.formatCurrency(data.revenue.lifetime || 0);
    }

    // Energy
    if (data.energy) {
      const energyTodayEl = document.getElementById('energyToday');
      const energyTotalEl = document.getElementById('totalEnergy');
      if (energyTodayEl) energyTodayEl.textContent = (data.energy.today || 0).toFixed(1);
      if (energyTotalEl) energyTotalEl.textContent = ((data.energy.lifetime || 0) / 1000).toFixed(1);
    }

    // Battery
    if (data.battery) {
      const chargeEl = document.getElementById('chargeToday');
      const dischargeEl = document.getElementById('dischargeToday');
      if (chargeEl) chargeEl.textContent = (data.battery.charge_today || 0).toFixed(1);
      if (dischargeEl) dischargeEl.textContent = (data.battery.discharge_today || 0).toFixed(1);

      // Battery Health
      const sohEl = document.getElementById('batterySOH');
      const socEl = document.getElementById('batterySOC');
      if (sohEl && data.battery.avg_soh !== null && data.battery.avg_soh !== undefined) {
        sohEl.textContent = parseFloat(data.battery.avg_soh).toFixed(1);
        const soh = parseFloat(data.battery.avg_soh);
        sohEl.style.color = soh >= 80 ? '#4caf50' : soh >= 60 ? '#ff9800' : '#f44336';
      }
      if (socEl && data.battery.avg_soc !== null && data.battery.avg_soc !== undefined) {
        socEl.textContent = `SOC: ${parseFloat(data.battery.avg_soc).toFixed(1)}%`;
      }
    }

    // Inverter Status
    if (data.inverter_status) {
      const statusEl = document.getElementById('inverterStatus');
      const healthEl = document.getElementById('inverterHealthPercent');
      if (statusEl) {
        statusEl.textContent = `${data.inverter_status.online || 0} / ${data.inverter_status.total || 0}`;
      }
      if (healthEl && data.inverter_status.health_percent !== undefined) {
        healthEl.textContent = `Tỷ lệ: ${parseFloat(data.inverter_status.health_percent).toFixed(1)}%`;
        const healthPercent = parseFloat(data.inverter_status.health_percent);
        healthEl.style.color = healthPercent >= 90 ? '#4caf50' : 
                               healthPercent >= 70 ? '#ff9800' : '#f44336';
      }
    }

    // Temperature
    if (data.temperature) {
      const tempEl = document.getElementById('inverterTemp');
      const ambientEl = document.getElementById('ambientTemp');
      if (tempEl && data.temperature.inverter !== null && data.temperature.inverter !== undefined) {
        tempEl.textContent = parseFloat(data.temperature.inverter).toFixed(1);
        const temp = parseFloat(data.temperature.inverter);
        tempEl.style.color = temp <= 50 ? '#4caf50' : temp <= 60 ? '#ff9800' : '#f44336';
      }
      if (ambientEl && data.temperature.ambient !== null && data.temperature.ambient !== undefined) {
        ambientEl.textContent = `Môi trường: ${parseFloat(data.temperature.ambient).toFixed(1)}°C`;
      }
    }

    // Grid Frequency
    if (data.grid_frequency) {
      const freqEl = document.getElementById('gridFrequency');
      const statusEl = document.getElementById('gridFrequencyStatus');
      if (freqEl && data.grid_frequency.value !== null && data.grid_frequency.value !== undefined) {
        freqEl.textContent = parseFloat(data.grid_frequency.value).toFixed(2);
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
      const alertCountEl = document.getElementById('alertCount');
      const alertCriticalEl = document.getElementById('alertCritical');
      const alertMajorEl = document.getElementById('alertMajor');
      const alertMinorEl = document.getElementById('alertMinor');
      const alertWarningEl = document.getElementById('alertWarning');
      
      if (alertCountEl) alertCountEl.textContent = data.alarms.total || 0;
      if (alertCriticalEl) alertCriticalEl.textContent = data.alarms.breakdown?.CRITICAL || 0;
      if (alertMajorEl) alertMajorEl.textContent = data.alarms.breakdown?.MAJOR || 0;
      if (alertMinorEl) alertMinorEl.textContent = data.alarms.breakdown?.MINOR || 0;
      if (alertWarningEl) alertWarningEl.textContent = data.alarms.breakdown?.WARNING || 0;
      
      // Render gauge
      this.renderAlertGauge(data.alarms);
    }

    // Plant Status
    if (data.plant_status) {
      const plantCountEl = document.getElementById('plantCount');
      const plantNormalEl = document.getElementById('plantNormal');
      const plantErrorEl = document.getElementById('plantError');
      const plantDisconnectedEl = document.getElementById('plantDisconnected');
      
      if (plantCountEl) plantCountEl.textContent = data.plant_status.total || 0;
      if (plantNormalEl) plantNormalEl.textContent = data.plant_status.normal || 0;
      if (plantErrorEl) plantErrorEl.textContent = data.plant_status.error || 0;
      if (plantDisconnectedEl) plantDisconnectedEl.textContent = data.plant_status.disconnected || 0;
      
      // Render gauge
      this.renderPlantGauge(data.plant_status);
    }

    // Environmental
    if (data.environmental) {
      const coalEl = document.getElementById('coalSaved');
      const co2El = document.getElementById('co2Avoided');
      const treesEl = document.getElementById('treesEquivalent');
      
      if (coalEl) coalEl.textContent = (data.environmental.coal_saved || 0).toFixed(2);
      if (co2El) co2El.textContent = (data.environmental.co2_avoided || 0).toFixed(2);
      if (treesEl) treesEl.textContent = data.environmental.trees_equivalent || 0;
    }
  }

  /**
   * Render operating state grid
   * @param {object} operatingState - Operating state data
   */
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

  // Helper: Fetch with retry and error handling
  async fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        
        // Check if response is OK
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - wait and retry
            const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
            console.warn(`Rate limited. Retrying after ${waitTime}ms...`);
            await this.delay(waitTime);
            continue;
          }
          
          // Check content type before parsing
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
          } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
          }
        }
        
        // Parse JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Expected JSON but got: ${text.substring(0, 100)}`);
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(Math.pow(2, i) * 1000);
      }
    }
  }

  // Helper: Delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async loadRevenue() {
    try {
      const response = await fetch(`${this.API_BASE}/analytics/revenue?period=today`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const todayRevenue = result.analytics.daily_data[result.analytics.daily_data.length - 1]?.revenue || 0;
        const totalRevenue = result.analytics.total_revenue || 0;
        
        document.getElementById('revenueToday').textContent = this.formatCurrency(todayRevenue);
        document.getElementById('totalRevenue').textContent = this.formatCurrency(totalRevenue);
      }
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  }

  async loadEnergy(devices = null) {
    try {
      // Use provided devices or fetch
      let devicesResult = { status: 'success', devices: devices || [] };
      
      if (!devices) {
        const devicesResponse = await this.fetchWithRetry(`${this.API_BASE}/devices`);
        if (devicesResponse) {
          devicesResult = devicesResponse;
        }
      }
      
      if (devicesResult.status === 'success' && devicesResult.devices) {
        let totalEnergyToday = 0;
        let totalEnergyLifetime = 0;
        
        for (const device of devicesResult.devices) {
          // Today's energy with delay between requests
          try {
            const todayResult = await this.fetchWithRetry(`${this.API_BASE}/analytics/energy?deviceId=${device.device_id}&period=7days`);
            await this.delay(50); // Small delay between device requests
          
            if (todayResult && todayResult.status === 'success') {
              const todayData = todayResult.analytics.daily_data;
              if (todayData && todayData.length > 0) {
                totalEnergyToday += todayData[todayData.length - 1]?.energy || 0;
              }
              totalEnergyLifetime += todayResult.analytics.total_energy || 0;
            }
          } catch (error) {
            console.error(`Error loading energy for device ${device.device_id}:`, error);
          }
        }
        
        document.getElementById('energyToday').textContent = totalEnergyToday.toFixed(1);
        document.getElementById('totalEnergy').textContent = (totalEnergyLifetime / 1000).toFixed(1);
      }
    } catch (error) {
      console.error('Error loading energy:', error);
    }
  }

  async loadBattery(devices = null) {
    try {
      // Use provided devices or fetch
      let devicesResult = { status: 'success', devices: devices || [] };
      
      if (!devices) {
        const devicesResponse = await this.fetchWithRetry(`${this.API_BASE}/devices`);
        if (devicesResponse) {
          devicesResult = devicesResponse;
        }
      }
      
      if (devicesResult.status === 'success' && devicesResult.devices) {
        let totalCharge = 0;
        let totalDischarge = 0;
        
        for (const device of devicesResult.devices) {
          const batteryResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/battery`);
          const batteryResult = await batteryResponse.json();
          
          if (batteryResult.status === 'success' && batteryResult.data.today) {
            totalCharge += batteryResult.data.today.total_charge || 0;
            totalDischarge += batteryResult.data.today.total_discharge || 0;
          }
        }
        
        document.getElementById('chargeToday').textContent = totalCharge.toFixed(1);
        document.getElementById('dischargeToday').textContent = totalDischarge.toFixed(1);
      }
    } catch (error) {
      console.error('Error loading battery:', error);
    }
  }

  async loadPlantStatus() {
    try {
      const response = await fetch(`${this.API_BASE}/analytics/plants/status`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const stats = result.statistics;
        
        document.getElementById('plantCount').textContent = stats.total;
        document.getElementById('plantNormal').textContent = stats.normal;
        document.getElementById('plantError').textContent = stats.error;
        document.getElementById('plantDisconnected').textContent = stats.disconnected;
        
        this.renderPlantGauge(stats);
      }
    } catch (error) {
      console.error('Error loading plant status:', error);
    }
  }

  async loadAlerts() {
    try {
      const response = await fetch(`${this.API_BASE}/analytics/alarms?aggregate=true`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const stats = result.statistics;
        
        document.getElementById('alertCount').textContent = stats.total;
        document.getElementById('alertCritical').textContent = stats.by_severity.CRITICAL || 0;
        document.getElementById('alertMajor').textContent = stats.by_severity.MAJOR || 0;
        document.getElementById('alertMinor').textContent = stats.by_severity.MINOR || 0;
        document.getElementById('alertWarning').textContent = stats.by_severity.WARNING || 0;
        
        this.renderAlertGauge(stats);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  async loadEnvironmental() {
    try {
      const response = await fetch(`${this.API_BASE}/analytics/environmental?period=lifetime`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const env = result.analytics.environmental;
        
        document.getElementById('coalSaved').textContent = env.coal_saved.toFixed(2);
        document.getElementById('co2Avoided').textContent = env.co2_avoided.toFixed(2);
        document.getElementById('treesEquivalent').textContent = env.trees_equivalent;
      }
    } catch (error) {
      console.error('Error loading environmental:', error);
    }
  }

  renderPlantGauge(stats) {
    const canvas = document.getElementById('plantGauge');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const lineWidth = 20;
    
    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Calculate percentages
    const normalPercent = stats.total > 0 ? (stats.normal / stats.total) : 0;
    const errorPercent = stats.total > 0 ? (stats.error / stats.total) : 0;
    const disconnectedPercent = stats.total > 0 ? (stats.disconnected / stats.total) : 0;
    
    // Draw segments
    let currentAngle = -Math.PI / 2;
    
    // Normal (green)
    if (normalPercent > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + (normalPercent * Math.PI * 2));
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      currentAngle += normalPercent * Math.PI * 2;
    }
    
    // Error (orange)
    if (errorPercent > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + (errorPercent * Math.PI * 2));
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      currentAngle += errorPercent * Math.PI * 2;
    }
    
    // Disconnected (red)
    if (disconnectedPercent > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + (disconnectedPercent * Math.PI * 2));
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  renderAlertGauge(stats) {
    const canvas = document.getElementById('alertGauge');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const lineWidth = 20;
    
    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Calculate total for percentage
    const maxAlerts = 10; // Scale factor
    const alertPercent = Math.min(stats.total / maxAlerts, 1);
    
    // Draw alert arc (orange)
    if (alertPercent > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (alertPercent * Math.PI * 2));
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(value));
  }

  async loadInverterStatus() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices) {
        let totalOnline = 0;
        let totalInverters = 0;
        
        for (const device of devicesResult.devices) {
          const realtimeResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/realtime`);
          const realtimeResult = await realtimeResponse.json();
          
          if (realtimeResult.status === 'success' && realtimeResult.data) {
            const system = realtimeResult.data.system || {};
            // Support both old and new schema
            const online = system.online_inverters || 0;
            const total = system.total_inverters || 0;
            totalOnline += online;
            totalInverters += total;
          }
        }
        
        const statusEl = document.getElementById('inverterStatus');
        const healthEl = document.getElementById('inverterHealthPercent');
        
        if (statusEl) {
          statusEl.textContent = `${totalOnline} / ${totalInverters}`;
        }
        
        if (healthEl && totalInverters > 0) {
          const healthPercent = ((totalOnline / totalInverters) * 100).toFixed(1);
          healthEl.textContent = `Tỷ lệ: ${healthPercent}%`;
          
          // Color based on health
          if (parseFloat(healthPercent) >= 90) {
            healthEl.style.color = '#4caf50';
          } else if (parseFloat(healthPercent) >= 70) {
            healthEl.style.color = '#ff9800';
          } else {
            healthEl.style.color = '#f44336';
          }
        }
      }
    } catch (error) {
      console.error('Error loading inverter status:', error);
    }
  }

  async loadBatteryHealth() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices) {
        let totalSOH = 0;
        let totalSOC = 0;
        let batteryCount = 0;
        
        for (const device of devicesResult.devices) {
          const batteryResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/battery`);
          const batteryResult = await batteryResponse.json();
          
          if (batteryResult.status === 'success' && batteryResult.data.current) {
            const battery = Array.isArray(batteryResult.data.current) 
              ? batteryResult.data.current[0] 
              : batteryResult.data.current;
            
            if (battery) {
              // Support both old (soc) and new (soc_percent) schema
              const soc = battery.soc_percent || battery.soc || 0;
              const soh = battery.soh_percent || battery.soh || 0;
              
              if (soh > 0) {
                totalSOH += soh;
                totalSOC += soc;
                batteryCount++;
              }
            }
          }
        }
        
        const sohEl = document.getElementById('batterySOH');
        const socEl = document.getElementById('batterySOC');
        
        if (sohEl && batteryCount > 0) {
          const avgSOH = (totalSOH / batteryCount).toFixed(1);
          sohEl.textContent = avgSOH;
          
          // Color based on SOH
          if (parseFloat(avgSOH) >= 80) {
            sohEl.style.color = '#4caf50';
          } else if (parseFloat(avgSOH) >= 60) {
            sohEl.style.color = '#ff9800';
          } else {
            sohEl.style.color = '#f44336';
          }
        }
        
        if (socEl && batteryCount > 0) {
          const avgSOC = (totalSOC / batteryCount).toFixed(1);
          socEl.textContent = `SOC: ${avgSOC}%`;
        }
      }
    } catch (error) {
      console.error('Error loading battery health:', error);
    }
  }

  async loadTemperature() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices && devicesResult.devices.length > 0) {
        // Get first device for temperature
        const device = devicesResult.devices[0];
        const realtimeResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/realtime`);
        const realtimeResult = await realtimeResponse.json();
        
        if (realtimeResult.status === 'success' && realtimeResult.data) {
          const inverters = realtimeResult.data.inverters || [];
          let totalTemp = 0;
          let totalAmbient = 0;
          let count = 0;
          
          inverters.forEach(inv => {
            // Support new schema (nested)
            const isNewSchema = inv.thermal_hardware || inv.info;
            
            if (isNewSchema && inv.thermal_hardware) {
              const temp = inv.thermal_hardware.inverter_temp_c || 0;
              const ambient = inv.thermal_hardware.ambient_temp_c || 0;
              
              if (temp > 0) {
                totalTemp += temp;
                totalAmbient += ambient;
                count++;
              }
            } else if (inv.internal_temp) {
              // Old schema
              totalTemp += inv.internal_temp || 0;
              count++;
            }
          });
          
          const tempEl = document.getElementById('inverterTemp');
          const ambientEl = document.getElementById('ambientTemp');
          
          if (tempEl && count > 0) {
            const avgTemp = (totalTemp / count).toFixed(1);
            tempEl.textContent = avgTemp;
            
            // Color based on temperature
            if (parseFloat(avgTemp) <= 50) {
              tempEl.style.color = '#4caf50';
            } else if (parseFloat(avgTemp) <= 60) {
              tempEl.style.color = '#ff9800';
            } else {
              tempEl.style.color = '#f44336';
            }
          }
          
          if (ambientEl && count > 0) {
            const avgAmbient = (totalAmbient / count).toFixed(1);
            ambientEl.textContent = `Môi trường: ${avgAmbient}°C`;
          }
        }
      }
    } catch (error) {
      console.error('Error loading temperature:', error);
    }
  }

  async loadGridFrequency() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices && devicesResult.devices.length > 0) {
        // Get first device for frequency
        const device = devicesResult.devices[0];
        const realtimeResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/realtime`);
        const realtimeResult = await realtimeResponse.json();
        
        if (realtimeResult.status === 'success' && realtimeResult.data) {
          const inverters = realtimeResult.data.inverters || [];
          let totalFreq = 0;
          let count = 0;
          
          inverters.forEach(inv => {
            // Support new schema (nested)
            const isNewSchema = inv.grid_interaction || inv.info;
            
            if (isNewSchema && inv.grid_interaction) {
              const freq = inv.grid_interaction.frequency_hz || 0;
              if (freq > 0) {
                totalFreq += freq;
                count++;
              }
            } else if (inv.grid_frequency) {
              // Old schema
              totalFreq += inv.grid_frequency || 0;
              count++;
            }
          });
          
          const freqEl = document.getElementById('gridFrequency');
          const statusEl = document.getElementById('gridFrequencyStatus');
          
          if (freqEl && count > 0) {
            const avgFreq = (totalFreq / count).toFixed(2);
            freqEl.textContent = avgFreq;
            
            // Color based on frequency (50 Hz ± 0.5 Hz is normal)
            if (parseFloat(avgFreq) >= 49.5 && parseFloat(avgFreq) <= 50.5) {
              freqEl.style.color = '#4caf50';
              if (statusEl) statusEl.textContent = 'Bình thường';
              if (statusEl) statusEl.style.color = '#4caf50';
            } else {
              freqEl.style.color = '#f44336';
              if (statusEl) statusEl.textContent = 'Cảnh báo';
              if (statusEl) statusEl.style.color = '#f44336';
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading grid frequency:', error);
    }
  }

  async loadOperatingState() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices) {
        const stateCounts = {
          work_mode: { normal: 0, standby: 0, fault: 0 },
          grid_mode: { on_grid: 0, off_grid: 0 }
        };
        
        for (const device of devicesResult.devices) {
          const realtimeResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/realtime`);
          const realtimeResult = await realtimeResponse.json();
          
          if (realtimeResult.status === 'success' && realtimeResult.data) {
            const inverters = realtimeResult.data.inverters || [];
            
            inverters.forEach(inv => {
              // Support new schema (nested)
              if (inv.operating_state) {
                const workMode = inv.operating_state.work_mode || 'unknown';
                const gridMode = inv.operating_state.grid_mode || 'unknown';
                
                if (workMode in stateCounts.work_mode) {
                  stateCounts.work_mode[workMode]++;
                }
                if (gridMode in stateCounts.grid_mode) {
                  stateCounts.grid_mode[gridMode]++;
                }
              }
            });
          }
        }
        
        const gridEl = document.getElementById('operatingStateGrid');
        if (gridEl) {
          gridEl.innerHTML = `
            <div class="state-item normal">
              <div class="state-label">Work Mode: Normal</div>
              <div class="state-value">${stateCounts.work_mode.normal}</div>
              <div class="state-count">Inverter</div>
            </div>
            <div class="state-item standby">
              <div class="state-label">Work Mode: Standby</div>
              <div class="state-value">${stateCounts.work_mode.standby}</div>
              <div class="state-count">Inverter</div>
            </div>
            <div class="state-item fault">
              <div class="state-label">Work Mode: Fault</div>
              <div class="state-value">${stateCounts.work_mode.fault}</div>
              <div class="state-count">Inverter</div>
            </div>
            <div class="state-item on-grid">
              <div class="state-label">Grid Mode: On Grid</div>
              <div class="state-value">${stateCounts.grid_mode.on_grid}</div>
              <div class="state-count">Inverter</div>
            </div>
            <div class="state-item off-grid">
              <div class="state-label">Grid Mode: Off Grid</div>
              <div class="state-value">${stateCounts.grid_mode.off_grid}</div>
              <div class="state-count">Inverter</div>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error loading operating state:', error);
    }
  }

  setupAutoRefresh() {
    // Refresh every 5 minutes
    setInterval(() => {
      this.loadData();
    }, 5 * 60 * 1000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new OverviewDashboard();
    dashboard.init();
  });
} else {
  const dashboard = new OverviewDashboard();
  dashboard.init();
}

