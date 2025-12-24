import express from "express";
import { wrappedHandlers } from "@/middleware/utils";
import { PotholeController } from "@/controller/pothole.controller";
import { authenticate } from "@/middleware/auth.middleware";

const router = express.Router();

router.post("/", wrappedHandlers([PotholeController.create]));
router.get("/", wrappedHandlers([PotholeController.list]));
router.get("/bounds", wrappedHandlers([PotholeController.listInBounds]));
router.get("/:id", wrappedHandlers([PotholeController.getById]));
router.patch("/:id/verify", wrappedHandlers([PotholeController.verify]));
router.delete(
  "/:id",
  authenticate,
  wrappedHandlers([PotholeController.delete])
);
router.post(
  "/:id/confirm",
  authenticate,
  wrappedHandlers([PotholeController.confirm])
);
router.get(
  "/:id/confirmations",
  wrappedHandlers([PotholeController.getConfirmations])
);
router.patch(
  "/:id/admin-verify",
  authenticate,
  wrappedHandlers([PotholeController.adminVerify])
);

export default router;
