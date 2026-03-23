const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { randomUUID } = crypto;
const multer = require('multer');
const Release = require('../models/Release');
const Device = require('../models/Device');
const mqttOtaService = require('../services/mqttOtaService');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Releases directory (same as backend root/releases, or env)
const RELEASES_DIR = path.resolve(process.env.RELEASES_DIR || path.join(__dirname, '..', 'releases'));
const BASE_URL = process.env.OTA_BASE_URL || process.env.BASE_URL || '';

// Ensure releases dir exists
async function ensureReleasesDir() {
  try {
    await fs.mkdir(RELEASES_DIR, { recursive: true });
  } catch (e) {
    console.error('Cannot create releases dir:', e.message);
  }
}
ensureReleasesDir();

// Multer: upload to temp dir first; move to versioned dir in route (req.body not yet available in destination)
const uploadDir = path.join(RELEASES_DIR, '_upload');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(uploadDir, { recursive: true }).then(() => cb(null, uploadDir)).catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `firmware-${Date.now()}${ext}`);
  }
});
const allowedExtensions = ['.bin', '.bin.gz', '.swu'];
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`Chỉ chấp nhận file: ${allowedExtensions.join(', ')}. Bạn gửi: ${ext || '(không có đuôi)'}`));
    }
  }
});

// Build download URL for a release (for devices)
function getReleaseUrl(version, filename = 'firmware.bin') {
  const base = BASE_URL.replace(/\/$/, '') || `http://localhost:${process.env.PORT || 5023}`;
  return `${base}/api/v1/ota/releases/${encodeURIComponent(version)}/file`;
}

// ---------- Public (device) endpoints - no auth required ----------

/**
 * GET /api/v1/ota/latest
 * Returns latest release metadata for devices (poll fallback)
 */
router.get('/v1/ota/latest', async (req, res) => {
  try {
    let release = await Release.findOne({ is_latest: true }).sort({ created_at: -1 });
    if (!release) {
      release = await Release.findOne().sort({ created_at: -1 });
    }
    if (!release) {
      return res.json({
        status: 'success',
        release: null,
        message: 'No releases available'
      });
    }
    const url = getReleaseUrl(release.version, release.filename);
    res.json({
      status: 'success',
      release: {
        version: release.version,
        url,
        checksum_sha256: release.checksum_sha256,
        size: release.size,
        release_notes: release.release_notes || '',
        published_at: release.published_at ? release.published_at.toISOString() : null
      }
    });
  } catch (error) {
    console.error('OTA latest error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get latest release' });
  }
});

/**
 * GET /api/v1/ota/releases/:version
 * Metadata for a specific version
 */
router.get('/v1/ota/releases/:version', async (req, res) => {
  try {
    const release = await Release.findOne({ version: req.params.version });
    if (!release) {
      return res.status(404).json({ status: 'error', message: 'Release not found' });
    }
    const url = getReleaseUrl(release.version, release.filename);
    res.json({
      status: 'success',
      release: {
        version: release.version,
        url,
        checksum_sha256: release.checksum_sha256,
        size: release.size,
        release_notes: release.release_notes || '',
        published_at: release.published_at ? release.published_at.toISOString() : null
      }
    });
  } catch (error) {
    console.error('OTA release by version error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get release' });
  }
});

/**
 * GET /api/v1/ota/releases/:version/file
 * Download firmware file (for devices)
 */
router.get('/v1/ota/releases/:version/file', async (req, res) => {
  try {
    const release = await Release.findOne({ version: req.params.version });
    if (!release) {
      return res.status(404).json({ status: 'error', message: 'Release not found' });
    }
    const filePath = path.join(RELEASES_DIR, release.version, release.filename);
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ status: 'error', message: 'File not found on server' });
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${release.filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('OTA file download error:', error);
    res.status(500).json({ status: 'error', message: 'Download failed' });
  }
});

// ---------- Admin endpoints (JWT + admin role) ----------

/**
 * GET /api/v1/ota/stats - số thiết bị đang subscribe topic ota/release (broker Aedes mới có)
 */
router.get('/v1/ota/stats', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const statsUrl = process.env.MQTT_STATS_URL || 'http://localhost:1884';
    const response = await fetch(statsUrl);
    if (response.ok) {
      const data = await response.json();
      return res.json({ status: 'success', topic: data.topic || mqttOtaService.MQTT_TOPIC, subscribers: data.subscribers });
    }
  } catch (e) {
    // Broker không chạy hoặc không phải Aedes (Mosquitto/EMQX)
  }
  res.json({ status: 'success', topic: mqttOtaService.MQTT_TOPIC, subscribers: null });
});

