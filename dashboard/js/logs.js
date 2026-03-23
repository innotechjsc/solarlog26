// API Logs Viewer
class LogsViewer {
  constructor() {
    this.currentPage = 1;
    this.currentLimit = 50;
    this.filters = {};
    this.apiBase = this.getApiBase();
  }

  init() {
    this.loadLogs();
    this.loadStatistics();
    this.setupEventListeners();
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  setupEventListeners() {
    // Filter buttons
    document.getElementById('applyFilters')?.addEventListener('click', () => {
      this.applyFilters();
    });

    document.getElementById('clearFilters')?.addEventListener('click', () => {
      this.clearFilters();
    });

    document.getElementById('refreshLogs')?.addEventListener('click', () => {
      this.loadLogs();
      this.loadStatistics();
    });

    // Modal close
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('logDetailModal');
    
    closeModal?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  applyFilters() {
    this.filters = {};
    
    const method = document.getElementById('filterMethod')?.value;
    const path = document.getElementById('filterPath')?.value;
    const statusCode = document.getElementById('filterStatusCode')?.value;
    const statusType = document.getElementById('filterStatusType')?.value;
    const ip = document.getElementById('filterIp')?.value;
    const startDate = document.getElementById('filterStartDate')?.value;
    const endDate = document.getElementById('filterEndDate')?.value;
    const limit = document.getElementById('filterLimit')?.value;

    if (method) this.filters.method = method;
    if (path) this.filters.path = path;
    if (statusCode) this.filters.status_code = statusCode;
    if (statusType) this.filters.status_type = statusType;
    if (ip) this.filters.ip_address = ip;
    if (startDate) {
      this.filters.start_date = new Date(startDate).toISOString();
    }
    if (endDate) {
      this.filters.end_date = new Date(endDate).toISOString();
    }
    if (limit) {
      this.currentLimit = parseInt(limit);
      this.filters.limit = limit;
    }

    this.currentPage = 1;
    this.loadLogs();
    this.loadStatistics();
  }

  clearFilters() {
    document.getElementById('filterMethod').value = '';
    document.getElementById('filterPath').value = '';
    document.getElementById('filterStatusCode').value = '';
    document.getElementById('filterStatusType').value = '';
    document.getElementById('filterIp').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('filterLimit').value = '50';
    
    this.filters = {};
    this.currentPage = 1;
    this.currentLimit = 50;
    this.loadLogs();
    this.loadStatistics();
  }

  async loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Đang tải dữ liệu...</td></tr>';

    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.currentLimit,
        ...this.filters
      });

      const response = await fetch(`${this.apiBase}/logs?${params}`);
      const result = await response.json();

