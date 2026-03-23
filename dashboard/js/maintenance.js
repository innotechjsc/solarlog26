// Maintenance Dashboard Script
class MaintenanceDashboard {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.maintenanceSchedule = [];
  }

  init() {
    this.loadMaintenanceData();
    this.setupChecklistListeners();
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  async loadMaintenanceData() {
    try {
      await Promise.all([
        this.loadAlerts(),
        this.loadMaintenanceSchedule()
      ]);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    }
  }

  async loadAlerts() {
    try {
      const response = await fetch(`${this.API_BASE}/analytics/alarms?aggregate=true`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const stats = result.statistics;
        
        document.getElementById('totalAlerts').textContent = stats.total;
        
        // Load active alerts for display
        await this.loadActiveAlerts();
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  async loadActiveAlerts() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        const alertsContainer = document.getElementById('alertsList');
        alertsContainer.innerHTML = '';
        
        const allAlerts = [];
        
        // Get alerts from all devices
        for (const device of devicesResult.devices.slice(0, 10)) {
          try {
            const alertsResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/alarms?status=ACTIVE&limit=5`);
            const alertsResult = await alertsResponse.json();
            
            if (alertsResult.status === 'success' && alertsResult.alarms) {
              allAlerts.push(...alertsResult.alarms.map(a => ({
                ...a,
                device_id: device.device_id,
                site_name: device.site_name || device.device_id
              })));
            }
          } catch (error) {
            console.error(`Error loading alerts for device ${device.device_id}:`, error);
          }
        }
        
        // Sort by severity (CRITICAL > MAJOR > MINOR > WARNING)
        const severityOrder = { 'CRITICAL': 0, 'MAJOR': 1, 'MINOR': 2, 'WARNING': 3 };
        allAlerts.sort((a, b) => {
          return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
        });
        
        if (allAlerts.length === 0) {
          alertsContainer.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">✅</div>
              <p>Không có cảnh báo nào cần xử lý</p>
            </div>
          `;
          return;
        }
        
        allAlerts.slice(0, 10).forEach(alert => {
          const alertItem = document.createElement('div');
          alertItem.className = `alert-item ${alert.severity.toLowerCase()}`;
          
          const startTime = new Date(alert.start_time);
          const timeAgo = this.getTimeAgo(startTime);
          
          alertItem.innerHTML = `
            <div class="alert-header">
              <div>
                <div class="alert-title">${alert.description || `Cảnh báo ${alert.alarm_code}`}</div>
                <div class="alert-description">Thiết bị: ${alert.site_name || alert.device_id}</div>
              </div>
              <span class="alert-severity ${alert.severity.toLowerCase()}">${this.getSeverityLabel(alert.severity)}</span>
            </div>
            <div class="alert-meta">
              Mã cảnh báo: ${alert.alarm_code} | Bắt đầu: ${startTime.toLocaleString('vi-VN')} (${timeAgo})
            </div>
          `;
          
          alertsContainer.appendChild(alertItem);
        });
      }
    } catch (error) {
      console.error('Error loading active alerts:', error);
      document.getElementById('alertsList').innerHTML = '<div class="empty-state">Lỗi khi tải dữ liệu</div>';
    }
  }

  async loadMaintenanceSchedule() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        const schedule = [];
        const now = new Date();
        
        // Generate maintenance schedule based on device data
        devicesResult.devices.forEach(device => {
          const lastSeen = new Date(device.last_seen);
          const daysSinceLastSeen = Math.floor((now - lastSeen) / (1000 * 60 * 60 * 24));
          
          // Weekly maintenance (every 7 days)
          const lastWeeklyMaintenance = new Date(device.metadata?.last_maintenance || device.last_seen);
          const nextWeeklyMaintenance = new Date(lastWeeklyMaintenance);
          nextWeeklyMaintenance.setDate(nextWeeklyMaintenance.getDate() + 7);
          
          // Monthly maintenance (every 30 days)
          const lastMonthlyMaintenance = new Date(device.metadata?.last_maintenance || device.last_seen);
          const nextMonthlyMaintenance = new Date(lastMonthlyMaintenance);
          nextMonthlyMaintenance.setDate(nextMonthlyMaintenance.getDate() + 30);
          
          // Quarterly maintenance (every 90 days)
          const lastQuarterlyMaintenance = new Date(device.metadata?.last_maintenance || device.last_seen);
          const nextQuarterlyMaintenance = new Date(lastQuarterlyMaintenance);
          nextQuarterlyMaintenance.setDate(nextQuarterlyMaintenance.getDate() + 90);
          
          schedule.push({
            device_id: device.device_id,
            site_name: device.site_name || device.device_id,
            type: 'weekly',
            dueDate: nextWeeklyMaintenance,
            lastMaintenance: lastWeeklyMaintenance
          });
          
          schedule.push({
            device_id: device.device_id,
            site_name: device.site_name || device.device_id,
            type: 'monthly',
            dueDate: nextMonthlyMaintenance,
            lastMaintenance: lastMonthlyMaintenance
          });
          
          schedule.push({
            device_id: device.device_id,
            site_name: device.site_name || device.device_id,
            type: 'quarterly',
            dueDate: nextQuarterlyMaintenance,
            lastMaintenance: lastQuarterlyMaintenance
          });
        });
        
        // Sort by due date
        schedule.sort((a, b) => a.dueDate - b.dueDate);
        this.maintenanceSchedule = schedule;
        
        this.renderMaintenanceSchedule();
        this.updateMaintenanceStats();
      }
    } catch (error) {
      console.error('Error loading maintenance schedule:', error);
      document.getElementById('maintenanceList').innerHTML = '<div class="empty-state">Lỗi khi tải dữ liệu</div>';
    }
  }

  renderMaintenanceSchedule() {
    const container = document.getElementById('maintenanceList');
    container.innerHTML = '';
    
    if (this.maintenanceSchedule.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p>Không có lịch bảo trì</p>
        </div>
      `;
      return;
    }
    
    const now = new Date();
    
    this.maintenanceSchedule.forEach(item => {
      const daysUntilDue = Math.floor((item.dueDate - now) / (1000 * 60 * 60 * 24));
      let statusClass = 'upcoming';
      let statusText = 'Sắp đến';
      
      if (daysUntilDue < 0) {
        statusClass = 'overdue';
        statusText = `Quá hạn ${Math.abs(daysUntilDue)} ngày`;
      } else if (daysUntilDue <= 3) {
        statusClass = 'due-soon';
        statusText = `Đến hạn trong ${daysUntilDue} ngày`;
      } else {
        statusText = `Đến hạn trong ${daysUntilDue} ngày`;
      }
      
      const maintenanceItem = document.createElement('div');
      maintenanceItem.className = `maintenance-item ${statusClass}`;
      
      const icon = this.getMaintenanceIcon(item.type);
      const typeLabel = this.getMaintenanceTypeLabel(item.type);
      
      maintenanceItem.innerHTML = `
        <div class="maintenance-icon">${icon}</div>
        <div class="maintenance-content">
          <div class="maintenance-title">${typeLabel} - ${item.site_name}</div>
          <div class="maintenance-meta">
            ${statusText} | Lần bảo trì cuối: ${item.lastMaintenance.toLocaleDateString('vi-VN')} | 
            Đến hạn: ${item.dueDate.toLocaleDateString('vi-VN')}
          </div>
        </div>
        <div class="maintenance-actions">
          <button class="btn btn-primary" onclick="maintenanceDashboard.completeMaintenance('${item.device_id}', '${item.type}')">
            Hoàn thành
          </button>
        </div>
      `;
      
      container.appendChild(maintenanceItem);
    });
  }

  updateMaintenanceStats() {
    const now = new Date();
    let upcoming = 0;
    let overdue = 0;
    let completed = 0;
    
    this.maintenanceSchedule.forEach(item => {
      const daysUntilDue = Math.floor((item.dueDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        overdue++;
      } else if (daysUntilDue <= 7) {
        upcoming++;
      }
      
      // Count completed this month
      const lastMaintenance = new Date(item.lastMaintenance);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (lastMaintenance >= thisMonth) {
        completed++;
      }
    });
    
    document.getElementById('upcomingMaintenance').textContent = upcoming;
    document.getElementById('overdueMaintenance').textContent = overdue;
    document.getElementById('completedThisMonth').textContent = completed;
  }

  completeMaintenance(deviceId, type) {
    // In a real implementation, this would update the database
    alert(`Đã hoàn thành bảo trì ${this.getMaintenanceTypeLabel(type)} cho thiết bị ${deviceId}`);
    
    // Update local schedule
    const item = this.maintenanceSchedule.find(m => m.device_id === deviceId && m.type === type);
    if (item) {
      item.lastMaintenance = new Date();
      const daysToAdd = type === 'weekly' ? 7 : type === 'monthly' ? 30 : 90;
      item.dueDate = new Date(item.lastMaintenance);
      item.dueDate.setDate(item.dueDate.getDate() + daysToAdd);
      
      this.renderMaintenanceSchedule();
      this.updateMaintenanceStats();
    }
  }

  setupChecklistListeners() {
    // Load saved checklist state from localStorage
    for (let i = 1; i <= 8; i++) {
      const checkbox = document.getElementById(`check${i}`);
      const saved = localStorage.getItem(`maintenance_check_${i}`);
      if (saved === 'true') {
        checkbox.checked = true;
        checkbox.closest('.checklist-item').classList.add('completed');
      }
      
      checkbox.addEventListener('change', (e) => {
        const item = e.target.closest('.checklist-item');
        if (e.target.checked) {
          item.classList.add('completed');
          localStorage.setItem(`maintenance_check_${i}`, 'true');
        } else {
          item.classList.remove('completed');
          localStorage.removeItem(`maintenance_check_${i}`);
        }
      });
    }
  }

  getMaintenanceIcon(type) {
    const icons = {
      'weekly': '🔧',
      'monthly': '⚙️',
      'quarterly': '🔩'
    };
    return icons[type] || '📋';
  }

  getMaintenanceTypeLabel(type) {
    const labels = {
      'weekly': 'Bảo trì hàng tuần',
      'monthly': 'Bảo trì hàng tháng',
      'quarterly': 'Bảo trì hàng quý'
    };
    return labels[type] || type;
  }

  getSeverityLabel(severity) {
    const labels = {
      'CRITICAL': 'Nghiêm trọng',
      'MAJOR': 'Lớn',
      'MINOR': 'Nhỏ',
      'WARNING': 'Cảnh báo'
    };
    return labels[severity] || severity;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else {
      return `${diffDays} ngày trước`;
    }
  }
}

// Initialize when DOM is ready
const maintenanceDashboard = new MaintenanceDashboard();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    maintenanceDashboard.init();
  });
} else {
  maintenanceDashboard.init();
}

