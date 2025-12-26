import { UserController } from "@/controller/user.controller";
import { wrappedHandlers } from "@/middleware/utils";
import { authenticate } from "@/middleware/auth.middleware";
import { Router } from "express";

export const UserRoutes = Router();

// Current user profile endpoints (must be before /:userId)
UserRoutes.get("/me", authenticate, wrappedHandlers([UserController.getMe]));

UserRoutes.put("/me", authenticate, wrappedHandlers([UserController.updateMe]));

UserRoutes.put(
  "/me/password",
  authenticate,
  wrappedHandlers([UserController.changePassword])
);

UserRoutes.get(
  "/me/stats",
  authenticate,
  wrappedHandlers([UserController.getMyStats])
);

// Generic user endpoints
UserRoutes.get("/:userId", wrappedHandlers([UserController.getUser]));

UserRoutes.put(
  "/:userId",
  authenticate,
  wrappedHandlers([UserController.updateUser])
);

UserRoutes.delete(
  "/:userId",
  authenticate,
  wrappedHandlers([UserController.deleteUser])
);