      if (result.status === 'success') {
        this.renderLogs(result.logs);
        this.renderPagination(result.pagination);
        this.updateLogsInfo(result.pagination);
      } else {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Lỗi khi tải dữ liệu</td></tr>';
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      tbody.innerHTML = '<tr><td colspan="8" class="loading">Lỗi kết nối đến server</td></tr>';
    }
  }

  async loadStatistics() {
    try {
      const params = new URLSearchParams(this.filters);
      const response = await fetch(`${this.apiBase}/logs/stats?${params}`);
      const result = await response.json();

      if (result.status === 'success') {
        const stats = result.statistics;
        document.getElementById('totalRequests').textContent = stats.total_requests?.toLocaleString() || '0';
        document.getElementById('totalSuccess').textContent = stats.total_success?.toLocaleString() || '0';
        document.getElementById('totalClientErrors').textContent = stats.total_client_errors?.toLocaleString() || '0';
        document.getElementById('totalServerErrors').textContent = stats.total_server_errors?.toLocaleString() || '0';
        document.getElementById('successRate').textContent = (stats.success_rate || 0).toFixed(2) + '%';
        document.getElementById('avgResponseTime').textContent = (stats.avg_response_time || 0).toFixed(0) + ' ms';
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  renderLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading">Không có dữ liệu</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(log => {
      const time = new Date(log.createdAt).toLocaleString('vi-VN');
      const methodClass = `method-${log.method.toLowerCase()}`;
      const statusClass = `status-${log.status_type}`;
      
      return `
        <tr onclick="logsViewer.viewLogDetail('${log._id}')">
          <td>${time}</td>
          <td><span class="method-badge ${methodClass}">${log.method}</span></td>
          <td><code>${log.path}</code></td>
          <td>
            <span class="status-badge ${statusClass}">
              ${log.status_code}
            </span>
          </td>
          <td>${log.response_time_ms} ms</td>
          <td>${log.ip_address || '-'}</td>
          <td>
            ${log.api_key ? `<span class="api-key-truncated" title="${log.api_key}">${log.api_key}</span>` : '-'}
          </td>
          <td>
            <button class="btn-view" onclick="event.stopPropagation(); logsViewer.viewLogDetail('${log._id}')">
              Xem
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderPagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    if (!pagination || pagination.total_pages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    const pages = [];
    const totalPages = pagination.total_pages;
    const currentPage = pagination.page;

    // Previous button
    pages.push(`
      <button ${currentPage === 1 ? 'disabled' : ''} onclick="logsViewer.goToPage(${currentPage - 1})">
        ← Trước
      </button>
    `);

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(`<button onclick="logsViewer.goToPage(1)">1</button>`);
      if (startPage > 2) {
        pages.push('<span class="pagination-info">...</span>');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(`
        <button class="${i === currentPage ? 'active' : ''}" onclick="logsViewer.goToPage(${i})">
          ${i}
        </button>
      `);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('<span class="pagination-info">...</span>');
      }
      pages.push(`<button onclick="logsViewer.goToPage(${totalPages})">${totalPages}</button>`);
    }

    // Next button
    pages.push(`
      <button ${currentPage === totalPages ? 'disabled' : ''} onclick="logsViewer.goToPage(${currentPage + 1})">
        Sau →
      </button>
    `);

    paginationEl.innerHTML = pages.join('');
  }

  updateLogsInfo(pagination) {
    const infoEl = document.getElementById('logsInfo');
    if (pagination) {
      const start = (pagination.page - 1) * pagination.limit + 1;
      const end = Math.min(pagination.page * pagination.limit, pagination.total);
      infoEl.textContent = `Hiển thị ${start}-${end} của ${pagination.total} logs`;
    }
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadLogs();
  }

  async viewLogDetail(logId) {
    const modal = document.getElementById('logDetailModal');
    const content = document.getElementById('logDetailContent');
    
    content.innerHTML = '<p>Đang tải chi tiết...</p>';
    modal.style.display = 'block';

    try {
      const response = await fetch(`${this.apiBase}/logs/${logId}`);
      const result = await response.json();

      if (result.status === 'success') {
        this.renderLogDetail(result.log);
      } else {
        content.innerHTML = '<p>Không thể tải chi tiết log</p>';
      }
    } catch (error) {
      console.error('Error loading log detail:', error);
      content.innerHTML = '<p>Lỗi khi tải chi tiết log</p>';
    }
  }

  renderLogDetail(log) {
    const content = document.getElementById('logDetailContent');
    
    const formatValue = (value) => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'object') {
        return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
      }
      return value;
    };

    content.innerHTML = `
      <div class="log-detail-section">
        <h3>Thông tin cơ bản</h3>
        <div class="log-detail-item">
          <div class="log-detail-label">Thời gian:</div>
          <div class="log-detail-value">${new Date(log.createdAt).toLocaleString('vi-VN')}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Method:</div>
          <div class="log-detail-value">${log.method}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Path:</div>
          <div class="log-detail-value"><code>${log.path}</code></div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Status Code:</div>
          <div class="log-detail-value">${log.status_code} (${log.status_type})</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Response Time:</div>
          <div class="log-detail-value">${log.response_time_ms} ms</div>
        </div>
      </div>

      <div class="log-detail-section">
        <h3>Thông tin Request</h3>
        <div class="log-detail-item">
          <div class="log-detail-label">IP Address:</div>
          <div class="log-detail-value">${log.ip_address || '-'}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">User Agent:</div>
          <div class="log-detail-value">${log.user_agent || '-'}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">API Key:</div>
          <div class="log-detail-value">${log.api_key || '-'}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Query Params:</div>
          <div class="log-detail-value">${formatValue(log.query_params)}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Request Body:</div>
          <div class="log-detail-value">${formatValue(log.request_body)}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Request Size:</div>
          <div class="log-detail-value">${log.request_size_bytes} bytes</div>
        </div>
      </div>

      <div class="log-detail-section">
        <h3>Thông tin Response</h3>
        <div class="log-detail-item">
          <div class="log-detail-label">Response Body:</div>
          <div class="log-detail-value">${formatValue(log.response_body)}</div>
        </div>
        <div class="log-detail-item">
          <div class="log-detail-label">Response Size:</div>
          <div class="log-detail-value">${log.response_size_bytes} bytes</div>
        </div>
        ${log.error_message ? `
        <div class="log-detail-item">
          <div class="log-detail-label">Error Message:</div>
          <div class="log-detail-value" style="color: #f44336;">${log.error_message}</div>
        </div>
        ` : ''}
      </div>
    `;
  }
}

// Initialize logs viewer
let logsViewer;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    logsViewer = new LogsViewer();
    logsViewer.init();
  });
} else {
  logsViewer = new LogsViewer();
  logsViewer.init();
}
