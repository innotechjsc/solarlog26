// Auto-detect API base URL
const getApiBase = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5023/api/v1';
    } else {
        return '/api/v1';
    }
};
const API_BASE = getApiBase();

let charts = {};
let currentReportData = null;
let currentProjectId = null;
let currentAreaId = null;
let currentPeriod = '7days';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupEventListeners();
});

function setupEventListeners() {
    // Project select
    const projectSelect = document.getElementById('project-select');
    if (projectSelect) {
        projectSelect.addEventListener('change', handleProjectChange);
    }
    
    // Area select
    const areaSelect = document.getElementById('area-select');
    if (areaSelect) {
        areaSelect.addEventListener('change', handleAreaChange);
    }
    
    // Period selector buttons
    const periodButtons = document.querySelectorAll('.period-option');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            updateDateRangeText();
            if (currentProjectId) {
                loadReportData();
            }
        });
    });
}

async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE}/admin/projects`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        const select = document.getElementById('project-select');
        if (!select) return;
        
        if (result.status === 'success' && result.projects && result.projects.length > 0) {
            select.innerHTML = '<option value="">-- Chọn dự án --</option>';
            result.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project._id;
                option.textContent = `${project.code || ''} - ${project.name || project._id}`;
                select.appendChild(option);
            });
            
            // Auto-select first project and load data
            if (result.projects.length > 0) {
                currentProjectId = result.projects[0]._id;
                select.value = currentProjectId;
                await loadAreas(currentProjectId);
                loadReportData();
            }
        } else {
            select.innerHTML = '<option value="">Không có dự án nào</option>';
            console.warn('No projects found in database. Please create a project first in Admin panel.');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        const select = document.getElementById('project-select');
        if (select) {
            select.innerHTML = '<option value="">Lỗi: Không thể kết nối server</option>';
        }
        // Show error message to user
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="color: #f44336; margin-bottom: 8px;">Lỗi kết nối</h3>
                    <p style="color: #666;">Không thể tải danh sách dự án. Vui lòng kiểm tra:</p>
                    <ul style="text-align: left; display: inline-block; margin-top: 16px; color: #666;">
                        <li>Server API đang chạy</li>
                        <li>Kết nối mạng</li>
                        <li>Đã tạo dự án trong Admin panel</li>
                    </ul>
                </div>
            `;
        }
    }
}

