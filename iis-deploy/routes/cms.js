const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Area = require('../models/Area');
const Device = require('../models/Device');
const Notification = require('../models/Notification');
const { authenticateJWT, requirePermission, requireRole } = require('../middleware/auth');

// ==================== PROJECTS ====================

/**
 * GET /api/v1/cms/projects
 * Get all projects (filtered by user permissions)
 */
router.get('/v1/cms/projects', authenticateJWT, async (req, res) => {
  try {
    let query = {};
    
    // Non-admin users can only see assigned projects
    if (req.user.role !== 'admin') {
      query._id = { $in: req.user.assigned_projects };
    }
    
    const projects = await Project.find(query).sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: projects.length,
      projects
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
 * POST /api/v1/cms/projects
 * Create project (admin only)
 */
router.post('/v1/cms/projects', authenticateJWT, requirePermission('projects.create'), async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create project'
    });
  }
});

/**
 * PUT /api/v1/cms/projects/:projectId
 * Update project (admin only)
 */
router.put('/v1/cms/projects/:projectId', authenticateJWT, requirePermission('projects.update'), async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findByIdAndUpdate(
      projectId,
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
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update project'
    });
  }
});

/**
 * DELETE /api/v1/cms/projects/:projectId
 * Delete project (admin only)
 */
router.delete('/v1/cms/projects/:projectId', authenticateJWT, requirePermission('projects.delete'), async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if project has areas or devices
    const areaCount = await Area.countDocuments({ project_id: projectId });
    const deviceCount = await Device.countDocuments({ project_id: projectId });
    
    if (areaCount > 0 || deviceCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete project. It has ${areaCount} areas and ${deviceCount} devices. Please remove them first.`
      });
    }
    
    const project = await Project.findByIdAndDelete(projectId);
    
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
 * GET /api/v1/cms/areas
 * Get all areas (filtered by user permissions)
 */
router.get('/v1/cms/areas', authenticateJWT, async (req, res) => {
  try {
    let query = {};
    
    // Filter by project if provided
    if (req.query.project_id) {
      query.project_id = req.query.project_id;
    }
    
    // Non-admin users can only see assigned areas
    if (req.user.role !== 'admin') {
      query._id = { $in: req.user.assigned_areas };
    }
    
    const areas = await Area.find(query)
      .populate('project_id', 'name code')
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      count: areas.length,
      areas
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
 * POST /api/v1/cms/areas
 * Create area (admin only)
 */
router.post('/v1/cms/areas', authenticateJWT, requirePermission('areas.create'), async (req, res) => {
  try {
    const area = new Area(req.body);
    await area.save();
    
    // Notify assigned managers
    await Notification.notifyAreaManagers(
      area._id,
      'area_assigned',
      'info',
      'Khu vực mới được tạo',
      `Khu vực "${area.name}" đã được tạo trong dự án`,
      { area_id: area._id, project_id: area.project_id }
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Area created successfully',
      area
    });
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create area'
    });
  }
});

/**
 * PUT /api/v1/cms/areas/:areaId
 * Update area (admin only)
 */
router.put('/v1/cms/areas/:areaId', authenticateJWT, requirePermission('areas.update'), async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const area = await Area.findByIdAndUpdate(
      areaId,
      req.body,
      { new: true, runValidators: true }
    ).populate('project_id', 'name code');
    
    if (!area) {
      return res.status(404).json({
        status: 'error',
        message: 'Area not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Area updated successfully',
      area
    });
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update area'
    });
  }
});

/**
 * DELETE /api/v1/cms/areas/:areaId
 * Delete area (admin only)
 */
router.delete('/v1/cms/areas/:areaId', authenticateJWT, requirePermission('areas.delete'), async (req, res) => {
  try {
    const { areaId } = req.params;
    
    // Check if area has devices
    const deviceCount = await Device.countDocuments({ area_id: areaId });
    
    if (deviceCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete area. It has ${deviceCount} devices. Please remove them first.`
      });
    }
    
    const area = await Area.findByIdAndDelete(areaId);
    
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
 * GET /api/v1/cms/devices
 * Get all devices (filtered by user permissions)
 */
router.get('/v1/cms/devices', authenticateJWT, async (req, res) => {
  try {
    let query = {};
    
    // Filter by project or area if provided
    if (req.query.project_id) {
      query.project_id = req.query.project_id;
    }
    if (req.query.area_id) {
      query.area_id = req.query.area_id;
    }
    
    // Non-admin users can only see devices in assigned areas/projects
    if (req.user.role !== 'admin') {
      const Device = require('../models/Device');
      const accessibleDevices = await Device.find({
        $or: [
          { project_id: { $in: req.user.assigned_projects } },
          { area_id: { $in: req.user.assigned_areas } }
        ]
      }).select('_id');
      
      query._id = { $in: accessibleDevices.map(d => d._id) };
    }
    
    const devices = await Device.find(query)
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
 * POST /api/v1/cms/devices
 * Create device (admin only)
 */
router.post('/v1/cms/devices', authenticateJWT, requirePermission('devices.create'), async (req, res) => {
  try {
    // Check if device_id already exists
    if (req.body.device_id) {
      const existing = await Device.findOne({ device_id: req.body.device_id });
      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Device ID already exists'
        });
      }
    }
    
    const body = { ...req.body };
    if (body.site_id) {
      body.site_id_cms_locked = true;
    }
    const device = new Device(body);
    await device.save();
    
    // Notify managers if area is assigned
    if (device.area_id) {
      await Notification.notifyAreaManagers(
        device.area_id,
        'system',
        'info',
        'Thiết bị mới được thêm',
        `Thiết bị "${device.device_id}" đã được thêm vào khu vực`,
        { device_id: device.device_id, area_id: device.area_id }
      );
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Device created successfully',
      device
    });
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create device'
    });
  }
});

/**
 * PUT /api/v1/cms/devices/:deviceId
 * Update device (admin only)
 */
router.put('/v1/cms/devices/:deviceId', authenticateJWT, requirePermission('devices.update'), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const body = { ...req.body };
    if (body.site_id_follow_device === true) {
      body.site_id_cms_locked = false;
      delete body.site_id_follow_device;
    } else if (Object.prototype.hasOwnProperty.call(body, 'site_id')) {
      body.site_id_cms_locked = true;
    }

    const device = await Device.findOneAndUpdate(
      { device_id: deviceId },
      body,
      { new: true, runValidators: true }
    ).populate('project_id', 'name code').populate('area_id', 'name code');
    
    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Device updated successfully',
      device
    });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update device'
    });
  }
});

/**
 * DELETE /api/v1/cms/devices/:deviceId
 * Delete device (admin only)
 */
router.delete('/v1/cms/devices/:deviceId', authenticateJWT, requirePermission('devices.delete'), async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await Device.findOneAndDelete({ device_id: deviceId });
    
    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete device'
    });
  }
});

module.exports = router;

