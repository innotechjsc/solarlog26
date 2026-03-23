// AI Diagnosis Dashboard Script
class AIDiagnosisDashboard {
  constructor() {
    this.API_BASE = this.getApiBase();
    this.selectedDevice = null;
    this.aiAnalysisChart = null;
  }

  init() {
    this.loadDevices();
    this.setupEventListeners();
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023/api/v1';
    } else {
      return '/api/v1';
    }
  }

  async loadDevices() {
    try {
      const response = await fetch(`${this.API_BASE}/devices`);
      const result = await response.json();
      
      if (result.status === 'success' && result.devices) {
        const select = document.getElementById('deviceSelect');
        result.devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.device_id;
          option.textContent = device.site_name || device.device_id;
          select.appendChild(option);
        });
        
        // Load data for first device or all devices
        if (result.devices.length > 0) {
          this.selectedDevice = result.devices[0].device_id;
          this.loadAIData();
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  setupEventListeners() {
    document.getElementById('deviceSelect').addEventListener('change', (e) => {
      this.selectedDevice = e.target.value || null;
      this.loadAIData();
    });
  }

  async loadAIData() {
    try {
      await Promise.all([
        this.detectAnomalies(),
        this.generateRecommendations(),
        this.predictFailures(),
        this.analyzePerformance()
      ]);
    } catch (error) {
      console.error('Error loading AI data:', error);
    }
  }

  async detectAnomalies() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        const devices = this.selectedDevice 
          ? devicesResult.devices.filter(d => d.device_id === this.selectedDevice)
          : devicesResult.devices;
        
        const anomalies = [];
        
        for (const device of devices) {
          try {
            // Get recent performance data
            const end = Math.floor(Date.now() / 1000);
            const start = end - (7 * 24 * 60 * 60);
            
            const perfResponse = await fetch(`${this.API_BASE}/analytics/performance?deviceId=${device.device_id}&start=${start}&end=${end}`);
            const perfResult = await perfResponse.json();
            
            const energyResponse = await fetch(`${this.API_BASE}/analytics/energy?deviceId=${device.device_id}&period=7days`);
            const energyResult = await energyResponse.json();
            
            const alertsResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/alarms?status=ACTIVE&limit=10`);
            const alertsResult = await alertsResponse.json();
            
            if (perfResult.status === 'success' && energyResult.status === 'success') {
              const perf = perfResult.analytics;
              const energy = energyResult.analytics;
              
              // Detect anomalies based on thresholds
              
              // Low efficiency anomaly
              if (perf.efficiency < 90) {
                anomalies.push({
                  device_id: device.device_id,
                  site_name: device.site_name || device.device_id,
                  type: 'low_efficiency',
                  severity: perf.efficiency < 85 ? 'high' : 'medium',
                  title: 'Hiệu suất thấp',
                  description: `Hiệu suất của thiết bị ${device.site_name || device.device_id} là ${perf.efficiency.toFixed(1)}%, thấp hơn mức bình thường (90%+)`,
                  value: perf.efficiency,
                  threshold: 90,
                  timestamp: new Date()
                });
              }
              
              // Low availability anomaly
              if (perf.availability < 95) {
                anomalies.push({
                  device_id: device.device_id,
                  site_name: device.site_name || device.device_id,
                  type: 'low_availability',
                  severity: perf.availability < 90 ? 'high' : 'medium',
                  title: 'Tỷ lệ hoạt động thấp',
                  description: `Tỷ lệ hoạt động của thiết bị là ${perf.availability.toFixed(1)}%, thấp hơn mức mong đợi (95%+)`,
                  value: perf.availability,
                  threshold: 95,
                  timestamp: new Date()
                });
              }
              
              // Energy production drop
              if (energy.daily_data && energy.daily_data.length >= 2) {
                const recent = energy.daily_data.slice(-3);
                const older = energy.daily_data.slice(-7, -3);
                const recentAvg = recent.reduce((sum, d) => sum + (d.energy || 0), 0) / recent.length;
                const olderAvg = older.reduce((sum, d) => sum + (d.energy || 0), 0) / older.length;
                
                if (olderAvg > 0 && (recentAvg / olderAvg) < 0.8) {
                  anomalies.push({
                    device_id: device.device_id,
                    site_name: device.site_name || device.device_id,
                    type: 'production_drop',
                    severity: (recentAvg / olderAvg) < 0.7 ? 'high' : 'medium',
                    title: 'Sản lượng giảm đột ngột',
                    description: `Sản lượng trung bình 3 ngày gần đây (${recentAvg.toFixed(1)} kWh) thấp hơn 20% so với 4 ngày trước đó (${olderAvg.toFixed(1)} kWh)`,
                    value: (recentAvg / olderAvg) * 100,
                    threshold: 80,
                    timestamp: new Date()
                  });
                }
              }
              
              // Active alarms
              if (alertsResult.status === 'success' && alertsResult.alarms && alertsResult.alarms.length > 0) {
                alertsResult.alarms.forEach(alarm => {
                  if (alarm.severity === 'CRITICAL' || alarm.severity === 'MAJOR') {
                    anomalies.push({
                      device_id: device.device_id,
                      site_name: device.site_name || device.device_id,
                      type: 'active_alarm',
                      severity: alarm.severity === 'CRITICAL' ? 'high' : 'medium',
                      title: `Cảnh báo ${alarm.severity}`,
                      description: alarm.description || `Mã cảnh báo: ${alarm.alarm_code}`,
                      alarm_code: alarm.alarm_code,
                      timestamp: new Date(alarm.start_time)
                    });
                  }
                });
              }
            }
          } catch (error) {
            console.error(`Error analyzing device ${device.device_id}:`, error);
          }
        }
        
        // Sort by severity
        const severityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        anomalies.sort((a, b) => {
          return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
        });
        
        this.renderAnomalies(anomalies);
        document.getElementById('anomaliesCount').textContent = anomalies.length;
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      document.getElementById('anomaliesList').innerHTML = '<div class="empty-state">Lỗi khi phân tích dữ liệu</div>';
    }
  }

  renderAnomalies(anomalies) {
    const container = document.getElementById('anomaliesList');
    container.innerHTML = '';
    
    if (anomalies.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p>Không phát hiện bất thường nào</p>
        </div>
      `;
      return;
    }
    
    anomalies.forEach(anomaly => {
      const item = document.createElement('div');
      item.className = `anomaly-item ${anomaly.severity}`;
      
      const score = anomaly.severity === 'high' ? 'Cao' : anomaly.severity === 'medium' ? 'Trung bình' : 'Thấp';
      
      item.innerHTML = `
        <div class="anomaly-header">
          <div class="anomaly-title">${anomaly.title}</div>
          <span class="anomaly-score ${anomaly.severity}">${score}</span>
        </div>
        <div class="anomaly-description">${anomaly.description}</div>
        <div class="anomaly-meta">
          Thiết bị: ${anomaly.site_name || anomaly.device_id} | 
          Phát hiện: ${anomaly.timestamp.toLocaleString('vi-VN')}
          ${anomaly.value !== undefined ? ` | Giá trị: ${anomaly.value.toFixed(2)}${anomaly.type === 'low_efficiency' || anomaly.type === 'low_availability' ? '%' : ''}` : ''}
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  async generateRecommendations() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        const devices = this.selectedDevice 
          ? devicesResult.devices.filter(d => d.device_id === this.selectedDevice)
          : devicesResult.devices;
        
        const recommendations = [];
        
        for (const device of devices.slice(0, 5)) {
          try {
            const perfResponse = await fetch(`${this.API_BASE}/analytics/performance?deviceId=${device.device_id}&start=${Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)}&end=${Math.floor(Date.now() / 1000)}`);
            const perfResult = await perfResponse.json();
            
            if (perfResult.status === 'success') {
              const perf = perfResult.analytics;
              
              // Generate recommendations based on performance
              if (perf.efficiency < 95) {
                recommendations.push({
                  device_id: device.device_id,
                  site_name: device.site_name || device.device_id,
                  type: 'optimization',
                  icon: '⚡',
                  title: 'Tối ưu hóa hiệu suất',
                  description: `Hiệu suất hiện tại là ${perf.efficiency.toFixed(1)}%. Kiểm tra và làm sạch tấm pin, kiểm tra kết nối inverter để cải thiện hiệu suất.`,
                  impact: 'Có thể tăng hiệu suất lên 3-5%'
                });
              }
              
              if (perf.availability < 98) {
                recommendations.push({
                  device_id: device.device_id,
                  site_name: device.site_name || device.device_id,
                  type: 'maintenance',
                  icon: '🔧',
                  title: 'Bảo trì định kỳ',
                  description: `Tỷ lệ hoạt động là ${perf.availability.toFixed(1)}%. Thực hiện bảo trì định kỳ để đảm bảo hệ thống hoạt động ổn định.`,
                  impact: 'Có thể tăng tỷ lệ hoạt động lên 98%+'
                });
              }
              
              if (perf.avg_power < perf.max_power * 0.7) {
                recommendations.push({
                  device_id: device.device_id,
                  site_name: device.site_name || device.device_id,
                  type: 'inspection',
                  icon: '🔍',
                  title: 'Kiểm tra hệ thống',
                  description: `Công suất trung bình (${perf.avg_power.toFixed(2)} kW) thấp hơn đáng kể so với công suất tối đa (${perf.max_power.toFixed(2)} kW). Kiểm tra các thành phần hệ thống.`,
                  impact: 'Có thể phát hiện và khắc phục sự cố sớm'
                });
              }
            }
          } catch (error) {
            console.error(`Error generating recommendations for device ${device.device_id}:`, error);
          }
        }
        
        // Add general recommendations
        recommendations.push({
          type: 'general',
          icon: '📊',
          title: 'Theo dõi xu hướng',
          description: 'Sử dụng biểu đồ hiệu suất để theo dõi xu hướng dài hạn và phát hiện các vấn đề tiềm ẩn.',
          impact: 'Giúp dự đoán và ngăn chặn sự cố'
        });
        
        this.renderRecommendations(recommendations);
        document.getElementById('recommendationsCount').textContent = recommendations.length;
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      document.getElementById('recommendationsList').innerHTML = '<div class="empty-state">Lỗi khi tạo gợi ý</div>';
    }
  }

  renderRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    container.innerHTML = '';
    
    if (recommendations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💡</div>
          <p>Không có gợi ý nào tại thời điểm này</p>
        </div>
      `;
      return;
    }
    
    recommendations.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'recommendation-item';
      
      item.innerHTML = `
        <div class="recommendation-header">
          <div class="recommendation-icon">${rec.icon}</div>
          <div class="recommendation-content">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-description">${rec.description}</div>
            ${rec.impact ? `<div class="recommendation-impact">💡 ${rec.impact}</div>` : ''}
          </div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  async predictFailures() {
    try {
      const devicesResponse = await fetch(`${this.API_BASE}/devices`);
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.status === 'success' && devicesResult.devices.length > 0) {
        const devices = this.selectedDevice 
          ? devicesResult.devices.filter(d => d.device_id === this.selectedDevice)
          : devicesResult.devices;
        
        const predictions = [];
        
        for (const device of devices.slice(0, 5)) {
          try {
            const perfResponse = await fetch(`${this.API_BASE}/analytics/performance?deviceId=${device.device_id}&start=${Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60)}&end=${Math.floor(Date.now() / 1000)}`);
            const perfResult = await perfResponse.json();
            
            const alertsResponse = await fetch(`${this.API_BASE}/devices/${device.device_id}/alarms?limit=20`);
            const alertsResult = await alertsResponse.json();
            
            if (perfResult.status === 'success') {
              const perf = perfResult.analytics;
              
              // Calculate failure probability based on various factors
              let failureProbability = 0;
              
              // Low efficiency increases risk
              if (perf.efficiency < 90) {
                failureProbability += 30;
              } else if (perf.efficiency < 95) {
                failureProbability += 15;
              }
              
              // Low availability increases risk
              if (perf.availability < 90) {
                failureProbability += 25;
              } else if (perf.availability < 95) {
                failureProbability += 10;
              }
              
              // Recent alarms increase risk
              if (alertsResult.status === 'success' && alertsResult.alarms) {
                const recentAlarms = alertsResult.alarms.filter(a => {
                  const alarmTime = new Date(a.start_time);
                  const daysAgo = (Date.now() - alarmTime.getTime()) / (1000 * 60 * 60 * 24);
                  return daysAgo <= 7;
                });
                
                failureProbability += recentAlarms.length * 5;
              }
              
              failureProbability = Math.min(failureProbability, 95);
              
              if (failureProbability > 20) {
                predictions.push({
                  device_id: device.device_id,
                  site_name: device.site_name || device.device_id,
                  type: 'component_failure',
                  title: 'Nguy cơ hỏng hóc thành phần',
                  description: `Dựa trên phân tích hiệu suất và lịch sử cảnh báo, có ${failureProbability}% khả năng xảy ra sự cố trong 30 ngày tới.`,
                  probability: failureProbability,
                  timeframe: '30 ngày'
                });
              }
            }
          } catch (error) {
            console.error(`Error predicting failures for device ${device.device_id}:`, error);
          }
        }
        
        this.renderPredictions(predictions);
        document.getElementById('predictionsCount').textContent = predictions.length;
      }
    } catch (error) {
      console.error('Error predicting failures:', error);
      document.getElementById('predictionsGrid').innerHTML = '<div class="empty-state">Lỗi khi dự đoán</div>';
    }
  }

  renderPredictions(predictions) {
    const container = document.getElementById('predictionsGrid');
    container.innerHTML = '';
    
    if (predictions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p>Không có dự đoán sự cố nào</p>
        </div>
      `;
      return;
    }
    
    predictions.forEach(pred => {
      const card = document.createElement('div');
      card.className = 'prediction-card';
      
      card.innerHTML = `
        <div class="prediction-header">
          <div class="prediction-icon">🔮</div>
          <div class="prediction-title">${pred.title}</div>
        </div>
        <div class="prediction-description">${pred.description}</div>
        <div class="prediction-probability">
          Xác suất: ${pred.probability}%
          <div class="probability-bar">
            <div class="probability-fill" style="width: ${pred.probability}%"></div>
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
  }

  async analyzePerformance() {
    try {
      if (!this.selectedDevice) return;
      
      const end = Math.floor(Date.now() / 1000);
      const start = end - (30 * 24 * 60 * 60);
      
      const response = await fetch(`${this.API_BASE}/devices/${this.selectedDevice}/history?start=${start}&end=${end}&interval=1day`);
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.length > 0) {
        this.renderAIAnalysisChart(result.data);
      }
    } catch (error) {
      console.error('Error analyzing performance:', error);
    }
  }

  renderAIAnalysisChart(data) {
    const ctx = document.getElementById('aiAnalysisChart');
    if (!ctx) return;

    if (this.aiAnalysisChart) {
      this.aiAnalysisChart.destroy();
    }

    const labels = data.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    // Calculate efficiency trend
    const efficiency = data.map(d => {
      if (d.inverters && d.inverters.length > 0) {
        return d.inverters.reduce((sum, inv) => sum + (inv.efficiency || 0), 0) / d.inverters.length;
      }
      return 0;
    });

    // Calculate moving average for trend line
    const movingAvg = [];
    const window = 3;
    for (let i = 0; i < efficiency.length; i++) {
      const start = Math.max(0, i - window + 1);
      const end = i + 1;
      const slice = efficiency.slice(start, end);
      movingAvg.push(slice.reduce((sum, val) => sum + val, 0) / slice.length);
    }

    this.aiAnalysisChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Hiệu suất thực tế',
            data: efficiency,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            tension: 0.4,
            pointRadius: 2
          },
          {
            label: 'Xu hướng (AI)',
            data: movingAvg,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            borderDash: [5, 5],
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
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 90,
            max: 100,
            title: {
              display: true,
              text: 'Hiệu suất (%)'
            }
          }
        }
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AIDiagnosisDashboard();
    dashboard.init();
  });
} else {
  const dashboard = new AIDiagnosisDashboard();
  dashboard.init();
}

