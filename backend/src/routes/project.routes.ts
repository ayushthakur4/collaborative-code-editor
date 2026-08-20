import { Router } from "express";
import { createProjectController } from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { createProjectSchema } from "../schemas/project.schema.js";

const router = Router();

router.post(
  "/api/v1/projects",
  requireAuth,
  validateBody(createProjectSchema),
  createProjectController
);

export default router;