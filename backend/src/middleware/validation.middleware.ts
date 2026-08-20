import {
  type NextFunction,
  type Request,
  type Response
} from "express";
import { type ZodType } from "zod";

export const validateBody = (schema: ZodType) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues
      });

      return;
    }

    req.body = result.data;

    next();
  };
};
