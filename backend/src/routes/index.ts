import { Router } from "express";
import { AuthRoutes } from "./auth.routes";
import { UserRoutes } from "./user.routes";
import potholeRoutes from "./pothole.routes.js";

const router = Router();

router.use("/users", UserRoutes);
router.use("/auth", AuthRoutes);
router.use("/potholes", potholeRoutes);

export default router;
