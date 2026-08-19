import { Router } from "express";
import { healthController } from "../controllers/health.controllers.js";

const router = Router();

router.get("/health", healthController);

export default router;