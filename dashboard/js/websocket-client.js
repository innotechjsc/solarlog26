// WebSocket Client for Dashboard Real-time Updates

class WebSocketClient {
  constructor(apiBase) {
    this.apiBase = apiBase || this.getApiBase();
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.subscriptions = {
      device_id: null,
      project_id: null,
      area_id: null
    };
    this.listeners = {
      dashboard_data: [],
      notification: [],
      alarm: [],
      device_update: []
    };
  }

  getApiBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5023';
    }
    return window.location.origin;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    try {
      // Use Socket.IO CDN if available, otherwise try native WebSocket
      if (typeof io !== 'undefined') {
        this.socket = io(this.apiBase, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });

        this.socket.on('connect', () => {
          console.log('[WebSocket] Connected to server');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.subscribe();
        });

        this.socket.on('disconnect', () => {
          console.log('[WebSocket] Disconnected from server');
          this.connected = false;
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
          this.connected = true;
          this.subscribe();
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('[WebSocket] Reconnection failed after max attempts');
        });

        this.socket.on('connect_error', (error) => {
          console.error('[WebSocket] Connection error:', error);
          this.connected = false;
        });

        // Listen for events
        this.socket.on('dashboard_data', (data) => {
          console.log('[WebSocket] Dashboard data update:', data);
          this.emit('dashboard_data', data);
        });

        this.socket.on('notification', (data) => {
          console.log('[WebSocket] New notification:', data);
          this.emit('notification', data);
        });

        this.socket.on('alarm', (data) => {
          console.log('[WebSocket] New alarm:', data);
          this.emit('alarm', data);
        });

        this.socket.on('device_update', (data) => {
          console.log('[WebSocket] Device update:', data);
          this.emit('device_update', data);
        });
      } else {
        console.warn('[WebSocket] Socket.IO not loaded. WebSocket features disabled.');
      }
    } catch (error) {
      console.error('[WebSocket] Error connecting:', error);
    }
  }

  /**
   * Subscribe to updates
   * @param {object} subscriptions - { device_id, project_id, area_id }
   */
  subscribe(subscriptions = null) {
    if (!this.socket || !this.connected) return;

    const subs = subscriptions || this.subscriptions;
    
    try {
      this.socket.emit('subscribe', subs);
      this.subscriptions = { ...this.subscriptions, ...subs };
      console.log('[WebSocket] Subscribed to:', subs);
    } catch (error) {
      console.error('[WebSocket] Error subscribing:', error);
    }
  }

  /**
   * Unsubscribe from updates
   * @param {object} subscriptions - { device_id, project_id, area_id }
   */
  unsubscribe(subscriptions) {
    if (!this.socket || !this.connected) return;

    try {
      this.socket.emit('unsubscribe', subscriptions);
      console.log('[WebSocket] Unsubscribed from:', subscriptions);
    } catch (error) {
      console.error('[WebSocket] Error unsubscribing:', error);
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WebSocket] Error in listener for ${event}:`, error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('[WebSocket] Disconnected');
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.webSocketClient = new WebSocketClient();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebSocketClient;
}

