// Admin Panel JavaScript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5023/api/v1'
  : '/api/v1';
// Upload qua subdomain riêng (bypass Cloudflare) nếu OTA_UPLOAD_BASE_URL được cấu hình
const OTA_UPLOAD_BASE = (typeof window.ADMIN_CONFIG !== 'undefined' && window.ADMIN_CONFIG.otaUploadBaseUrl)
  ? window.ADMIN_CONFIG.otaUploadBaseUrl
  : API_BASE;

// Lấy OTA upload URL mới nhất từ server (bypass cache - tránh dùng config.js cũ)
async function getOtaUploadBaseFresh() {
  try {
    const r = await fetch('/admin/config.js', { cache: 'no-store' });
    const text = await r.text();
    const m = text.match(/"otaUploadBaseUrl"\s*:\s*"([^"]*)"/);
    const url = m && m[1] ? m[1] : null;
    return url || OTA_UPLOAD_BASE;
  } catch (_) {
    return OTA_UPLOAD_BASE;
  }
}

let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    checkAuth();
  }
  
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

async function checkAuth() {
  try {
    if (!authToken) {
      logout();
      return;
    }
    
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success') {
        currentUser = result.user;
        showAdminPanel();
        loadData();
      } else {
        logout();
      }
    } else {
      logout();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    logout();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  
  loginBtn.disabled = true;
  errorDiv.style.display = 'none';
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      authToken = result.token;
      currentUser = result.user;
      localStorage.setItem('authToken', authToken);
      showAdminPanel();
      loadData();
    } else {
      errorDiv.textContent = result.message || 'Đăng nhập thất bại';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    errorDiv.textContent = 'Lỗi kết nối đến server';
    errorDiv.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
  }
}

function showAdminPanel() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('adminContainer').classList.add('active');
  document.getElementById('userName').textContent = currentUser.full_name || currentUser.username;
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('adminContainer').classList.remove('active');
}

function showTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  if (tabName === 'users') loadUsers();
  else if (tabName === 'projects') loadProjects();
  else if (tabName === 'areas') loadAreas();
  else if (tabName === 'devices') loadDevices();
  else if (tabName === 'ota') loadOtaReleases();
}

function loadData() {
  loadUsers();
  loadProjects();
  loadAreas();
  loadDevices();
  // OTA tab loaded on first show
}

// ---------- OTA / Releases ----------
async function loadOtaStats() {
  const el = document.getElementById('otaSubscribersInfo');
  if (!el) return;
  try {
    const response = await fetch(`${API_BASE}/ota/stats`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    const result = await response.json();
    if (result.status === 'success') {
      if (result.subscribers !== null && result.subscribers !== undefined) {
        el.textContent = 'Số thiết bị đang subscribe topic ' + (result.topic || 'ota/release') + ': ' + result.subscribers;
      } else {
        el.textContent = 'Số thiết bị subscribe: Không xác định (broker Aedes phải chạy trên port 1884 để hiển thị)';
      }
    }
  } catch (e) {
    el.textContent = 'Số thiết bị subscribe: —';
  }
}

async function loadOtaReleases() {
  const tbody = document.getElementById('otaReleasesTableBody');
  if (!tbody) return;
  loadOtaStats();
  tbody.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';
  try {
    const response = await fetch(`${API_BASE}/ota/releases`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (response.status === 401 || response.status === 403) { logout(); return; }
    const result = await response.json();
    if (result.status !== 'success') {
      tbody.innerHTML = '<tr><td colspan="6">Lỗi: ' + (result.message || 'Không tải được') + '</td></tr>';
      return;
    }
    const releases = result.releases || [];
    if (releases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">Chưa có bản release nào. Dùng form phía trên để upload.</td></tr>';
      return;
    }
    tbody.innerHTML = releases.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.version)}</strong></td>
        <td>${formatBytes(r.size)}</td>
        <td style="font-size:11px;max-width:180px;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(r.checksum_sha256)}">${escapeHtml(r.checksum_sha256)}</td>
        <td>${r.is_latest ? '✓ Latest' : ''}</td>
        <td>${r.mqtt_pushed_at ? new Date(r.mqtt_pushed_at).toLocaleString() : '-'}</td>
        <td>
          <button class="btn-edit" onclick="publishOtaRelease('${escapeHtml(r.version)}')" title="Push thông báo lên MQTT">Push MQTT</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6">Lỗi kết nối</td></tr>';
  }
}

