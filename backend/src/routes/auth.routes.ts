import { Router } from "express";
import {
  meController,
  sessionController,
  signInController,
  signOutController,
  signUpController,
  tokenController
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Public auth routes
router.post("/api/v1/auth/sign-up", signUpController);
router.post("/api/v1/auth/sign-in", signInController);
router.post("/api/v1/auth/sign-out", signOutController);

// Session & token validation routes
router.get("/api/v1/auth/session", sessionController);
router.get("/api/v1/auth/token", tokenController);

// Protected routes requiring authentication
router.get("/api/v1/auth/me", requireAuth, meController);

export default router;