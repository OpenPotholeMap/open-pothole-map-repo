import { Request, Response } from "express";
import { detectionService } from "@/services/detectionService.js";
import { PotholeModel, ConfirmationModel, UserModel } from "@/models/index.js";

export const PotholeController = {
  // Create a new pothole (manual creation)
  create: async (req: Request, res: Response) => {
    try {
      const {
        latitude,
        longitude,
        confidenceScore = 0.5,
        images = [],
        verified = false,
        detectionCount = 1,
      } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json({
          message: "Latitude and longitude are required",
        });
        return;
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90) {
        res.status(400).json({
          message: "Invalid latitude. Must be between -90 and 90",
        });
        return;
      }

      if (longitude < -180 || longitude > 180) {
        res.status(400).json({
          message: "Invalid longitude. Must be between -180 and 180",
        });
        return;
      }

      const newPothole = new PotholeModel({
        latitude,
        longitude,
        confidenceScore,
        images,
        verified,
        detectionCount,
        detectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedPothole = await newPothole.save();

      res.status(201).json({
        message: "Pothole created successfully",
        data: savedPothole,
      });
    } catch (error) {
      console.error("Create pothole error:", error);
      res.status(500).json({
        message: "Failed to create pothole",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Get all potholes (for map display)
  list: async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const potholes = await detectionService.getRecentPotholes(limit);

      res.json({
        message: "Potholes retrieved successfully",
        data: potholes,
      });
    } catch (error) {
      console.error("Get potholes error:", error);
      res.status(500).json({
        message: "Failed to retrieve potholes",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Get potholes within a geographic bound (for map viewport)
  listInBounds: async (req: Request, res: Response) => {
    try {
      const { north, south, east, west } = req.query as Record<string, string>;

      if (!north || !south || !east || !west) {
        res.status(400).json({
          message: "Missing required parameters: north, south, east, west",
        });
        return;
      }

      const potholes = await PotholeModel.find({
        latitude: {
          $gte: parseFloat(south),
          $lte: parseFloat(north),
        },
        longitude: {
          $gte: parseFloat(west),
          $lte: parseFloat(east),
        },
      })
        .select(
          "latitude longitude confidenceScore detectedAt verified detectionCount images"
        )
        .sort({ detectedAt: -1 })
        .limit(200)
        .lean();

      res.json({
        message: "Potholes in bounds retrieved successfully",
        data: potholes,
      });
    } catch (error) {
      console.error("Get potholes by bounds error:", error);
      res.status(500).json({
        message: "Failed to retrieve potholes",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Get pothole by ID
  getById: async (req: Request, res: Response) => {
    try {
      const pothole = await PotholeModel.findById(req.params.id)
        .populate("userId", "username")
        .lean();

      if (!pothole) {
        res.status(404).json({
          message: "Pothole not found",
        });
        return;
      }

      res.json({
        message: "Pothole retrieved successfully",
        data: pothole,
      });
    } catch (error) {
      console.error("Get pothole by ID error:", error);
      res.status(500).json({
        message: "Failed to retrieve pothole",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Update pothole verification status
  verify: async (req: Request, res: Response) => {
    try {
      const { verified } = req.body as { verified?: boolean };

      if (typeof verified !== "boolean") {
        res.status(400).json({
          message: "Verified field must be a boolean",
        });
        return;
      }

      const pothole = await PotholeModel.findByIdAndUpdate(
        req.params.id,
        { verified, updatedAt: new Date() },
        { new: true }
      );

      if (!pothole) {
        res.status(404).json({
          message: "Pothole not found",
        });
        return;
      }

      res.json({
        message: "Pothole verification status updated",
        data: pothole,
      });
    } catch (error) {
      console.error("Update pothole verification error:", error);
      res.status(500).json({
        message: "Failed to update pothole",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Delete pothole (admin only - for now just allow it)
  delete: async (req: Request, res: Response) => {
    try {
      const pothole = await PotholeModel.findByIdAndDelete(req.params.id);

      if (!pothole) {
        res.status(404).json({
          message: "Pothole not found",
        });
        return;
      }

      res.json({
        message: "Pothole deleted successfully",
      });
    } catch (error) {
      console.error("Delete pothole error:", error);
      res.status(500).json({
        message: "Failed to delete pothole",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Confirm pothole status (logged in users only)
  confirm: async (req: Request, res: Response) => {
    try {
      const { status, userId } = req.body as {
        status?: "still_there" | "not_there";
        userId?: string;
      };

      if (!userId) {
        res.status(401).json({
          message: "User must be logged in to confirm pothole status",
        });
        return;
      }

      if (!status || !["still_there", "not_there"].includes(status)) {
        res.status(400).json({
          message: 'Status must be either "still_there" or "not_there"',
        });
        return;
      }

      // Check if pothole exists
      const pothole = await PotholeModel.findById(req.params.id);
      if (!pothole) {
        res.status(404).json({
          message: "Pothole not found",
        });
        return;
      }

      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      // Check if user already confirmed this pothole
      const existingConfirmation = await ConfirmationModel.findOne({
        potholeId: req.params.id,
        userId: userId,
      });

      if (existingConfirmation) {
        res.status(409).json({
          message: "User has already confirmed this pothole",
        });
        return;
      }

      // Create new confirmation
      const confirmation = new ConfirmationModel({
        potholeId: req.params.id,
        userId: userId,
        status: status,
      });

      const savedConfirmation = await confirmation.save();

      res.status(201).json({
        message: "Pothole confirmation recorded successfully",
        data: savedConfirmation,
      });
    } catch (error) {
      console.error("Confirm pothole error:", error);
      res.status(500).json({
        message: "Failed to confirm pothole",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Get confirmations for a pothole
  getConfirmations: async (req: Request, res: Response) => {
    try {
      const confirmations = await ConfirmationModel.find({
        potholeId: req.params.id,
      })
        .populate("userId", "username")
        .sort({ confirmedAt: -1 });

      const summary = {
        still_there: confirmations.filter((c) => c.status === "still_there")
          .length,
        not_there: confirmations.filter((c) => c.status === "not_there").length,
        total: confirmations.length,
      };

      res.json({
        message: "Confirmations retrieved successfully",
        data: {
          confirmations,
          summary,
        },
      });
    } catch (error) {
      console.error("Get confirmations error:", error);
      res.status(500).json({
        message: "Failed to retrieve confirmations",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // Admin only: Verify pothole
  adminVerify: async (req: Request, res: Response) => {
    try {
      const { verified, userId } = req.body as {
        verified?: boolean;
        userId?: string;
      };

      if (!userId) {
        res.status(401).json({
          message: "User must be logged in",
        });
        return;
      }

      // Check if user is admin
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      if (user.role !== "admin") {
        res.status(403).json({
          message: "Only admins can verify potholes",
        });
        return;
      }

      if (typeof verified !== "boolean") {
        res.status(400).json({
          message: "Verified field must be a boolean",
        });
        return;
      }

      const pothole = await PotholeModel.findByIdAndUpdate(
        req.params.id,
        { verified, updatedAt: new Date() },
        { new: true }
      );

      if (!pothole) {
        res.status(404).json({
          message: "Pothole not found",
        });
        return;
      }

      res.json({
        message: "Pothole verification status updated by admin",
        data: pothole,
      });
    } catch (error) {
      console.error("Admin verify pothole error:", error);
      res.status(500).json({
        message: "Failed to update pothole verification",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
