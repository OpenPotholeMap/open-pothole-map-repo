import express from 'express';
import { detectionService } from '@/services/detectionService.js';
import { PotholeModel } from '@/models/index.js';

const router = express.Router();

// Create a new pothole (manual creation)
router.post('/', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      confidenceScore = 0.5,
      imageUrl = `placeholder_manual_${Date.now()}.jpg`,
      verified = false,
      detectionCount = 1
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: 'Invalid latitude. Must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        message: 'Invalid longitude. Must be between -180 and 180'
      });
    }

    const newPothole = new PotholeModel({
      latitude,
      longitude,
      confidenceScore,
      imageUrl,
      verified,
      detectionCount,
      detectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedPothole = await newPothole.save();

    res.status(201).json({
      message: 'Pothole created successfully',
      data: savedPothole
    });
  } catch (error) {
    console.error('Create pothole error:', error);
    res.status(500).json({
      message: 'Failed to create pothole',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all potholes (for map display)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const potholes = await detectionService.getRecentPotholes(limit);

    res.json({
      message: 'Potholes retrieved successfully',
      data: potholes
    });
  } catch (error) {
    console.error('Get potholes error:', error);
    res.status(500).json({
      message: 'Failed to retrieve potholes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get potholes within a geographic bound (for map viewport)
router.get('/bounds', async (req, res) => {
  try {
    const { north, south, east, west } = req.query;

    if (!north || !south || !east || !west) {
      return res.status(400).json({
        message: 'Missing required parameters: north, south, east, west'
      });
    }

    const potholes = await PotholeModel.find({
      latitude: {
        $gte: parseFloat(south as string),
        $lte: parseFloat(north as string)
      },
      longitude: {
        $gte: parseFloat(west as string),
        $lte: parseFloat(east as string)
      }
    })
    .select('latitude longitude confidenceScore detectedAt verified detectionCount imageUrl')
    .sort({ detectedAt: -1 })
    .limit(200)
    .lean();

    res.json({
      message: 'Potholes in bounds retrieved successfully',
      data: potholes
    });
  } catch (error) {
    console.error('Get potholes by bounds error:', error);
    res.status(500).json({
      message: 'Failed to retrieve potholes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get pothole by ID
router.get('/:id', async (req, res) => {
  try {
    const pothole = await PotholeModel.findById(req.params.id)
      .populate('userId', 'username')
      .lean();

    if (!pothole) {
      return res.status(404).json({
        message: 'Pothole not found'
      });
    }

    res.json({
      message: 'Pothole retrieved successfully',
      data: pothole
    });
  } catch (error) {
    console.error('Get pothole by ID error:', error);
    res.status(500).json({
      message: 'Failed to retrieve pothole',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update pothole verification status
router.patch('/:id/verify', async (req, res) => {
  try {
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({
        message: 'Verified field must be a boolean'
      });
    }

    const pothole = await PotholeModel.findByIdAndUpdate(
      req.params.id,
      { verified, updatedAt: new Date() },
      { new: true }
    );

    if (!pothole) {
      return res.status(404).json({
        message: 'Pothole not found'
      });
    }

    res.json({
      message: 'Pothole verification status updated',
      data: pothole
    });
  } catch (error) {
    console.error('Update pothole verification error:', error);
    res.status(500).json({
      message: 'Failed to update pothole',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete pothole (admin only - for now just allow it)
router.delete('/:id', async (req, res) => {
  try {
    const pothole = await PotholeModel.findByIdAndDelete(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        message: 'Pothole not found'
      });
    }

    res.json({
      message: 'Pothole deleted successfully'
    });
  } catch (error) {
    console.error('Delete pothole error:', error);
    res.status(500).json({
      message: 'Failed to delete pothole',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;