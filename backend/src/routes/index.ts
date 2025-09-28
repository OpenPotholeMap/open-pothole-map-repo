import { Router } from "express";
import { AuthRoutes } from "./auth.routes";
import { UserRoutes } from "./user.routes";
import potholeRoutes from "./pothole.routes.js";
import debugRoutes from "./debug.routes.js";

const router = Router();

router.use("/users", UserRoutes);
router.use("/auth", AuthRoutes);
router.use("/potholes", potholeRoutes);
router.use("/debug", debugRoutes);

export default router;
