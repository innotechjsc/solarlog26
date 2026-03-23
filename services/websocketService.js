// WebSocket Service using Socket.IO
// This service handles real-time updates for dashboard and notifications

class WebSocketService {
  constructor() {
    this.io = null;
    this.clients = new Map(); // Track connected clients
  }

  /**
   * Initialize Socket.IO server
   * @param {http.Server} server - HTTP server instance
   */
  initialize(server) {
    try {
      const { Server } = require('socket.io');

      this.io = new Server(server, {
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
      });

      this.io.on('connection', (socket) => {
        console.log(`[WebSocket] Client connected: ${socket.id}`);

        // Track client
        this.clients.set(socket.id, {
          id: socket.id,
          connectedAt: new Date(),
          rooms: []
        });

        // Join rooms based on user interests
        socket.on('subscribe', (data) => {
          if (data.device_id) {
            socket.join(`device:${data.device_id}`);
            this.clients.get(socket.id).rooms.push(`device:${data.device_id}`);
          }
          if (data.project_id) {
            socket.join(`project:${data.project_id}`);
            this.clients.get(socket.id).rooms.push(`project:${data.project_id}`);
          }
          if (data.area_id) {
            socket.join(`area:${data.area_id}`);
            this.clients.get(socket.id).rooms.push(`area:${data.area_id}`);
          }
          // Join general rooms
          socket.join('dashboard');
          socket.join('notifications');
          
          console.log(`[WebSocket] Client ${socket.id} subscribed to rooms`);
        });

        // Unsubscribe from rooms
        socket.on('unsubscribe', (data) => {
          if (data.device_id) {
            socket.leave(`device:${data.device_id}`);
          }
          if (data.project_id) {
            socket.leave(`project:${data.project_id}`);
          }
          if (data.area_id) {
            socket.leave(`area:${data.area_id}`);
          }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          console.log(`[WebSocket] Client disconnected: ${socket.id}`);
          this.clients.delete(socket.id);
        });

        // Handle errors
        socket.on('error', (error) => {
          console.error(`[WebSocket] Error for client ${socket.id}:`, error);
        });
      });

      console.log('[WebSocket] Socket.IO server initialized');
      return this.io;
    } catch (error) {
      console.error('[WebSocket] Error initializing Socket.IO:', error);
      throw error;
    }
  }

  /**
   * Emit data update to specific device room
   * @param {string} deviceId - Device ID
   * @param {object} data - Data to send
   */
  emitDeviceUpdate(deviceId, data) {
    if (!this.io) return;
    this.io.to(`device:${deviceId}`).emit('device_update', {
      device_id: deviceId,
      data: data,
      timestamp: new Date()
    });
  }

  /**
   * Emit notification to users
   * @param {string} userId - User ID (optional)
   * @param {string} areaId - Area ID (optional)
   * @param {string} projectId - Project ID (optional)
   * @param {object} notification - Notification data
   */
  emitNotification(userId, areaId, projectId, notification) {
    if (!this.io) return;

    const payload = {
      notification: notification,
      timestamp: new Date()
    };

    // Send to specific user
    if (userId) {
      this.io.to(`user:${userId}`).emit('notification', payload);
    }

    // Send to area room
    if (areaId) {
      this.io.to(`area:${areaId}`).emit('notification', payload);
    }

    // Send to project room
    if (projectId) {
      this.io.to(`project:${projectId}`).emit('notification', payload);
    }

    // Send to all dashboard clients
    this.io.to('notifications').emit('notification', payload);
  }

  /**
   * Emit alarm to relevant rooms
   * @param {object} alarm - Alarm data
   * @param {string} deviceId - Device ID
   * @param {string} areaId - Area ID (optional)
   */
  emitAlarm(alarm, deviceId, areaId = null) {
    if (!this.io) return;

    const payload = {
      alarm: alarm,
      device_id: deviceId,
      timestamp: new Date()
    };

    // Send to device room
    this.io.to(`device:${deviceId}`).emit('alarm', payload);

    // Send to area room
    if (areaId) {
      this.io.to(`area:${areaId}`).emit('alarm', payload);
    }

    // Send to dashboard room
    this.io.to('dashboard').emit('alarm', payload);
  }

  /**
   * Emit aggregated dashboard data
   * @param {object} dashboardData - Aggregated dashboard data
   */
  emitDashboardData(dashboardData) {
    if (!this.io) return;
    this.io.to('dashboard').emit('dashboard_data', {
      data: dashboardData,
      timestamp: new Date()
    });
  }

  /**
   * Get connected clients count
   * @returns {number}
   */
  getConnectedCount() {
    return this.clients.size;
  }

  /**
   * Get all connected clients
   * @returns {Array}
   */
  getConnectedClients() {
    return Array.from(this.clients.values());
  }
}

// Export singleton instance
module.exports = new WebSocketService();

