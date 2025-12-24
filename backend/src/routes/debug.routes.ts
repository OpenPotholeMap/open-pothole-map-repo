import { Router } from "express";
import { wrappedHandlers } from "@/middleware/utils";
import { authenticate } from "@/middleware/auth.middleware";
import { DebugController } from "@/controller/debug.controller";

const router = Router();

router.post(
  "/test-roboflow",
  authenticate,
  wrappedHandlers([DebugController.testRoboflow])
);
router.post(
  "/test-gcs",
  authenticate,
  wrappedHandlers([DebugController.testGcs])
);
router.post(
  "/test-detection-flow",
  authenticate,
  wrappedHandlers([DebugController.testDetectionFlow])
);

export default router;
