import { Router } from "express";
import { AuthRoutes } from "./auth.routes";
import { UserRoutes } from "./user.routes";

const router = Router();

router.use("/users", UserRoutes);
router.use("/auth", AuthRoutes);

export default router;
