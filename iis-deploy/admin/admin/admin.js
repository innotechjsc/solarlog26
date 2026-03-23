// Admin Panel JavaScript
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5023/api/v1'
  : '/api/v1';

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
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
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
}

function loadData() {
  loadUsers();
  loadProjects();
  loadAreas();
  loadDevices();
}

// Users Management
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      const tbody = document.getElementById('usersTableBody');
      tbody.innerHTML = '';
      
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
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Projects Management
async function loadProjects() {
  try {
    const response = await fetch(`${API_BASE}/cms/projects`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      const tbody = document.getElementById('projectsTableBody');
      tbody.innerHTML = '';
      
      result.projects.forEach(project => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${project.name}</td>
          <td>${project.code}</td>
          <td>${project.location?.address || '-'}</td>
          <td>${getStatusLabel(project.status)}</td>
          <td>
            <button class="btn-edit" onclick="editProject('${project._id}')">Sửa</button>
            <button class="btn-delete" onclick="deleteProject('${project._id}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Areas Management
async function loadAreas() {
  try {
    const response = await fetch(`${API_BASE}/cms/areas`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      const tbody = document.getElementById('areasTableBody');
      tbody.innerHTML = '';
      
      result.areas.forEach(area => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${area.name}</td>
          <td>${area.code}</td>
          <td>${area.project_id?.name || '-'}</td>
          <td>${getStatusLabel(area.status)}</td>
          <td>
            <button class="btn-edit" onclick="editArea('${area._id}')">Sửa</button>
            <button class="btn-delete" onclick="deleteArea('${area._id}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error loading areas:', error);
  }
}

// Devices Management
let selectedDevices = new Set();
let allDevices = [];

async function loadDevices() {
  try {
    // Fetch unique devices from data_points
    const response = await fetch(`${API_BASE}/data/devices`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      allDevices = result.devices;
      const tbody = document.getElementById('devicesTableBody');
      tbody.innerHTML = '';
      
      if (result.devices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Chưa có dữ liệu thiết bị</td></tr>';
        return;
      }
      
      result.devices.forEach(device => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <input type="checkbox" class="device-checkbox" data-device-id="${device.device_id}" onchange="toggleDeviceSelection('${device.device_id}')">
          </td>
          <td>${device.device_id}</td>
          <td>${device.site_name || '-'}</td>
          <td>${device.project_name || '-'}</td>
          <td>${device.area_name || '-'}</td>
          <td>${getStatusLabel(device.status)}</td>
          <td>
            <button class="btn-edit" onclick="editDevice('${device.device_id}')">Sửa</button>
            <button class="btn-delete" onclick="deleteDevice('${device.device_id}')">Xóa</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      // Load areas for the modal
      loadAreasForModal();
    }
  } catch (error) {
    console.error('Error loading devices:', error);
    const tbody = document.getElementById('devicesTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #c33;">Lỗi khi tải danh sách thiết bị</td></tr>';
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
