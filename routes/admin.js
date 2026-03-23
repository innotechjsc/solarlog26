const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Area = require('../models/Area');
const Device = require('../models/Device');
const DataPoint = require('../models/DataPoint');
const DailySummary = require('../models/DailySummary');
const HourlySummary = require('../models/HourlySummary');
const Alarm = require('../models/Alarm');
const moment = require('moment-timezone');

// ==================== PROJECTS ====================

/**
 * GET /api/v1/admin/projects
 * Get all projects
 */
router.get('/v1/admin/projects', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const projects = await Project.find(query).sort({ createdAt: -1 });
    
    // Get statistics for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const areas = await Area.countDocuments({ project_id: project._id });
        const devices = await Device.countDocuments({ project_id: project._id });
        const onlineDevices = await Device.countDocuments({ 
          project_id: project._id, 
          status: 'online' 
        });
        
        // Get today's energy
        const today = moment().startOf('day').toDate();
        const todaySummaries = await DailySummary.find({
          device_id: { $in: await Device.find({ project_id: project._id }).distinct('device_id') },
          date: today
        });
        const todayEnergy = todaySummaries.reduce((sum, s) => sum + (s.total_energy || 0), 0);
        
        return {
          ...project.toObject(),
          stats: {
            areas,
            devices,
            online_devices: onlineDevices,
            today_energy: todayEnergy
          }
        };
      })
    );
    
    res.json({
      status: 'success',
      count: projectsWithStats.length,
      projects: projectsWithStats
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch projects'
    });
  }
});

/**
 * POST /api/v1/admin/projects
 * Create a new project
 */
router.post('/v1/admin/projects',
  [
    body('name').notEmpty().withMessage('Project name is required'),
    body('code').notEmpty().withMessage('Project code is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const project = new Project(req.body);
      await project.save();
      
      res.status(201).json({
        status: 'success',
        project
      });
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'Project code already exists'
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to create project'
      });
    }
  }
);

/**
 * GET /api/v1/admin/projects/:projectId
 * Get project details
 */
router.get('/v1/admin/projects/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }
    
    res.json({
      status: 'success',
      project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project'
    });
  }
});

/**
 * PUT /api/v1/admin/projects/:projectId
 * Update project
 */
router.put('/v1/admin/projects/:projectId', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }
    
    res.json({
      status: 'success',
      project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update project'
    });
  }
});

/**
 * DELETE /api/v1/admin/projects/:projectId
 * Delete project
 */
router.delete('/v1/admin/projects/:projectId', async (req, res) => {
  try {
    // Check if project has areas or devices
    const areasCount = await Area.countDocuments({ project_id: req.params.projectId });
    const devicesCount = await Device.countDocuments({ project_id: req.params.projectId });
    
    if (areasCount > 0 || devicesCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete project with existing areas or devices'
      });
    }
    
    const project = await Project.findByIdAndDelete(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete project'
    });
  }
});

// ==================== AREAS ====================

/**
 * GET /api/v1/admin/projects/:projectId/areas
 * Get all areas in a project
 */
router.get('/v1/admin/projects/:projectId/areas', async (req, res) => {
  try {
    const areas = await Area.find({ project_id: req.params.projectId })
      .sort({ createdAt: -1 });
    
    // Get statistics for each area
    const areasWithStats = await Promise.all(
      areas.map(async (area) => {
        const devices = await Device.countDocuments({ area_id: area._id });
        const onlineDevices = await Device.countDocuments({ 
          area_id: area._id, 
          status: 'online' 
        });
        
        // Get today's energy
        const today = moment().startOf('day').toDate();
        const todaySummaries = await DailySummary.find({
          device_id: { $in: await Device.find({ area_id: area._id }).distinct('device_id') },
          date: today
        });
        const todayEnergy = todaySummaries.reduce((sum, s) => sum + (s.total_energy || 0), 0);
        
        return {
          ...area.toObject(),
          stats: {
            devices,
            online_devices: onlineDevices,
            today_energy: todayEnergy
          }
        };
      })
    );
    
    res.json({
      status: 'success',
      count: areasWithStats.length,
      areas: areasWithStats
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch areas'
    });
  }
});

/**
 * POST /api/v1/admin/projects/:projectId/areas
 * Create a new area
 */
