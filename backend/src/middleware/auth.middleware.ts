import { type NextFunction, type Request, type Response } from "express";
import { authenticateRequest } from "../services/auth.service.js";

/**
 * Middleware that requires a valid Neon Auth session or JWT token.
 * Attaches the authenticated user, token, and session to the Express request.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorization = req.headers.authorization;
  const cookie = req.headers.cookie;
  const origin = req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : undefined);

  if (!authorization && !cookie) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please provide a Bearer token or session cookie."
    });
    return;
  }

  try {
    const authResult = await authenticateRequest(authorization, cookie, origin);
    req.user = authResult.user;
    if (authResult.token !== undefined) {
      req.token = authResult.token;
    }
    if (authResult.session !== undefined) {
      req.session = authResult.session;
    }
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid or expired authentication credentials";
    res.status(401).json({
      success: false,
      message
    });
  }
};

/**
 * Optional authentication middleware.
 * If authentication credentials are provided, attempts to authenticate the user.
 * Does not block the request if credentials are absent or invalid.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authorization = req.headers.authorization;
  const cookie = req.headers.cookie;
  const origin = req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : undefined);

  if (!authorization && !cookie) {
    next();
    return;
  }

  try {
    const authResult = await authenticateRequest(authorization, cookie, origin);
    req.user = authResult.user;
    if (authResult.token !== undefined) {
      req.token = authResult.token;
    }
    if (authResult.session !== undefined) {
      req.session = authResult.session;
    }
  } catch {
  }

  next();
};