function formatBytes(n) {
  if (n >= 1048576) return (n / 1048576).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(2) + ' KB';
  return n + ' B';
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function publishOtaRelease(version) {
  openOtaPublishModal(version);
}

function openOtaPublishModal(version) {
  const overlay = document.createElement('div');
  overlay.id = 'otaPublishModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:12px;max-width:480px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2);';
  box.innerHTML = `
    <div style="padding:20px;border-bottom:1px solid #eee;">
      <strong>Push OTA ${escapeHtml(version)} lên MQTT</strong>
      <p style="margin:8px 0 0;font-size:13px;color:#666;">Chọn cách gửi (khi broker không trả danh sách device đang sub, chọn từ danh sách thiết bị trong hệ thống):</p>
    </div>
    <div id="otaPublishModalBody" style="padding:20px;">
      <div style="margin-bottom:16px;">Đang tải...</div>
    </div>
    <div style="padding:16px 20px;border-top:1px solid #eee;display:flex;gap:8px;flex-wrap:wrap;">
      <button type="button" class="btn" id="otaModalBtnBroadcast">Broadcast (ota/release)</button>
      <button type="button" class="btn" style="background:#999;" id="otaModalBtnClose">Đóng</button>
    </div>
  `;
  overlay.appendChild(box);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.remove();
  };

  const doPublish = async (body) => {
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      if (body) headers['Content-Type'] = 'application/json';
      const response = await fetch(`${API_BASE}/ota/releases/${encodeURIComponent(version)}/publish`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      const result = await response.json();
      if (result.status === 'success') {
        let detail = result.message || 'Đã push lên MQTT.';
        detail += '\n\nTopic: ' + (result.mqtt_topic || '');
        if (result.payload_summary) {
          detail += '\n\nNội dung điều khiển:';
          if (result.payload_summary.action) detail += '\n  action: ' + result.payload_summary.action;
          if (result.payload_summary.version) detail += '\n  version: ' + result.payload_summary.version;
          if (result.payload_summary.url) detail += '\n  url: ' + result.payload_summary.url;
          if (result.payload_summary.checksum || result.payload_summary.checksum_sha256) detail += '\n  checksum: ' + (result.payload_summary.checksum || result.payload_summary.checksum_sha256 || '');
          if (result.payload_summary.size != null) detail += '\n  size: ' + result.payload_summary.size;
        }
        if (result.device_ids && result.device_ids.length > 0) {
          detail += '\n\nĐã đẩy theo device_id (' + result.device_ids.length + '):\n' + result.device_ids.slice(0, 20).join(', ') + (result.device_ids.length > 20 ? '\n... và ' + (result.device_ids.length - 20) + ' thiết bị khác' : '');
        } else if (result.published != null) {
          detail += '\n\nSố thiết bị đã gửi: ' + result.published + (result.failed ? ', thất bại: ' + result.failed : '');
        } else {
          detail += '\n\n(Broadcast topic ' + (result.mqtt_topic || 'ota/release') + ' – mọi client đang sub đều nhận)';
        }
        alert(detail);
        closeModal();
        loadOtaReleases();
      } else {
        alert('Lỗi: ' + (result.message || 'Push thất bại'));
      }
    } catch (e) {
      alert('Lỗi kết nối');
    }
  };

  document.getElementById('otaModalBtnClose').onclick = closeModal;
  document.getElementById('otaModalBtnBroadcast').onclick = () => {
    if (!confirm('Gửi broadcast lên topic ota/release (mọi client đang sub topic đó sẽ nhận)?')) return;
    doPublish(null);
  };

  (async () => {
    const bodyEl = document.getElementById('otaPublishModalBody');
    let subscribedIds = [];
    let allDevices = [];
    try {
      const [subRes, devRes] = await Promise.all([
        fetch(`${API_BASE}/ota/subscribed-devices`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch(`${API_BASE}/cms/devices`, { headers: { 'Authorization': `Bearer ${authToken}` } })
      ]);
      if (subRes.ok) {
        const subData = await subRes.json();
        subscribedIds = subData.device_ids || [];
      }
      if (devRes.ok) {
        const devData = await devRes.json();
        allDevices = devData.devices || [];
      }
    } catch (_) {}

    const deviceIds = allDevices.map(d => d.device_id || d._id).filter(Boolean);
    let html = '';

    if (subscribedIds.length > 0) {
      html += `
        <div style="margin-bottom:16px;">
          <strong>Thiết bị đang sub topic command (từ broker):</strong>
          <p style="font-size:12px;color:#666;">${subscribedIds.join(', ')}</p>
          <button type="button" class="btn" id="otaModalBtnSubscribed" style="margin-top:8px;">Gửi đến ${subscribedIds.length} thiết bị đang sub</button>
        </div>
      `;
    } else {
      html += '<p style="font-size:13px;color:#888;margin-bottom:16px;">Không lấy được danh sách thiết bị đang sub (broker khác Aedes hoặc chưa có thiết bị sub). Dùng danh sách bên dưới.</p>';
    }

    html += `
      <div style="margin-bottom:16px;">
        <button type="button" class="btn" id="otaModalBtnAllDevices">Gửi đến tất cả thiết bị trong hệ thống (${deviceIds.length})</button>
      </div>
      <div style="margin-bottom:8px;">
        <strong>Hoặc chọn từng thiết bị:</strong>
      </div>
      <div id="otaModalDeviceList" style="max-height:200px;overflow:auto;border:1px solid #eee;border-radius:8px;padding:8px;margin-bottom:12px;">
    `;
    if (deviceIds.length === 0) {
      html += '<p style="font-size:13px;color:#888;">Chưa có thiết bị nào trong CMS.</p>';
    } else {
      deviceIds.forEach(id => {
        html += `<label style="display:block;padding:4px 0;"><input type="checkbox" class="ota-modal-device-cb" data-device-id="${escapeHtml(id)}"> ${escapeHtml(id)}</label>`;
      });
    }
    html += '</div><button type="button" class="btn" id="otaModalBtnSelected">Gửi đến thiết bị đã chọn</button>';

    bodyEl.innerHTML = html;

    if (subscribedIds.length > 0) {
      document.getElementById('otaModalBtnSubscribed').onclick = () => {
        if (!confirm(`Gửi OTA đến ${subscribedIds.length} thiết bị đang sub?`)) return;
        doPublish({ device_ids: subscribedIds });
      };
    }
    document.getElementById('otaModalBtnAllDevices').onclick = () => {
      if (!confirm(`Gửi đến tất cả ${deviceIds.length} thiết bị trong hệ thống?`)) return;
      doPublish({ all_devices: true });
    };
    document.getElementById('otaModalBtnSelected').onclick = () => {
      const checked = Array.from(document.querySelectorAll('.ota-modal-device-cb:checked')).map(cb => cb.getAttribute('data-device-id'));
      if (checked.length === 0) {
        alert('Chọn ít nhất một thiết bị.');
        return;
      }
      if (!confirm(`Gửi đến ${checked.length} thiết bị đã chọn?`)) return;
      doPublish({ device_ids: checked });
    };
  })();
}

(function initOtaForm() {
  const form = document.getElementById('otaUploadForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const version = document.getElementById('otaVersion').value.trim().replace(/^v/, '') || '0.0.0';
    const versionTag = version.startsWith('v') ? version : 'v' + version;
    const release_notes = document.getElementById('otaReleaseNotes').value.trim();
    const fileInput = document.getElementById('otaFile');
    const btn = document.getElementById('otaUploadBtn');
    const msg = document.getElementById('otaUploadMessage');
    if (!fileInput.files.length) { msg.textContent = 'Chọn file firmware.'; msg.style.display = 'block'; msg.style.background = '#ffebee'; msg.style.color = '#c62828'; return; }
    btn.disabled = true;
    msg.style.display = 'none';
    const fd = new FormData();
    fd.append('version', versionTag);
    fd.append('release_notes', release_notes);
    fd.append('file', fileInput.files[0]);
    try {
      const uploadBase = await getOtaUploadBaseFresh();
      const response = await fetch(`${uploadBase}/ota/releases`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: fd
      });
      const result = await response.json();
      msg.style.display = 'block';
      if (result.status === 'success') {
        msg.style.background = '#e8f5e9';
        msg.style.color = '#2e7d32';
        msg.textContent = 'Upload thành công: ' + result.release.version;
        form.reset();
        loadOtaReleases();
      } else {
        msg.style.background = '#ffebee';
        msg.style.color = '#c62828';
        msg.textContent = result.message || 'Upload thất bại';
      }
    } catch (err) {
      msg.style.display = 'block';
      msg.style.background = '#ffebee';
      msg.style.color = '#c62828';
      msg.textContent = 'Lỗi kết nối';
    } finally {
      btn.disabled = false;
    }
  });
})();

