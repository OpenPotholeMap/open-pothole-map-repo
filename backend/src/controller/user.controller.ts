import { Request, Response } from "express";
import { UserModel } from "@/models/user.model.js";
import { PotholeModel } from "@/models/pothole.model.js";
import { DetectionSessionModel } from "@/models/detectionSession.model.js";
import zod from "zod";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const GetSchema = zod.object({
  userId: zod.string(),
});

const ParamsSchema = zod.object({
  userId: zod.string().min(1),
});

const UpdateSchema = zod
  .object({
    username: zod.string().min(2).max(100).optional(),
    avatarUrl: zod.string().url().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["username", "avatarUrl"],
  });

const UpdateMeSchema = zod
  .object({
    username: zod.string().min(2).max(100).optional(),
    email: zod.string().email().optional(),
    avatarUrl: zod.string().url().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["username", "email", "avatarUrl"],
  });

const ChangePasswordSchema = zod.object({
  currentPassword: zod.string().min(6),
  newPassword: zod.string().min(6),
});

export const UserController = {
  getMe: async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = await UserModel.findOne({
      _id: userId,
      isActive: true,
    }).lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      data: {
        id: (user._id as any).toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
      },
    });
  },

  updateMe: async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const payload = UpdateMeSchema.parse(req.body);

    if (payload.email) {
      const existingUser = await UserModel.findOne({
        email: payload.email,
        _id: { $ne: userId },
        isActive: true,
      });

      if (existingUser) {
        res.status(400).json({ message: "Email already in use" });
        return;
      }
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: userId, isActive: true },
      { ...payload, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      data: {
        id: (updated._id as any).toString(),
        email: updated.email,
        username: updated.username,
        role: updated.role,
        avatarUrl: updated.avatarUrl || "",
      },
    });
  },

  changePassword: async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { currentPassword, newPassword } = ChangePasswordSchema.parse(
      req.body
    );

    const user = await UserModel.findOne({
      _id: userId,
      isActive: true,
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.encryptedPassword) {
      res
        .status(400)
        .json({ message: "Cannot change password for OAuth accounts" });
      return;
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.encryptedPassword
    );
    if (!isMatch) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserModel.findByIdAndUpdate(userId, {
      encryptedPassword: hashedPassword,
      updatedAt: new Date(),
    });

    res.status(200).json({ message: "Password changed successfully" });
  },

  getMyStats: async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const potholesDetected = await PotholeModel.countDocuments({
      userId: userObjectId,
    });

    // Count detection sessions
    const detectionSessions = await DetectionSessionModel.countDocuments({
      userId: userObjectId,
    });

    const sessionsData = await DetectionSessionModel.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$totalDetections" } } },
    ]);

    const totalDetections = sessionsData.length > 0 ? sessionsData[0].total : 0;

    res.status(200).json({
      message: "Statistics retrieved successfully",
      data: {
        potholesDetected,
        detectionSessions,
        totalDetections,
      },
    });
  },

  getUser: async (req: Request, res: Response) => {
    const { userId } = ParamsSchema.parse(req.params);
    const user = await UserModel.findOne({
      _id: userId,
      isActive: true,
    }).lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({
      message: "User retrieved successfully",
      data: {
        id: (user._id as any).toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
      },
    });
  },
  updateUser: async (req: Request, res: Response) => {
    const { userId } = ParamsSchema.parse(req.params);

    const payload = UpdateSchema.parse(req.body);

    const updated = await UserModel.findOneAndUpdate(
      { _id: userId, isActive: true },
      { ...payload, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User updated successfully",
      data: {
        id: (updated._id as any).toString(),
        email: updated.email,
        username: updated.username,
        role: updated.role,
        avatarUrl: updated.avatarUrl || "",
      },
    });
  },
  deleteUser: async (req: Request, res: Response) => {
    const { userId } = ParamsSchema.parse(req.params);
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ message: "User deleted successfully" });
  },
};