async function loadAreas(projectId) {
    try {
        if (!projectId) {
            const select = document.getElementById('area-select');
            if (select) {
                select.innerHTML = '<option value="">Tất cả</option>';
            }
            return;
        }
        
        const response = await fetch(`${API_BASE}/admin/projects/${projectId}/areas`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        const select = document.getElementById('area-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Tất cả</option>';
        
        if (result.status === 'success' && result.areas && result.areas.length > 0) {
            result.areas.forEach(area => {
                const option = document.createElement('option');
                option.value = area._id;
                option.textContent = `${area.code || ''} - ${area.name || area._id}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading areas:', error);
        const select = document.getElementById('area-select');
        if (select) {
            select.innerHTML = '<option value="">Lỗi tải khu vực</option>';
        }
    }
}

function handleProjectChange(e) {
    const projectId = e.target.value;
    currentProjectId = projectId;
    currentAreaId = null;
    
    const areaSelect = document.getElementById('area-select');
    if (areaSelect) {
        areaSelect.value = '';
    }
    
    if (projectId) {
        loadAreas(projectId).then(() => {
            loadReportData();
        });
    } else {
        hideReportContent();
    }
}

function handleAreaChange(e) {
    currentAreaId = e.target.value || null;
    if (currentProjectId) {
        loadReportData();
    }
}

function updateDateRangeText() {
    const dateRangeText = document.getElementById('date-range-text');
    if (dateRangeText) {
        if (currentPeriod === '7days') {
            dateRangeText.textContent = '7 ngày qua';
        } else if (currentPeriod === '30days') {
            dateRangeText.textContent = '30 ngày qua';
        }
    }
}

async function loadReportData() {
    if (!currentProjectId) {
        hideReportContent();
        return;
    }
    
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('report-content').style.display = 'none';
    
    try {
        let url;
        if (currentAreaId) {
            url = `${API_BASE}/reports/area/${currentAreaId}/detailed?period=${currentPeriod}&predictDays=7`;
        } else {
            url = `${API_BASE}/reports/project/${currentProjectId}/detailed?period=${currentPeriod}&predictDays=7`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            currentReportData = result;
            renderReport(result);
            document.getElementById('report-content').style.display = 'block';
        } else {
            console.error('Error loading report:', result.message);
            hideReportContent();
        }
    } catch (error) {
        console.error('Error loading report:', error);
        hideReportContent();
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function hideReportContent() {
    document.getElementById('report-content').style.display = 'none';
}

function renderReport(data) {
    // Update metrics
    updateMetric('total-energy', data.statistics.total_energy.toFixed(2));
    updateMetric('avg-energy', data.statistics.avg_daily_energy.toFixed(2));
    updateMetric('max-energy', data.statistics.max_daily_energy.toFixed(2));
    
    const efficiency = data.efficiency ? data.efficiency.avg_efficiency.toFixed(1) : '0';
    updateMetric('efficiency', efficiency);
    
    // Render charts
    renderEnergyChart(data);
    renderHourlyPatternChart(data);
    renderDistributionChart(data);
    renderDemandForecastChart(data).catch(err => console.error('Error rendering demand forecast chart:', err));
    renderTrendChart(data);
    
    // Render new charts from payload 0.9.0 (async)
    renderBatteryHealthChart(data).catch(err => console.error('Error rendering battery health chart:', err));
    renderGridInteractionChart(data).catch(err => console.error('Error rendering grid interaction chart:', err));
    renderTemperatureChart(data).catch(err => console.error('Error rendering temperature chart:', err));
    renderInverterStateChart(data).catch(err => console.error('Error rendering inverter state chart:', err));
    
    // Render insights
    renderInsights(data);
}

function updateMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
        // Animate number change
        const currentValue = parseFloat(element.textContent) || 0;
        const targetValue = parseFloat(value) || 0;
        animateValue(element, currentValue, targetValue, 500);
    }
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = start + (end - start) * progress;
        element.textContent = current.toFixed(2);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end.toFixed(2);
        }
    };
    window.requestAnimationFrame(step);
}

function renderEnergyChart(data) {
    const canvas = document.getElementById('energy-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.energyChart) charts.energyChart.destroy();
    
    const dates = data.daily_data.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
    const energyData = data.daily_data.map(d => d.energy || 0);
    
    // Prediction data
    const predictionDates = data.predictions ? data.predictions.dates.map(d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) : [];
    const predictionData = data.predictions ? data.predictions.predicted : [];
    
    const allLabels = [...dates, ...predictionDates];
    const splitIndex = dates.length;
    
    charts.energyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Năng lượng thực tế',
                    data: [...energyData, ...Array(predictionDates.length).fill(null)],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Dự đoán',
                    data: [...Array(dates.length).fill(null), ...predictionData],
                    borderColor: 'rgb(245, 87, 108)',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Năng lượng (kWh)',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

function renderHourlyPatternChart(data) {
    const canvas = document.getElementById('hourly-pattern-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.hourlyPatternChart) charts.hourlyPatternChart.destroy();
    
    const hourlyPattern = data.hourly_pattern || [];
    const hours = hourlyPattern.map(h => `${h.hour}:00`);
    const energyData = hourlyPattern.map(h => h.avg_energy || 0);
    
    if (hours.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Không có dữ liệu', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    charts.hourlyPatternChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Năng lượng trung bình',
                data: energyData,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgb(102, 126, 234)',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Giờ trong ngày',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Năng lượng (kWh)',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

function renderDistributionChart(data) {
    const canvas = document.getElementById('distribution-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.distributionChart) charts.distributionChart.destroy();
    
    let labels, values;
    
    if (data.areas && data.areas.length > 0) {
        labels = data.areas.map(a => a.area_name || a.area_code);
        values = data.areas.map(a => a.energy || 0);
    } else if (data.devices && data.devices.length > 0) {
        labels = data.devices.map(d => d.device_name || d.device_id);
        values = data.devices.map(d => d.energy || 0);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Không có dữ liệu', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    charts.distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.9)',
                    'rgba(56, 239, 125, 0.9)',
                    'rgba(245, 87, 108, 0.9)',
                    'rgba(240, 147, 251, 0.9)',
                    'rgba(79, 172, 254, 0.9)',
                    'rgba(153, 102, 255, 0.9)'
                ],
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: {
                            size: 13
                        },
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value.toFixed(2)} kWh (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

async function renderDemandForecastChart(data) {
    const canvas = document.getElementById('demand-forecast-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.demandForecastChart) charts.demandForecastChart.destroy();
    
    try {
        // Try to get forecast from API
        const deviceId = currentReportData?.device_id || data.device_id;
        const projectId = currentProjectId;
        
        let forecastData = null;
        if (deviceId || projectId) {
            const url = deviceId 
                ? `${API_BASE}/analytics/demand-forecast?deviceId=${deviceId}&days=7`
                : `${API_BASE}/analytics/demand-forecast?projectId=${projectId}&days=7`;
            
            try {
                const response = await fetch(url);
                const result = await response.json();
                if (result.status === 'success') {
                    forecastData = result.forecast;
                }
            } catch (err) {
                console.warn('Could not fetch forecast from API, using data.predictions:', err);
            }
        }
        
        // Use API forecast if available, otherwise use data.predictions
        let predictionDates, predictionData, avgEnergy;
        
        if (forecastData) {
            predictionDates = forecastData.dates.map(d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
            predictionData = forecastData.predicted;
            avgEnergy = data.statistics.avg_daily_energy;
        } else if (data.predictions && data.predictions.dates && data.predictions.dates.length > 0) {
            predictionDates = data.predictions.dates.map(d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
            predictionData = data.predictions.predicted;
            avgEnergy = data.statistics.avg_daily_energy;
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#999';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Không có dữ liệu dự đoán', canvas.width / 2, canvas.height / 2);
            return;
        }
    
        // Calculate demand forecast (prediction + 20% buffer for demand)
        const demandData = predictionData.map(p => p * 1.2);
    
    charts.demandForecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: predictionDates,
            datasets: [
                {
                    label: 'Nhu cầu dự kiến',
                    data: demandData,
                    borderColor: 'rgb(245, 87, 108)',
                    backgroundColor: 'rgba(245, 87, 108, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Sản lượng dự đoán',
                    data: predictionData,
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Trung bình lịch sử',
                    data: Array(predictionDates.length).fill(avgEnergy),
                    borderColor: 'rgb(56, 239, 125)',
                    borderWidth: 2,
                    borderDash: [10, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Năng lượng (kWh)',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
        } catch (error) {
            console.error('Error rendering demand forecast chart:', error);
            // Fallback to placeholder
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#999';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Không có dữ liệu dự đoán', canvas.width / 2, canvas.height / 2);
        }
}

function renderTrendChart(data) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.trendChart) charts.trendChart.destroy();
    
    if (!data.daily_data || data.daily_data.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Không có dữ liệu', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const dates = data.daily_data.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
    const energyData = data.daily_data.map(d => d.energy || 0);
    
    // Calculate moving average (7-day window)
    const movingAvg = [];
    const windowSize = Math.min(7, energyData.length);
    for (let i = 0; i < energyData.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = energyData.slice(start, i + 1);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;
        movingAvg.push(avg);
    }
    
    charts.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Năng lượng thực tế',
                    data: energyData,
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Trung bình động (7 ngày)',
                    data: movingAvg,
                    borderColor: 'rgb(245, 87, 108)',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Năng lượng (kWh)',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

function renderInsights(data) {
    const container = document.getElementById('insights-content');
    if (!container) return;
    
    const insights = [];
    
    const trend = data.predictions ? data.predictions.trend : 0;
    const confidence = data.predictions ? data.predictions.confidence : 0;
    const avgEnergy = data.statistics.avg_daily_energy;
    const maxEnergy = data.statistics.max_daily_energy;
    
    // Trend insight
    if (trend > 5) {
        insights.push({
            type: 'positive',
            title: 'Xu hướng tăng trưởng tốt',
            text: `Năng lượng đang có xu hướng tăng ${trend.toFixed(1)}% so với trung bình. Hệ thống hoạt động hiệu quả.`
        });
    } else if (trend < -5) {
        insights.push({
            type: 'warning',
            title: 'Xu hướng giảm',
            text: `Năng lượng đang có xu hướng giảm ${Math.abs(trend).toFixed(1)}%. Cần kiểm tra hiệu suất hệ thống.`
        });
    } else {
        insights.push({
            type: 'positive',
            title: 'Xu hướng ổn định',
            text: `Năng lượng dao động trong khoảng ±${Math.abs(trend).toFixed(1)}%. Hệ thống hoạt động ổn định.`
        });
    }
    
    // Confidence insight
    if (confidence > 80) {
        insights.push({
            type: 'positive',
            title: 'Dự đoán có độ tin cậy cao',
            text: `Độ tin cậy ${confidence.toFixed(1)}%. Dữ liệu nhất quán, dự đoán đáng tin cậy.`
        });
    } else if (confidence < 50) {
        insights.push({
            type: 'warning',
            title: 'Dự đoán có độ tin cậy thấp',
            text: `Độ tin cậy ${confidence.toFixed(1)}%. Dữ liệu có nhiều biến động, cần thêm thời gian quan sát.`
        });
    }
    
    // Performance insight
    const performanceRatio = maxEnergy > 0 ? (avgEnergy / maxEnergy) * 100 : 0;
    if (performanceRatio > 80) {
        insights.push({
            type: 'positive',
            title: 'Hiệu suất cao',
            text: `Năng lượng trung bình đạt ${performanceRatio.toFixed(1)}% so với cao nhất. Hệ thống hoạt động tốt.`
        });
    } else if (performanceRatio < 50) {
        insights.push({
            type: 'warning',
            title: 'Cần tối ưu hóa',
            text: `Năng lượng trung bình chỉ đạt ${performanceRatio.toFixed(1)}% so với cao nhất. Có thể cần bảo trì.`
        });
    }
    
    // Consumption forecast insight
    if (data.predictions && data.predictions.predicted.length > 0) {
        const avgPrediction = data.predictions.predicted.reduce((a, b) => a + b, 0) / data.predictions.predicted.length;
        const avgConsumption = avgPrediction * 1.2;
        const surplus = avgPrediction - avgConsumption;
        
        if (surplus > 0) {
            insights.push({
                type: 'positive',
                title: 'Thặng dư năng lượng dự kiến',
                text: `Dự kiến sẽ có thặng dư ${surplus.toFixed(2)} kWh/ngày. Có thể cân nhắc bán lại cho lưới điện.`
            });
        } else {
            insights.push({
                type: 'warning',
                title: 'Thiếu hụt năng lượng dự kiến',
                text: `Dự kiến thiếu hụt ${Math.abs(surplus).toFixed(2)} kWh/ngày. Cần có phương án dự phòng.`
            });
        }
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-item ${insight.type}">
            <div class="insight-title">${insight.title}</div>
            <div class="insight-text">${insight.text}</div>
        </div>
    `).join('');
}

async function renderBatteryHealthChart(data) {
    const canvas = document.getElementById('battery-health-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.batteryHealthChart) charts.batteryHealthChart.destroy();
    
    try {
        // Get device ID from current report data
        const deviceId = currentReportData?.device_id || data.device_id;
        if (!deviceId) {
            // Try to get from project/area
            const projectId = currentProjectId;
            if (!projectId) {
                console.warn('No device or project ID for battery health chart');
                return;
            }
        }
        
        // Fetch battery health data from API
        const url = deviceId 
            ? `${API_BASE}/analytics/battery-health?deviceId=${deviceId}&period=${currentPeriod}`
            : `${API_BASE}/analytics/battery-health?projectId=${currentProjectId}&period=${currentPeriod}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success' && result.analytics.daily_data) {
            const batteryData = result.analytics.daily_data;
            const dates = batteryData.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
            const sohData = batteryData.map(d => d.soh !== null ? parseFloat(d.soh) : null);
            const socData = batteryData.map(d => d.soc !== null ? parseFloat(d.soc) : null);
            
            charts.batteryHealthChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'SOH (%)',
                            data: sohData,
                            borderColor: 'rgb(76, 175, 80)',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'SOC (%)',
                            data: socData,
                            borderColor: 'rgb(33, 150, 243)',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Phần trăm (%)'
                            }
                        }
                    }
                }
            });
        } else {
            // Fallback to placeholder
            const dates = data.daily_data ? data.daily_data.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) : [];
            charts.batteryHealthChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'SOH (%)',
                            data: Array(dates.length).fill(null),
                            borderColor: 'rgb(76, 175, 80)',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'SOC (%)',
                            data: Array(dates.length).fill(null),
                            borderColor: 'rgb(33, 150, 243)',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: 'Phần trăm (%)' }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading battery health data:', error);
    }
}

async function renderGridInteractionChart(data) {
    const canvas = document.getElementById('grid-interaction-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.gridInteractionChart) charts.gridInteractionChart.destroy();
    
    try {
        const deviceId = currentReportData?.device_id || data.device_id;
        const projectId = currentProjectId;
        
        if (!deviceId && !projectId) {
            console.warn('No device or project ID for grid interaction chart');
            return;
        }
        
        const url = deviceId 
            ? `${API_BASE}/analytics/grid-interaction?deviceId=${deviceId}&period=${currentPeriod}`
            : `${API_BASE}/analytics/grid-interaction?projectId=${projectId}&period=${currentPeriod}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success' && result.analytics.daily_data) {
            const gridData = result.analytics.daily_data;
            const dates = gridData.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
            const importData = gridData.map(d => parseFloat(d.import_energy) || 0);
            const exportData = gridData.map(d => parseFloat(d.export_energy) || 0);
            const freqData = gridData.map(d => d.frequency !== null ? parseFloat(d.frequency) : null);
            
            charts.gridInteractionChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Import Energy (kWh)',
                            data: importData,
                            borderColor: 'rgb(255, 152, 0)',
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4
                        },
                        {
                            label: 'Export Energy (kWh)',
                            data: exportData,
                            borderColor: 'rgb(76, 175, 80)',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4
                        },
                        {
                            label: 'Grid Frequency (Hz)',
                            data: freqData,
                            borderColor: 'rgb(156, 39, 176)',
                            backgroundColor: 'rgba(156, 39, 176, 0.1)',
                            borderWidth: 3,
                            yAxisID: 'y1',
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4
                        }
                    ]
                },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
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
                    beginAtZero: false,
                    min: 49,
                    max: 51,
                    title: {
                        display: true,
                        text: 'Tần số (Hz)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
        } else {
            // Fallback to placeholder
            const dates = data.daily_data ? data.daily_data.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) : [];
            charts.gridInteractionChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        { label: 'Import Energy (kWh)', data: Array(dates.length).fill(null), borderColor: 'rgb(255, 152, 0)', borderWidth: 3, fill: true },
                        { label: 'Export Energy (kWh)', data: Array(dates.length).fill(null), borderColor: 'rgb(76, 175, 80)', borderWidth: 3, fill: true },
                        { label: 'Grid Frequency (Hz)', data: Array(dates.length).fill(null), borderColor: 'rgb(156, 39, 176)', borderWidth: 3, yAxisID: 'y1', fill: false }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Năng lượng (kWh)' } },
                        y1: { type: 'linear', display: true, position: 'right', min: 49, max: 51, title: { display: true, text: 'Tần số (Hz)' }, grid: { drawOnChartArea: false } }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading grid interaction data:', error);
    }
}

async function renderTemperatureChart(data) {
    const canvas = document.getElementById('temperature-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.temperatureChart) charts.temperatureChart.destroy();
    
    try {
        const deviceId = currentReportData?.device_id || data.device_id;
        const projectId = currentProjectId;
        
        if (!deviceId && !projectId) {
            console.warn('No device or project ID for temperature chart');
            return;
        }
        
        const url = deviceId 
            ? `${API_BASE}/analytics/temperature?deviceId=${deviceId}&period=${currentPeriod}`
            : `${API_BASE}/analytics/temperature?projectId=${projectId}&period=${currentPeriod}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success' && result.analytics.daily_data) {
            const tempData = result.analytics.daily_data;
            const dates = tempData.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
            const inverterTemp = tempData.map(d => d.inverter_temp !== null ? parseFloat(d.inverter_temp) : null);
            const ambientTemp = tempData.map(d => d.ambient_temp !== null ? parseFloat(d.ambient_temp) : null);
            const heatsinkTemp = tempData.map(d => d.heatsink_temp !== null ? parseFloat(d.heatsink_temp) : null);
            
            charts.temperatureChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Inverter Temp (°C)',
                            data: inverterTemp,
                            borderColor: 'rgb(244, 67, 54)',
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4
                        },
                        {
                            label: 'Ambient Temp (°C)',
                            data: ambientTemp,
                            borderColor: 'rgb(33, 150, 243)',
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4
                        },
                        {
                            label: 'Heatsink Temp (°C)',
                            data: heatsinkTemp,
                            borderColor: 'rgb(255, 152, 0)',
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            borderWidth: 3,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4
                        }
                    ]
                },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Nhiệt độ (°C)'
                    }
                }
            }
        }
    });
        } else {
            // Fallback to placeholder
            const dates = data.daily_data ? data.daily_data.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) : [];
            charts.temperatureChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [
                        { label: 'Inverter Temp (°C)', data: Array(dates.length).fill(null), borderColor: 'rgb(244, 67, 54)', borderWidth: 3, fill: true },
                        { label: 'Ambient Temp (°C)', data: Array(dates.length).fill(null), borderColor: 'rgb(33, 150, 243)', borderWidth: 3, fill: true },
                        { label: 'Heatsink Temp (°C)', data: Array(dates.length).fill(null), borderColor: 'rgb(255, 152, 0)', borderWidth: 3, fill: false }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: {
                        y: { beginAtZero: false, title: { display: true, text: 'Nhiệt độ (°C)' } }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading temperature data:', error);
    }
}

async function renderInverterStateChart(data) {
    const canvas = document.getElementById('inverter-state-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (charts.inverterStateChart) charts.inverterStateChart.destroy();
    
    try {
        const deviceId = currentReportData?.device_id || data.device_id;
        const projectId = currentProjectId;
        
        if (!deviceId && !projectId) {
            console.warn('No device or project ID for inverter state chart');
            return;
        }
        
        const url = deviceId 
            ? `${API_BASE}/analytics/operating-state?deviceId=${deviceId}&period=${currentPeriod}`
            : `${API_BASE}/analytics/operating-state?projectId=${projectId}&period=${currentPeriod}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success' && result.analytics.daily_data) {
            const stateData = result.analytics.daily_data;
            const dates = stateData.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
            const normalData = stateData.map(d => parseFloat(d.normal) || 0);
            const standbyData = stateData.map(d => parseFloat(d.standby) || 0);
            const faultData = stateData.map(d => parseFloat(d.fault) || 0);
            
            charts.inverterStateChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Normal Mode (%)',
                            data: normalData,
                            backgroundColor: 'rgba(76, 175, 80, 0.8)',
                            borderColor: 'rgb(76, 175, 80)',
                            borderWidth: 1
                        },
                        {
                            label: 'Standby Mode (%)',
                            data: standbyData,
                            backgroundColor: 'rgba(255, 152, 0, 0.8)',
                            borderColor: 'rgb(255, 152, 0)',
                            borderWidth: 1
                        },
                        {
                            label: 'Fault Mode (%)',
                            data: faultData,
                            backgroundColor: 'rgba(244, 67, 54, 0.8)',
                            borderColor: 'rgb(244, 67, 54)',
                            borderWidth: 1
                        }
                    ]
                },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Số inverter'
                    }
                }
            }
        }
    });
        } else {
            // Fallback to placeholder
            const dates = data.daily_data ? data.daily_data.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })) : [];
            charts.inverterStateChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        { label: 'Normal Mode', data: Array(dates.length).fill(null), backgroundColor: 'rgba(76, 175, 80, 0.8)', borderColor: 'rgb(76, 175, 80)', borderWidth: 1 },
                        { label: 'Standby Mode', data: Array(dates.length).fill(null), backgroundColor: 'rgba(255, 152, 0, 0.8)', borderColor: 'rgb(255, 152, 0)', borderWidth: 1 },
                        { label: 'Fault Mode', data: Array(dates.length).fill(null), backgroundColor: 'rgba(244, 67, 54, 0.8)', borderColor: 'rgb(244, 67, 54)', borderWidth: 1 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true, max: 100, title: { display: true, text: 'Phần trăm (%)' } }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading operating state data:', error);
    }
}
