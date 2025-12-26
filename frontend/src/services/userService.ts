import { request } from "@/utils/api";
import { logger } from "@/utils/logger";
import zod from "zod";

const UserProfileSchema = zod.object({
  data: zod.object({
    id: zod.string(),
    email: zod.string(),
    username: zod.string(),
    role: zod.enum(["user", "admin"]),
    avatarUrl: zod.string().optional(),
  }),
});

const UserStatsSchema = zod.object({
  data: zod.object({
    potholesDetected: zod.number(),
    detectionSessions: zod.number(),
    totalDetections: zod.number(),
  }),
});

const SuccessMessageSchema = zod.object({
  message: zod.string(),
  data: zod.object({}),
});

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  avatarUrl?: string;
}

export interface UserStats {
  potholesDetected: number;
  detectionSessions: number;
  totalDetections: number;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    return await request({
      url: "/users/me",
      method: "GET",
      schema: UserProfileSchema,
      options: { includeOnlyDataField: true },
    });
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    logger.log("Updating profile:", payload);
    return await request({
      url: "/users/me",
      method: "PUT",
      data: payload,
      schema: UserProfileSchema,
      options: { includeOnlyDataField: true },
    });
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await request({
      url: "/users/me/password",
      method: "PUT",
      data: payload,
      schema: SuccessMessageSchema,
    });
  },

  async getStats(): Promise<UserStats> {
    return await request({
      url: "/users/me/stats",
      method: "GET",
      schema: UserStatsSchema,
      options: { includeOnlyDataField: true },
    });
  },
};
