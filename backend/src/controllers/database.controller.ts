import { type Request, type Response } from "express";
import { prisma } from "../config/prisma.js";

export const databaseController = async (
  _req: Request,
  res: Response
) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Database connection is working"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
};