import { UserController } from "@/controller/user.controller";
import { wrappedHandlers } from "@/middleware/utils";
import { authenticate } from "@/middleware/auth.middleware";
import { Router } from "express";

export const UserRoutes = Router();

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