router.post('/v1/admin/projects/:projectId/areas',
  [
    body('name').notEmpty().withMessage('Area name is required'),
    body('code').notEmpty().withMessage('Area code is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      // Verify project exists
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({
          status: 'error',
          message: 'Project not found'
        });
      }
      
      const area = new Area({
        ...req.body,
        project_id: req.params.projectId
      });
      await area.save();
      
      res.status(201).json({
        status: 'success',
        area
      });
    } catch (error) {
      console.error('Error creating area:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'Area code already exists in this project'
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to create area'
      });
    }
  }
);

/**
 * PUT /api/v1/admin/areas/:areaId
 * Update area
 */
router.put('/v1/admin/areas/:areaId', async (req, res) => {
  try {
    const area = await Area.findByIdAndUpdate(
      req.params.areaId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!area) {
      return res.status(404).json({
        status: 'error',
        message: 'Area not found'
      });
    }
    
    res.json({
      status: 'success',
      area
    });
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update area'
    });
  }
});

/**
 * DELETE /api/v1/admin/areas/:areaId
 * Delete area
 */
router.delete('/v1/admin/areas/:areaId', async (req, res) => {
  try {
    // Check if area has devices
    const devicesCount = await Device.countDocuments({ area_id: req.params.areaId });
    
    if (devicesCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete area with existing devices'
      });
    }
    
    const area = await Area.findByIdAndDelete(req.params.areaId);
    if (!area) {
      return res.status(404).json({
        status: 'error',
        message: 'Area not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Area deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting area:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete area'
    });
  }
});

// ==================== DEVICES ====================

/**
 * GET /api/v1/admin/areas/:areaId/devices
 * Get all devices in an area
 */
router.get('/v1/admin/areas/:areaId/devices', async (req, res) => {
  try {
    const devices = await Device.find({ area_id: req.params.areaId })
      .populate('project_id', 'name code')
      .populate('area_id', 'name code')
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch devices'
    });
  }
});

/**
 * POST /api/v1/admin/areas/:areaId/devices
 * Create a new device
 */
router.post('/v1/admin/areas/:areaId/devices',
  [
    body('device_id').notEmpty().withMessage('Device ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      // Verify area exists
      const area = await Area.findById(req.params.areaId).populate('project_id');
      if (!area) {
        return res.status(404).json({
          status: 'error',
          message: 'Area not found'
        });
      }
      
      const devFields = { ...req.body, area_id: req.params.areaId, project_id: area.project_id._id };
      if (devFields.site_id) {
        devFields.site_id_cms_locked = true;
      }
      const device = new Device(devFields);
      await device.save();
      
      res.status(201).json({
        status: 'success',
        device
      });
    } catch (error) {
      console.error('Error creating device:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          status: 'error',
          message: 'Device ID already exists'
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to create device'
      });
    }
  }
);

/**
 * PUT /api/v1/admin/devices/:deviceId
 * Update device
 */
router.put('/v1/admin/devices/:deviceId', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.site_id_follow_device === true) {
      body.site_id_cms_locked = false;
      delete body.site_id_follow_device;
    } else if (Object.prototype.hasOwnProperty.call(body, 'site_id')) {
      body.site_id_cms_locked = true;
    }

    const device = await Device.findByIdAndUpdate(
      req.params.deviceId,
      body,
      { new: true, runValidators: true }
    ).populate('project_id', 'name code')
     .populate('area_id', 'name code');
    
    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }
    
    res.json({
      status: 'success',
      device
    });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update device'
    });
  }
});

// ==================== REPORTS ====================

/**
 * GET /api/v1/admin/reports/project/:projectId
 * Get project report
 */
