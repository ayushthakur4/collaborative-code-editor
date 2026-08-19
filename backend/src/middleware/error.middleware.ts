import { type NextFunction, type Request, type Response } from "express";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};