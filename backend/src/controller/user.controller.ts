import { Request, Response } from "express";
import { UserModel } from "@/models/user.model.js";
import zod from "zod";

const GetSchema = zod.object({
  userId: zod.string(),
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

export const UserController = {
  getUser: async (req: Request, res: Response) => {
    const { userId } = req.params as { userId: string };
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
    const { userId } = req.params as { userId: string };

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
    const { userId } = req.params as { userId: string };
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