router.get('/v1/admin/reports/project/:projectId', async (req, res) => {
  try {
    const { start, end, period = '7days' } = req.query;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }
    
    // Get all devices in project
    const devices = await Device.find({ project_id: req.params.projectId })
      .distinct('device_id');
    
    // Calculate date range
    let startDate, endDate;
    if (start && end) {
      startDate = new Date(parseInt(start) * 1000);
      endDate = new Date(parseInt(end) * 1000);
    } else {
      endDate = new Date();
      switch (period) {
        case '7days':
          startDate = moment().subtract(7, 'days').toDate();
          break;
        case '30days':
          startDate = moment().subtract(30, 'days').toDate();
          break;
        case '1year':
          startDate = moment().subtract(1, 'year').toDate();
          break;
        default:
          startDate = moment().subtract(7, 'days').toDate();
      }
    }
    
    // Get daily summaries
    const dailySummaries = await DailySummary.find({
      device_id: { $in: devices },
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Calculate statistics
    const totalEnergy = dailySummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const avgDailyEnergy = dailySummaries.length > 0 ? totalEnergy / dailySummaries.length : 0;
    const maxDailyEnergy = Math.max(...dailySummaries.map(d => d.total_energy || 0), 0);
    
    // Get areas
    const areas = await Area.find({ project_id: req.params.projectId });
    const areaStats = await Promise.all(
      areas.map(async (area) => {
        const areaDevices = await Device.find({ area_id: area._id }).distinct('device_id');
        const areaSummaries = dailySummaries.filter(d => areaDevices.includes(d.device_id));
        const areaEnergy = areaSummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
        
        return {
          area_id: area._id,
          area_name: area.name,
          area_code: area.code,
          energy: areaEnergy,
          devices: areaDevices.length
        };
      })
    );
    
    res.json({
      status: 'success',
      project: {
        id: project._id,
        name: project.name,
        code: project.code
      },
      period: {
        start: startDate,
        end: endDate
      },
      statistics: {
        total_energy: totalEnergy,
        avg_daily_energy: avgDailyEnergy,
        max_daily_energy: maxDailyEnergy,
        total_days: dailySummaries.length
      },
      areas: areaStats,
      daily_data: dailySummaries.map(d => ({
        date: d.date,
        energy: d.total_energy,
        max_power: d.max_power
      }))
    });
  } catch (error) {
    console.error('Error generating project report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate project report'
    });
  }
});

/**
 * GET /api/v1/admin/reports/area/:areaId
 * Get area report
 */
router.get('/v1/admin/reports/area/:areaId', async (req, res) => {
  try {
    const { start, end, period = '7days' } = req.query;
    const area = await Area.findById(req.params.areaId).populate('project_id');
    if (!area) {
      return res.status(404).json({
        status: 'error',
        message: 'Area not found'
      });
    }
    
    // Get all devices in area
    const devices = await Device.find({ area_id: req.params.areaId })
      .distinct('device_id');
    
    // Calculate date range
    let startDate, endDate;
    if (start && end) {
      startDate = new Date(parseInt(start) * 1000);
      endDate = new Date(parseInt(end) * 1000);
    } else {
      endDate = new Date();
      switch (period) {
        case '7days':
          startDate = moment().subtract(7, 'days').toDate();
          break;
        case '30days':
          startDate = moment().subtract(30, 'days').toDate();
          break;
        case '1year':
          startDate = moment().subtract(1, 'year').toDate();
          break;
        default:
          startDate = moment().subtract(7, 'days').toDate();
      }
    }
    
    // Get daily summaries
    const dailySummaries = await DailySummary.find({
      device_id: { $in: devices },
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Calculate statistics
    const totalEnergy = dailySummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
    const avgDailyEnergy = dailySummaries.length > 0 ? totalEnergy / dailySummaries.length : 0;
    const maxDailyEnergy = Math.max(...dailySummaries.map(d => d.total_energy || 0), 0);
    
    // Get device stats
    const deviceStats = await Promise.all(
      devices.map(async (deviceId) => {
        const device = await Device.findOne({ device_id: deviceId });
        const deviceSummaries = dailySummaries.filter(d => d.device_id === deviceId);
        const deviceEnergy = deviceSummaries.reduce((sum, d) => sum + (d.total_energy || 0), 0);
        
        return {
          device_id: deviceId,
          device_name: device?.site_name || deviceId,
          energy: deviceEnergy,
          status: device?.status || 'offline'
        };
      })
    );
    
    res.json({
      status: 'success',
      area: {
        id: area._id,
        name: area.name,
        code: area.code,
        project: {
          id: area.project_id._id,
          name: area.project_id.name,
          code: area.project_id.code
        }
      },
      period: {
        start: startDate,
        end: endDate
      },
      statistics: {
        total_energy: totalEnergy,
        avg_daily_energy: avgDailyEnergy,
        max_daily_energy: maxDailyEnergy,
        total_days: dailySummaries.length,
        devices_count: devices.length
      },
      devices: deviceStats,
      daily_data: dailySummaries.map(d => ({
        date: d.date,
        energy: d.total_energy,
        max_power: d.max_power
      }))
    });
  } catch (error) {
    console.error('Error generating area report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate area report'
    });
  }
});

module.exports = router;