/**
 * GET /api/v1/ota/subscribed-devices - danh sách device_id đang subscribe topic ota/cm4/<device_id>/command
 * Chỉ có khi broker là Aedes (mqtt-broker-local.js); broker khác trả về device_ids: [] hoặc null.
 */
router.get('/v1/ota/subscribed-devices', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const baseUrl = (process.env.MQTT_STATS_URL || 'http://localhost:1884').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/subscribed-devices`);
    if (response.ok) {
      const data = await response.json();
      return res.json({
        status: 'success',
        topic_pattern: data.topic_pattern || `${mqttOtaService.MQTT_OTA_TOPIC_PREFIX}/<device_id>/command`,
        device_ids: data.device_ids || [],
        count: (data.device_ids && data.device_ids.length) || 0
      });
    }
  } catch (e) {
    // Broker không chạy hoặc không hỗ trợ endpoint này
  }
  res.json({
    status: 'success',
    topic_pattern: `${mqttOtaService.MQTT_OTA_TOPIC_PREFIX}/<device_id>/command`,
    device_ids: [],
    count: 0
  });
});

/**
 * GET /api/v1/ota/releases (list all - admin)
 */
router.get('/v1/ota/releases', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const releases = await Release.find().sort({ created_at: -1 });
    const withUrl = releases.map((r) => ({
      ...r.toObject(),
      url: getReleaseUrl(r.version, r.filename)
    }));
    res.json({ status: 'success', count: withUrl.length, releases: withUrl });
  } catch (error) {
    console.error('OTA list error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to list releases' });
  }
});

/**
 * POST /api/v1/ota/releases (upload new release - admin)
 * Body: version, release_notes (multipart: file)
 * Accepted: .bin, .bin.gz, .swu
 */
router.post('/v1/ota/releases', authenticateJWT, requireRole('admin'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err.message || (err.code === 'LIMIT_FILE_SIZE' ? 'File quá lớn (tối đa 200MB)' : 'Upload thất bại');
      return res.status(400).json({ status: 'error', message: msg });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    const version = (req.body.version || '').trim().replace(/^v/, '') || '0.0.0';
    const versionTag = version.startsWith('v') ? version : `v${version}`;
    const release_notes = (req.body.release_notes || '').trim();
    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase() || '.bin';
    const filename = allowedExtensions.includes(ext) ? `firmware${ext}` : `firmware${ext}`;
    const versionDir = path.join(RELEASES_DIR, versionTag);
    const finalPath = path.join(versionDir, filename);

    const existing = await Release.findOne({ version: versionTag });
    if (existing) {
      await fs.unlink(tempPath).catch(() => {});
      return res.status(400).json({ status: 'error', message: 'Release version already exists' });
    }

    await fs.mkdir(versionDir, { recursive: true });
    await fs.rename(tempPath, finalPath);

    const buffer = await fs.readFile(finalPath);
    const checksum_sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const size = buffer.length;

    const release = new Release({
      version: versionTag,
      filename,
      filepath: path.relative(RELEASES_DIR, finalPath),
      checksum_sha256,
      size,
      release_notes,
      is_latest: true,
      created_by: req.user._id
    });
    await release.save();

    res.status(201).json({
      status: 'success',
      message: 'Release uploaded',
      release: {
        _id: release._id,
        version: release.version,
        url: getReleaseUrl(release.version, release.filename),
        checksum_sha256: release.checksum_sha256,
        size: release.size,
        release_notes: release.release_notes,
        is_latest: release.is_latest,
        created_at: release.created_at
      }
    });
  } catch (error) {
    console.error('OTA upload error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Upload failed' });
  }
});

/**
 * POST /api/v1/ota/releases/:version/publish
 * Publish release to MQTT - admin
 * Body (optional):
 *   - device_ids: ["SL-2025-0001", ...] — gửi đến các device chỉ định
 *   - all_devices: true — lấy danh sách device_id từ DB (collection devices) rồi gửi đến tất cả
 * - Nếu có device_ids hoặc all_devices → publish theo spec đến ota/cm4/<device_id>/command.
 * - Nếu không có cả hai: legacy broadcast lên ota/release (payload cũ).
 */
router.post('/v1/ota/releases/:version/publish', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const release = await Release.findOne({ version: req.params.version });
    if (!release) {
      return res.status(404).json({ status: 'error', message: 'Release not found' });
    }
    const url = getReleaseUrl(release.version, release.filename);
    let deviceIds = req.body && Array.isArray(req.body.device_ids) ? req.body.device_ids.filter(Boolean) : [];

    // Lấy danh sách từ DB nếu client gửi all_devices: true
    if (deviceIds.length === 0 && req.body && req.body.all_devices === true) {
      const ids = await Device.find().distinct('device_id');
      deviceIds = ids.filter(Boolean);
    }

    if (deviceIds.length > 0) {
      // Spec mqtt_topics.pdf + IoT G7: thêm command_id, size_bytes, rollback_on_failure (firmware có thể bỏ qua field lạ)
      const body = req.body || {};
      const commandId = typeof body.command_id === 'string' && body.command_id.trim()
        ? body.command_id.trim()
        : randomUUID();
      const releasePayload = {
        url,
        version: release.version,
        checksum_sha256: release.checksum_sha256,
        command_id: commandId,
        size_bytes: release.size,
        reboot_after: body.reboot_after !== undefined ? !!body.reboot_after : true,
        rollback_on_failure: body.rollback_on_failure !== undefined ? !!body.rollback_on_failure : true
      };
      const result = await mqttOtaService.publishUpdateToDevices(deviceIds, releasePayload);
      release.mqtt_pushed_at = new Date();
      release.published_at = release.published_at || new Date();
      await release.save();
      return res.json({
        status: 'success',
        message: result.failed === 0
          ? `Published update command to ${result.published} device(s).`
          : `Published to ${result.published} device(s), ${result.failed} failed.`,
        mqtt_topic: `${mqttOtaService.MQTT_OTA_TOPIC_PREFIX}/<device_id>/command`,
        published: result.published,
        failed: result.failed,
        device_ids: deviceIds,
        command_id: commandId,
        payload_summary: {
          action: 'update',
          command_id: commandId,
          version: release.version,
          url,
          size_bytes: release.size,
          reboot_after: releasePayload.reboot_after,
          rollback_on_failure: releasePayload.rollback_on_failure,
          checksum: release.checksum_sha256 ? (release.checksum_sha256.startsWith('sha256:') ? release.checksum_sha256 : 'sha256:' + release.checksum_sha256) : null
        }
      });
    }

    // Legacy: broadcast to ota/release
    const payload = {
      version: release.version,
      url,
      checksum_sha256: release.checksum_sha256,
      size: release.size,
      release_notes: release.release_notes || '',
      published_at: new Date().toISOString()
    };
    const result = await mqttOtaService.publishRelease(payload);
    if (result.success) {
      release.mqtt_pushed_at = new Date();
      release.published_at = release.published_at || new Date();
      await release.save();
      return res.json({
        status: 'success',
        message: 'Published to MQTT. Devices subscribed to ota/release will receive the update.',
        mqtt_topic: mqttOtaService.MQTT_TOPIC,
        device_ids: null,
        payload_summary: {
          topic: mqttOtaService.MQTT_TOPIC,
          version: release.version,
          url,
          checksum_sha256: release.checksum_sha256,
          size: release.size
        }
      });
    }
    res.status(502).json({
      status: 'error',
      message: result.message || 'MQTT publish failed'
    });
  } catch (error) {
    console.error('OTA publish error:', error);
    res.status(500).json({ status: 'error', message: 'Publish failed' });
  }
});

/**
 * PATCH /api/v1/ota/releases/:version/set-latest - set as latest
 */
router.patch('/v1/ota/releases/:version/set-latest', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const release = await Release.findOne({ version: req.params.version });
    if (!release) {
      return res.status(404).json({ status: 'error', message: 'Release not found' });
    }
    release.is_latest = true;
    await release.save();
    res.json({ status: 'success', message: 'Set as latest', release: release.toObject() });
  } catch (error) {
    console.error('OTA set-latest error:', error);
    res.status(500).json({ status: 'error', message: 'Failed' });
  }
});

/**
 * DELETE /api/v1/ota/releases/:version - admin only (optional: keep file on disk)
 */
router.delete('/v1/ota/releases/:version', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const release = await Release.findOne({ version: req.params.version });
    if (!release) {
      return res.status(404).json({ status: 'error', message: 'Release not found' });
    }
    await Release.deleteOne({ _id: release._id });
    const filePath = path.join(RELEASES_DIR, release.version, release.filename);
    await fs.unlink(filePath).catch(() => {});
    res.json({ status: 'success', message: 'Release deleted' });
  } catch (error) {
    console.error('OTA delete error:', error);
    res.status(500).json({ status: 'error', message: 'Delete failed' });
  }
});

module.exports = router;
