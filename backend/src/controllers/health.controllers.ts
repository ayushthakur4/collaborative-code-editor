import { type Request, type Response } from "express";
import { getHealthStatus } from "../services/health.service.js";

export const healthController = (
  _req: Request,
  res: Response
) => {
  const healthStatus = getHealthStatus();

  res.json(healthStatus);
};