import { AuthController } from "@/controller/auth.controller";
import { wrappedHandlers } from "@/middleware/utils";
import { Router } from "express";

export const AuthRoutes = Router();

AuthRoutes.post("/signup", wrappedHandlers([AuthController.signup]));

AuthRoutes.post("/login", wrappedHandlers([AuthController.login]));

AuthRoutes.post("/google", wrappedHandlers([AuthController.googleLogin]));

AuthRoutes.post("/logout", wrappedHandlers([AuthController.logout]));

AuthRoutes.get("/me", wrappedHandlers([AuthController.me]));