// Users Management
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      tbody.innerHTML = '';
      
      if (result.users && result.users.length > 0) {
        result.users.forEach(user => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${getRoleLabel(user.role)}</td>
            <td>${getStatusLabel(user.status)}</td>
            <td>
              <button class="btn-edit" onclick="editUser('${user._id}')">Sửa</button>
              <button class="btn-delete" onclick="deleteUser('${user._id}')">Xóa</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">Chưa có người dùng nào</td></tr>';
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c33;">Lỗi: ${result.message || 'Không thể tải danh sách người dùng'}</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading users:', error);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c33;">Lỗi kết nối đến server</td></tr>';
  }
}

// Projects Management
async function loadProjects() {
  const tbody = document.getElementById('projectsTableBody');
  try {
    const response = await fetch(`${API_BASE}/cms/projects`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      tbody.innerHTML = '';
      
      if (result.projects && result.projects.length > 0) {
        result.projects.forEach(project => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${project.name || '-'}</td>
            <td>${project.code || '-'}</td>
            <td>${project.location?.address || '-'}</td>
            <td>${getStatusLabel(project.status)}</td>
            <td>
              <button class="btn-edit" onclick="editProject('${project._id}')">Sửa</button>
              <button class="btn-delete" onclick="deleteProject('${project._id}')">Xóa</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">Chưa có dự án nào</td></tr>';
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #c33;">Lỗi: ${result.message || 'Không thể tải danh sách dự án'}</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #c33;">Lỗi kết nối đến server</td></tr>';
  }
}

// Areas Management
async function loadAreas() {
  const tbody = document.getElementById('areasTableBody');
  try {
    const response = await fetch(`${API_BASE}/cms/areas`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      tbody.innerHTML = '';
      
      if (result.areas && result.areas.length > 0) {
        result.areas.forEach(area => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${area.name || '-'}</td>
            <td>${area.code || '-'}</td>
            <td>${area.project_id?.name || '-'}</td>
            <td>${getStatusLabel(area.status)}</td>
            <td>
              <button class="btn-edit" onclick="editArea('${area._id}')">Sửa</button>
              <button class="btn-delete" onclick="deleteArea('${area._id}')">Xóa</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">Chưa có khu vực nào</td></tr>';
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #c33;">Lỗi: ${result.message || 'Không thể tải danh sách khu vực'}</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading areas:', error);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #c33;">Lỗi kết nối đến server</td></tr>';
  }
}

// Devices Management
let selectedDevices = new Set();
let allDevices = [];

async function loadDevices() {
  const tbody = document.getElementById('devicesTableBody');
  try {
    // Use CMS endpoint for consistency with other endpoints
    const response = await fetch(`${API_BASE}/cms/devices`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      logout();
      return;
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      allDevices = result.devices || [];
      tbody.innerHTML = '';
      
      if (allDevices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Chưa có thiết bị nào</td></tr>';
        return;
      }
      
      allDevices.forEach(device => {
        const tr = document.createElement('tr');
        const deviceId = device.device_id || device._id;
        tr.innerHTML = `
          <td>
            <input type="checkbox" class="device-checkbox" data-device-id="${deviceId}" onchange="toggleDeviceSelection('${deviceId}')">
          </td>
          <td>${deviceId}</td>
          <td>${device.site_name || '-'}</td>
          <td>${device.project_id?.name || '-'}</td>
          <td>${device.area_id?.name || '-'}</td>
          <td>${getStatusLabel(device.status)}</td>
          <td>
            <button class="btn-edit" onclick="editDevice('${deviceId}')">Sửa</button>
            <button class="btn-delete" onclick="deleteDevice('${deviceId}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      // Load areas for the modal
      loadAreasForModal();
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #c33;">Lỗi: ${result.message || 'Không thể tải danh sách thiết bị'}</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading devices:', error);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #c33;">Lỗi kết nối đến server</td></tr>';
  }
}

function toggleDeviceSelection(deviceId) {
  const checkbox = document.querySelector(`.device-checkbox[data-device-id="${deviceId}"]`);
  if (checkbox.checked) {
    selectedDevices.add(deviceId);
  } else {
    selectedDevices.delete(deviceId);
  }
  updateSelectedDevicesUI();
}

function toggleSelectAllDevices() {
  const selectAll = document.getElementById('selectAllDevices');
  const checkboxes = document.querySelectorAll('.device-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAll.checked;
    const deviceId = checkbox.getAttribute('data-device-id');
    if (selectAll.checked) {
      selectedDevices.add(deviceId);
    } else {
      selectedDevices.delete(deviceId);
    }
  });
  
  updateSelectedDevicesUI();
}

function updateSelectedDevicesUI() {
  const count = selectedDevices.size;
  const addBtn = document.getElementById('addToAreaBtn');
  
  if (count > 0) {
    addBtn.style.display = 'block';
  } else {
    addBtn.style.display = 'none';
  }
}

let areasList = [];

async function loadAreasForModal() {
  try {
    const response = await fetch(`${API_BASE}/cms/areas`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      areasList = result.areas;
      const select = document.getElementById('areaSelectForDevices');
      select.innerHTML = '<option value="">-- Chọn khu vực --</option>';
      
      result.areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area._id;
        option.textContent = `${area.name} (${area.code})`;
        option.setAttribute('data-project-id', area.project_id?._id || area.project_id || '');
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading areas:', error);
  }
}

function showAddToAreaModal() {
  if (selectedDevices.size === 0) {
    alert('Vui lòng chọn ít nhất một thiết bị');
    return;
  }
  
  document.getElementById('selectedDevicesCount').textContent = selectedDevices.size;
  document.getElementById('addToAreaModal').classList.add('active');
  document.getElementById('areaSelectForDevices').value = '';
}

function closeAddToAreaModal() {
  document.getElementById('addToAreaModal').classList.remove('active');
}

async function addSelectedDevicesToArea() {
  const areaSelect = document.getElementById('areaSelectForDevices');
  const areaId = areaSelect.value;
  
  if (!areaId) {
    alert('Vui lòng chọn khu vực');
    return;
  }
  
  if (selectedDevices.size === 0) {
    alert('Vui lòng chọn ít nhất một thiết bị');
    return;
  }
  
  try {
    // Get project_id from selected option
    const selectedOption = areaSelect.options[areaSelect.selectedIndex];
    const projectId = selectedOption.getAttribute('data-project-id');
    
    if (!projectId) {
      alert('Không tìm thấy thông tin dự án của khu vực');
      return;
    }
    
    // Add each selected device to the area
    let successCount = 0;
    let errorCount = 0;
    
    for (const deviceId of selectedDevices) {
      try {
        // Try to update existing device first (by device_id)
        try {
          const updateResponse = await fetch(`${API_BASE}/cms/devices/${deviceId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              area_id: areaId,
              project_id: projectId
            })
          });
          
          const updateResult = await updateResponse.json();
          if (updateResult.status === 'success') {
            successCount++;
          } else if (updateResult.message && updateResult.message.includes('not found')) {
            // Device doesn't exist, create new one
            const createResponse = await fetch(`${API_BASE}/cms/devices`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                device_id: deviceId,
                area_id: areaId,
                project_id: projectId
              })
            });
            
            const createResult = await createResponse.json();
            if (createResult.status === 'success') {
              successCount++;
            } else {
              errorCount++;
              console.error(`Error creating device ${deviceId}:`, createResult.message);
            }
          } else {
            errorCount++;
            console.error(`Error updating device ${deviceId}:`, updateResult.message);
          }
        } catch (error) {
          console.error(`Error processing device ${deviceId}:`, error);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error adding device ${deviceId}:`, error);
        errorCount++;
      }
    }
    
    // Show result
    if (errorCount === 0) {
      alert(`Đã thêm thành công ${successCount} thiết bị vào khu vực`);
    } else {
      alert(`Đã thêm ${successCount} thiết bị, ${errorCount} thiết bị lỗi`);
    }
    
    // Clear selection and reload
    selectedDevices.clear();
    document.getElementById('selectAllDevices').checked = false;
    closeAddToAreaModal();
    loadDevices();
    
  } catch (error) {
    console.error('Error adding devices to area:', error);
    alert('Lỗi khi thêm thiết bị vào khu vực');
  }
}

function getRoleLabel(role) {
  const labels = {
    'admin': 'Quản trị viên',
    'manager': 'Quản lý',
    'user': 'Người dùng'
  };
  return labels[role] || role;
}

function getStatusLabel(status) {
  const labels = {
    'active': 'Hoạt động',
    'inactive': 'Không hoạt động',
    'suspended': 'Tạm khóa',
    'online': 'Trực tuyến',
    'offline': 'Ngoại tuyến'
  };
  return labels[status] || status;
}

// Placeholder functions for CRUD operations
function showUserModal() {
  alert('Chức năng thêm người dùng - Cần implement modal form');
}

function editUser(userId) {
  alert(`Chỉnh sửa user ${userId} - Cần implement`);
}

async function deleteUser(userId) {
  if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      loadUsers();
      alert('Xóa thành công');
    } else {
      alert(result.message || 'Lỗi khi xóa');
    }
  } catch (error) {
    alert('Lỗi kết nối');
  }
}

function showProjectModal() {
  alert('Chức năng thêm dự án - Cần implement modal form');
}

function editProject(projectId) {
  alert(`Chỉnh sửa project ${projectId} - Cần implement`);
}

async function deleteProject(projectId) {
  if (!confirm('Bạn có chắc muốn xóa dự án này?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/cms/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      loadProjects();
      alert('Xóa thành công');
    } else {
      alert(result.message || 'Lỗi khi xóa');
    }
  } catch (error) {
    alert('Lỗi kết nối');
  }
}

function showAreaModal() {
  alert('Chức năng thêm khu vực - Cần implement modal form');
}

function editArea(areaId) {
  alert(`Chỉnh sửa area ${areaId} - Cần implement`);
}

async function deleteArea(areaId) {
  if (!confirm('Bạn có chắc muốn xóa khu vực này?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/cms/areas/${areaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      loadAreas();
      alert('Xóa thành công');
    } else {
      alert(result.message || 'Lỗi khi xóa');
    }
  } catch (error) {
    alert('Lỗi kết nối');
  }
}

function showDeviceModal() {
  alert('Chức năng thêm thiết bị - Cần implement modal form');
}

function editDevice(deviceId) {
  alert(`Chỉnh sửa device ${deviceId} - Cần implement`);
}

async function deleteDevice(deviceId) {
  if (!confirm('Bạn có chắc muốn xóa thiết bị này?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/cms/devices/${deviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      loadDevices();
      alert('Xóa thành công');
    } else {
      alert(result.message || 'Lỗi khi xóa');
    }
  } catch (error) {
    alert('Lỗi kết nối');
  }
}

