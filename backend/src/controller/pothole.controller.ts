import { Request, Response } from "express";
import { detectionService } from "@/services/detectionService.js";
import { PotholeModel, ConfirmationModel, UserModel } from "@/models/index.js";
import { z } from "zod";

const CreatePotholeSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  confidenceScore: z.number().min(0).max(1).optional().default(0.5),
  images: z.array(z.string()).optional().default([]),
  verified: z.boolean().optional().default(false),
  detectionCount: z.number().int().positive().optional().default(1),
});

const ListPotholesSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 100)),
});

const ListInBoundsSchema = z.object({
  north: z.string().transform((val) => parseFloat(val)),
  south: z.string().transform((val) => parseFloat(val)),
  east: z.string().transform((val) => parseFloat(val)),
  west: z.string().transform((val) => parseFloat(val)),
});

const VerifyPotholeSchema = z.object({
  verified: z.boolean(),
});

const ConfirmPotholeSchema = z.object({
  status: z.enum(["still_there", "not_there"]),
  userId: z.string(),
});

const AdminVerifySchema = z.object({
  verified: z.boolean(),
  userId: z.string(),
});

export const PotholeController = {
  create: async (req: Request, res: Response) => {
    try {
      const {
        latitude,
        longitude,
        confidenceScore,
        images,
        verified,
        detectionCount,
      } = CreatePotholeSchema.parse(req.body);

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

  list: async (req: Request, res: Response) => {
    try {
      const { limit } = ListPotholesSchema.parse(req.query);
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
      const { north, south, east, west } = ListInBoundsSchema.parse(req.query);

      const potholes = await PotholeModel.find({
        latitude: {
          $gte: south,
          $lte: north,
        },
        longitude: {
          $gte: west,
          $lte: east,
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
      const { verified } = VerifyPotholeSchema.parse(req.body);

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
      const { status, userId } = ConfirmPotholeSchema.parse(req.body);

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
      const { verified, userId } = AdminVerifySchema.parse(req.body);

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
