// Power Flow Diagram Component
class PowerFlowDiagram {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.currentData = null;
    this.updateInterval = null;
  }

  init() {
    this.render();
    this.loadData();
    this.setupAutoRefresh();
    
    // Listen for device selection
    window.addEventListener('deviceSelected', (e) => {
      this.loadData(e.detail.device_id);
    });
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  render() {
    const container = document.getElementById('powerFlowDiagram');
    if (!container) return;

    container.innerHTML = `
      <svg width="100%" height="300" viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
        <!-- PV -->
        <g id="pv-group">
          <rect x="50" y="100" width="120" height="80" rx="8" fill="#fff3e0" stroke="#ff9800" stroke-width="2"/>
          <text x="110" y="135" text-anchor="middle" font-size="14" font-weight="600">PV</text>
          <text x="110" y="155" text-anchor="middle" font-size="18" font-weight="600" fill="#ff9800" id="pv-power">0.0</text>
          <text x="110" y="175" text-anchor="middle" font-size="12" fill="#666">kW</text>
        </g>

        <!-- Battery -->
        <g id="battery-group">
          <rect x="250" y="100" width="120" height="80" rx="8" fill="#e8f5e9" stroke="#4caf50" stroke-width="2"/>
          <text x="310" y="135" text-anchor="middle" font-size="14" font-weight="600">Pin</text>
          <text x="310" y="155" text-anchor="middle" font-size="16" font-weight="600" fill="#4caf50" id="battery-soc">0%</text>
          <text x="310" y="175" text-anchor="middle" font-size="12" fill="#666" id="battery-power">0.0 kW</text>
        </g>

        <!-- Load -->
        <g id="load-group">
          <rect x="450" y="100" width="120" height="80" rx="8" fill="#f3e5f5" stroke="#9c27b0" stroke-width="2"/>
          <text x="510" y="135" text-anchor="middle" font-size="14" font-weight="600">Tải</text>
          <text x="510" y="155" text-anchor="middle" font-size="18" font-weight="600" fill="#9c27b0" id="load-power">0.0</text>
          <text x="510" y="175" text-anchor="middle" font-size="12" fill="#666">kW</text>
        </g>

        <!-- Grid -->
        <g id="grid-group">
          <rect x="250" y="220" width="120" height="60" rx="8" fill="#e3f2fd" stroke="#2196f3" stroke-width="2"/>
          <text x="310" y="250" text-anchor="middle" font-size="14" font-weight="600">Lưới</text>
          <text x="310" y="270" text-anchor="middle" font-size="16" font-weight="600" fill="#2196f3" id="grid-power">0.0</text>
          <text x="310" y="285" text-anchor="middle" font-size="12" fill="#666">kW</text>
        </g>

        <!-- Arrows -->
        <!-- PV to Battery -->
        <path id="arrow-pv-battery" d="M 170 140 L 250 140" stroke="#4caf50" stroke-width="3" fill="none" marker-end="url(#arrowhead-green)"/>
        <text x="210" y="130" text-anchor="middle" font-size="11" fill="#4caf50" id="label-pv-battery">0.0 kW</text>

        <!-- PV to Load -->
        <path id="arrow-pv-load" d="M 170 140 Q 310 140 450 140" stroke="#9c27b0" stroke-width="3" fill="none" marker-end="url(#arrowhead-purple)"/>
        <text x="310" y="125" text-anchor="middle" font-size="11" fill="#9c27b0" id="label-pv-load">0.0 kW</text>

        <!-- Battery to Load -->
        <path id="arrow-battery-load" d="M 370 140 L 450 140" stroke="#9c27b0" stroke-width="3" fill="none" marker-end="url(#arrowhead-purple)"/>
        <text x="410" y="130" text-anchor="middle" font-size="11" fill="#9c27b0" id="label-battery-load">0.0 kW</text>

        <!-- Battery to Grid -->
        <path id="arrow-battery-grid" d="M 310 180 L 310 220" stroke="#2196f3" stroke-width="3" fill="none" marker-end="url(#arrowhead-blue)"/>
        <text x="325" y="200" text-anchor="middle" font-size="11" fill="#2196f3" id="label-battery-grid">0.0 kW</text>

        <!-- Grid to Load -->
        <path id="arrow-grid-load" d="M 370 250 Q 410 250 450 180" stroke="#2196f3" stroke-width="3" fill="none" marker-end="url(#arrowhead-blue)"/>
        <text x="410" y="220" text-anchor="middle" font-size="11" fill="#2196f3" id="label-grid-load">0.0 kW</text>

        <!-- Arrow markers -->
        <defs>
          <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#4caf50"/>
          </marker>
          <marker id="arrowhead-purple" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#9c27b0"/>
          </marker>
          <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#2196f3"/>
          </marker>
        </defs>
      </svg>
    `;
  }

  async loadData(deviceId = null) {
    try {
      // If no device selected, get first device
      if (!deviceId) {
        const devicesResponse = await fetch(`${this.API_BASE}/devices`);
        const devicesResult = await devicesResponse.json();
        
        if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
          deviceId = devicesResult.devices[0].device_id;
        } else {
          return;
        }
      }

      const response = await fetch(`${this.API_BASE}/devices/${deviceId}/realtime`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        this.currentData = result.data;
        this.updateDiagram(result.data);
        this.updateLastUpdate(result.data.timestamp);
      }
    } catch (error) {
      console.error('Error loading power flow data:', error);
    }
  }

  updateDiagram(data) {
    const system = data.system || {};
    const battery = data.battery || {};
    const powerFlow = data.power_flow || {};

    // PV Power (total AC power)
    const pvPower = system.total_ac_power || 0;
    document.getElementById('pv-power').textContent = pvPower.toFixed(2);

    // Battery
    const batterySOC = battery.soc || 0;
    const batteryPower = (battery.charge_power || 0) - (battery.discharge_power || 0);
    document.getElementById('battery-soc').textContent = `${batterySOC}%`;
    document.getElementById('battery-power').textContent = `${Math.abs(batteryPower).toFixed(2)} kW`;

    // Load (estimated from power flow or system)
    const loadPower = powerFlow.pv_to_home || powerFlow.battery_to_home || powerFlow.grid_to_home || 0;
    document.getElementById('load-power').textContent = loadPower.toFixed(2);

    // Grid
    const gridPower = (powerFlow.pv_to_grid || 0) + (powerFlow.battery_to_grid || 0) - (powerFlow.grid_to_home || 0);
    document.getElementById('grid-power').textContent = Math.abs(gridPower).toFixed(2);

    // Update arrows and labels
    const pvToBattery = powerFlow.pv_to_battery || 0;
    const pvToLoad = powerFlow.pv_to_home || 0;
    const batteryToLoad = powerFlow.battery_to_home || 0;
    const batteryToGrid = powerFlow.battery_to_grid || 0;
    const gridToLoad = powerFlow.grid_to_home || 0;

    document.getElementById('label-pv-battery').textContent = `${pvToBattery.toFixed(2)} kW`;
    document.getElementById('label-pv-load').textContent = `${pvToLoad.toFixed(2)} kW`;
    document.getElementById('label-battery-load').textContent = `${batteryToLoad.toFixed(2)} kW`;
    document.getElementById('label-battery-grid').textContent = `${batteryToGrid.toFixed(2)} kW`;
    document.getElementById('label-grid-load').textContent = `${gridToLoad.toFixed(2)} kW`;

    // Show/hide arrows based on power flow
    document.getElementById('arrow-pv-battery').style.display = pvToBattery > 0 ? 'block' : 'none';
    document.getElementById('arrow-pv-load').style.display = pvToLoad > 0 ? 'block' : 'none';
    document.getElementById('arrow-battery-load').style.display = batteryToLoad > 0 ? 'block' : 'none';
    document.getElementById('arrow-battery-grid').style.display = batteryToGrid > 0 ? 'block' : 'none';
    document.getElementById('arrow-grid-load').style.display = gridToLoad > 0 ? 'block' : 'none';
  }

  updateLastUpdate(timestamp) {
    if (!timestamp) return;
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    const updateText = diffMinutes < 1 ? 'Vừa xong' : `${diffMinutes} phút trước`;
    document.getElementById('lastUpdate').textContent = updateText;
  }

  setupAutoRefresh() {
    // Refresh every 30 seconds
    this.updateInterval = setInterval(() => {
      if (this.currentData) {
        const deviceId = this.currentData.device_id;
        this.loadData(deviceId);
      }
    }, 30000);
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const powerFlow = new PowerFlowDiagram();
    powerFlow.init();
  });
} else {
  const powerFlow = new PowerFlowDiagram();
  powerFlow.init();
}

