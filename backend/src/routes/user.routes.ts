import { UserController } from "@/controller/user.controller";
import { wrappedHandlers } from "@/middleware/utils";
import { Router } from "express";

export const UserRoutes = Router();

UserRoutes.get("/:userId", (req, res) => {
  res.send("User get route is working");
});

UserRoutes.put("/:userId", wrappedHandlers([UserController.updateUser]));

UserRoutes.delete("/:userId", (req, res) => {
  res.send("User delete route is working");
});
