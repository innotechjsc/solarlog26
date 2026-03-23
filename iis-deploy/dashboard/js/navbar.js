// Navigation Bar Component
class Navbar {
  constructor() {
    this.currentLanguage = 'vi';
    this.currentTimezone = 'Asia/Ho_Chi_Minh';
    this.notificationCount = 0;
  }

  init() {
    this.render();
    this.loadNotifications();
    this.setupEventListeners();
  }

  render() {
    const navbarHTML = `
      <nav class="top-nav">
        <div class="nav-container">
          <div class="nav-left">
            <div class="nav-brand">
              <div class="brand-icon">⚡</div>
              <div class="brand-text">
                <div class="brand-title">SolarPower</div>
                <div class="brand-subtitle">Energy Management</div>
              </div>
            </div>
            <div class="nav-menu">
              <a href="/dashboard/overview.html" class="nav-link" data-page="overview">Tổng quan</a>
              <a href="/dashboard/monitoring.html" class="nav-link" data-page="monitoring">Giám sát</a>
              <a href="/dashboard/ac-measurements.html" class="nav-link" data-page="ac-measurements">AC 3 Pha</a>
              <a href="/dashboard/grid-interaction.html" class="nav-link" data-page="grid-interaction">Tương tác lưới</a>
              <a href="/dashboard/pv-mppt.html" class="nav-link" data-page="pv-mppt">PV MPPT</a>
              <a href="/dashboard/performance.html" class="nav-link" data-page="performance">Hiệu suất</a>
              <a href="/dashboard/maintenance.html" class="nav-link" data-page="maintenance">Bảo trì</a>
              <a href="/dashboard/ai-diagnosis.html" class="nav-link" data-page="ai-diagnosis">Chẩn đoán AI</a>
              <a href="/dashboard/logs.html" class="nav-link" data-page="logs">API Logs</a>
              <a href="/reports" class="nav-link" data-page="reports">Báo Cáo</a>
            </div>
          </div>
          <div class="nav-right">
            <button class="nav-icon-btn" id="refreshBtn" title="Làm mới">
              <span>🔄</span>
            </button>
            <select class="nav-select" id="languageSelect">
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
            <select class="nav-select" id="timezoneSelect">
              <option value="Asia/Ho_Chi_Minh">UTC+7 (Hà Nội)</option>
              <option value="Asia/Bangkok">UTC+7 (Bangkok)</option>
              <option value="UTC">UTC</option>
            </select>
            <button class="nav-icon-btn notification-btn" id="notificationBtn" title="Thông báo">
              <span>🔔</span>
              <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
            </button>
            <button class="nav-icon-btn" id="helpBtn" title="Trợ giúp">
              <span>❓</span>
            </button>
            <button class="nav-icon-btn user-btn" id="userBtn" title="Người dùng">
              <span>👤</span>
            </button>
          </div>
        </div>
      </nav>
    `;
    
    // Insert navbar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Highlight current page
    let currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Handle reports page
    if (window.location.pathname.includes('/reports')) {
      currentPage = 'reports';
    }
    
    // Default to overview if no match
    if (!currentPage || currentPage === 'index' || currentPage === '') {
      currentPage = 'overview';
    }
    
    document.querySelector(`[data-page="${currentPage}"]`)?.classList.add('active');
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      window.location.reload();
    });

    // Language selector
    document.getElementById('languageSelect')?.addEventListener('change', (e) => {
      this.currentLanguage = e.target.value;
      this.onLanguageChange(e.target.value);
    });

    // Timezone selector
    document.getElementById('timezoneSelect')?.addEventListener('change', (e) => {
      this.currentTimezone = e.target.value;
      this.onTimezoneChange(e.target.value);
    });

    // Notification button
    document.getElementById('notificationBtn')?.addEventListener('click', () => {
      this.showNotifications();
    });

    // Help button
    document.getElementById('helpBtn')?.addEventListener('click', () => {
      window.open('/api-docs', '_blank');
    });

    // User button
    document.getElementById('userBtn')?.addEventListener('click', () => {
      this.showUserMenu();
    });
  }

  async loadNotifications() {
    try {
      const API_BASE = this.getApiBase();
      const response = await fetch(`${API_BASE}/analytics/alarms?aggregate=true&status=ACTIVE`);
      const result = await response.json();
      
      if (result.status === 'success') {
        this.notificationCount = result.statistics?.total || 0;
        this.updateNotificationBadge();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      if (this.notificationCount > 0) {
        badge.textContent = this.notificationCount > 99 ? '99+' : this.notificationCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  onLanguageChange(lang) {
    // Store in localStorage
    localStorage.setItem('language', lang);
    // Reload page to apply language
    // In a real app, you would use i18n library
    console.log('Language changed to:', lang);
  }

  onTimezoneChange(timezone) {
    // Store in localStorage
    localStorage.setItem('timezone', timezone);
    // Trigger timezone change event
    window.dispatchEvent(new CustomEvent('timezoneChanged', { detail: { timezone } }));
  }

  showNotifications() {
    // Open notifications panel or modal
    alert(`Bạn có ${this.notificationCount} thông báo mới`);
  }

  showUserMenu() {
    // Show user menu dropdown
    alert('User menu');
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }
}

// Initialize navbar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const navbar = new Navbar();
    navbar.init();
  });
} else {
  const navbar = new Navbar();
  navbar.init();
}

