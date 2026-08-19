import { Router } from "express";
import { databaseController } from "../controllers/database.controller.js";

const router = Router();

router.get("/database/health", databaseController);

export default router;