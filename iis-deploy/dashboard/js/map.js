// Map Component with Leaflet.js
class PlantMap {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.map = null;
    this.markers = [];
  }

  init() {
    this.initMap();
    this.loadPlantLocations();
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  initMap() {
    const container = document.getElementById('mapContainer');
    if (!container) return;

    // Initialize map centered on Vietnam
    this.map = L.map('mapContainer').setView([16.0583, 108.2772], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
  }

  async loadPlantLocations() {
    try {
      const response = await fetch(`${this.API_BASE}/projects/locations`);
      const result = await response.json();

      if (result.status === 'success' && result.locations) {
        result.locations.forEach(location => {
          if (location.location && location.location.latitude && location.location.longitude) {
            this.addMarker(location);
          }
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
          const group = new L.featureGroup(this.markers);
          this.map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    } catch (error) {
      console.error('Error loading plant locations:', error);
    }
  }

  async addMarker(location) {
    const lat = location.location.latitude;
    const lng = location.location.longitude;

    // Get device data for this project to show in popup
    let deviceData = null;
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success') {
        // Find devices in this project
        const projectDevices = devicesResult.devices.filter(d => {
          // Need to check if device belongs to this project
          // For now, get first device as example
          return true;
        });

        if (projectDevices.length > 0) {
          const deviceId = projectDevices[0].device_id;
          const realtimeResponse = await fetch(`${this.API_BASE}/devices/${deviceId}/realtime`);
          const realtimeResult = await realtimeResponse.json();
          
          if (realtimeResult.status === 'success') {
            deviceData = realtimeResult.data;
          }
        }
      }
    } catch (error) {
      console.error('Error loading device data for marker:', error);
    }

    // Create marker
    const marker = L.marker([lat, lng]).addTo(this.map);

    // Create popup content
    const system = deviceData?.system || {};
    const popupContent = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">${location.name}</h4>
        <div style="font-size: 12px; line-height: 1.6;">
          <div><strong>Peak Power:</strong> ${(system.total_ac_power || 0).toFixed(1)} kWp</div>
          <div><strong>PR Today:</strong> 0.0%</div>
          <div><strong>Energy Today:</strong> ${(system.energy_5min ? system.energy_5min * 288 : 0).toFixed(2)} kWh</div>
          <div><strong>Current Power:</strong> ${(system.total_ac_power || 0).toFixed(1)} kW</div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    this.markers.push(marker);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const plantMap = new PlantMap();
    plantMap.init();
  });
} else {
  const plantMap = new PlantMap();
  plantMap.init();
}

