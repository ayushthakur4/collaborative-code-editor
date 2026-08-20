import { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors
    });
    return;
  }

  const errorMessage = err instanceof Error ? err.message : "Internal server error";
  console.error("Unhandled server error:", err);

  res.status(500).json({
    success: false,
    message: errorMessage
  });
};