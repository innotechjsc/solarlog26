const express = require('express');
const router = express.Router();
const ApiLog = require('../models/ApiLog');

/**
 * GET /api/v1/logs
 * Get API logs with filtering and pagination
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 50, max: 500)
 * - method: filter by HTTP method
 * - path: filter by path (supports partial match)
 * - status_code: filter by status code
 * - status_type: filter by status type (success, error, client_error, server_error)
 * - ip_address: filter by IP address
 * - start_date: ISO date string or timestamp
 * - end_date: ISO date string or timestamp
 * - api_key: filter by API key (partial match)
 */
router.get('/v1/logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      method,
      path,
      status_code,
      status_type,
      ip_address,
      start_date,
      end_date,
      api_key,
      sort = 'desc' // 'asc' or 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (method) {
      query.method = method.toUpperCase();
    }

    if (path) {
      query.path = { $regex: path, $options: 'i' };
    }

    if (status_code) {
      query.status_code = parseInt(status_code);
    }

    if (status_type) {
      query.status_type = status_type;
    }

    if (ip_address) {
      query.ip_address = { $regex: ip_address, $options: 'i' };
    }

    if (api_key) {
      query.api_key = { $regex: api_key, $options: 'i' };
    }

    // Date range filter
    if (start_date || end_date) {
      query.createdAt = {};
      if (start_date) {
        const start = isNaN(start_date) ? new Date(start_date) : new Date(parseInt(start_date) * 1000);
        query.createdAt.$gte = start;
      }
      if (end_date) {
        const end = isNaN(end_date) ? new Date(end_date) : new Date(parseInt(end_date) * 1000);
        query.createdAt.$lte = end;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort order
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Execute query
    const [logs, total] = await Promise.all([
      ApiLog.find(query)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ApiLog.countDocuments(query)
    ]);

    // Calculate statistics
    const stats = await ApiLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_requests: { $sum: 1 },
          avg_response_time: { $avg: '$response_time_ms' },
          total_success: {
            $sum: { $cond: [{ $eq: ['$status_type', 'success'] }, 1, 0] }
          },
          total_client_errors: {
            $sum: { $cond: [{ $eq: ['$status_type', 'client_error'] }, 1, 0] }
          },
          total_server_errors: {
            $sum: { $cond: [{ $eq: ['$status_type', 'server_error'] }, 1, 0] }
          },
          total_bytes_sent: { $sum: '$response_size_bytes' },
          total_bytes_received: { $sum: '$request_size_bytes' }
        }
      }
    ]);

    const statistics = stats[0] || {
      total_requests: 0,
      avg_response_time: 0,
      total_success: 0,
      total_client_errors: 0,
      total_server_errors: 0,
      total_bytes_sent: 0,
      total_bytes_received: 0
    };

    res.json({
      status: 'success',
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      },
      statistics: {
        ...statistics,
        success_rate: statistics.total_requests > 0
          ? ((statistics.total_success / statistics.total_requests) * 100).toFixed(2)
          : 0
      },
      logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/logs/stats
 * Get aggregated statistics for logs
 */
router.get('/v1/logs/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const matchQuery = {};
    if (start_date || end_date) {
      matchQuery.createdAt = {};
      if (start_date) {
        const start = isNaN(start_date) ? new Date(start_date) : new Date(parseInt(start_date) * 1000);
        matchQuery.createdAt.$gte = start;
      }
      if (end_date) {
        const end = isNaN(end_date) ? new Date(end_date) : new Date(parseInt(end_date) * 1000);
        matchQuery.createdAt.$lte = end;
      }
    }

    const stats = await ApiLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total_requests: { $sum: 1 },
          avg_response_time: { $avg: '$response_time_ms' },
          max_response_time: { $max: '$response_time_ms' },
          min_response_time: { $min: '$response_time_ms' },
          total_success: {
            $sum: { $cond: [{ $eq: ['$status_type', 'success'] }, 1, 0] }
          },
          total_client_errors: {
            $sum: { $cond: [{ $eq: ['$status_type', 'client_error'] }, 1, 0] }
          },
          total_server_errors: {
            $sum: { $cond: [{ $eq: ['$status_type', 'server_error'] }, 1, 0] }
          },
          total_bytes_sent: { $sum: '$response_size_bytes' },
          total_bytes_received: { $sum: '$request_size_bytes' },
          methods: {
            $push: '$method'
          },
          status_codes: {
            $push: '$status_code'
          }
        }
      },
      {
        $project: {
          total_requests: 1,
          avg_response_time: { $round: ['$avg_response_time', 2] },
          max_response_time: 1,
          min_response_time: 1,
          total_success: 1,
          total_client_errors: 1,
          total_server_errors: 1,
          total_bytes_sent: 1,
          total_bytes_received: 1,
          success_rate: {
            $multiply: [
              { $divide: ['$total_success', '$total_requests'] },
              100
            ]
          }
        }
      }
    ]);

    // Get top endpoints
    const topEndpoints = await ApiLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { method: '$method', path: '$path' },
          count: { $sum: 1 },
          avg_response_time: { $avg: '$response_time_ms' },
          errors: {
            $sum: {
              $cond: [
                { $in: ['$status_type', ['client_error', 'server_error']] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      status: 'success',
      statistics: stats[0] || {
        total_requests: 0,
        avg_response_time: 0,
        max_response_time: 0,
        min_response_time: 0,
        total_success: 0,
        total_client_errors: 0,
        total_server_errors: 0,
        total_bytes_sent: 0,
        total_bytes_received: 0,
        success_rate: 0
      },
      top_endpoints: topEndpoints.map(item => ({
        method: item._id.method,
        path: item._id.path,
        count: item.count,
        avg_response_time: Math.round(item.avg_response_time),
        errors: item.errors
      }))
    });
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch log statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/logs/:id
 * Get a specific log entry by ID
 */
router.get('/v1/logs/:id', async (req, res) => {
  try {
    const log = await ApiLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: 'Log not found'
      });
    }

    res.json({
      status: 'success',
      log
    });
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch log',
      error: error.message
    });
  }
});

module.exports = router;
