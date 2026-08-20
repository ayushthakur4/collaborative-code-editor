import { type Request, type Response } from "express";
import { z } from "zod";
import {
  authenticateRequest,
  getJwtTokenFromSession,
  signInUser,
  signOutUser,
  signUpUser,
  validateSessionWithNeon
} from "../services/auth.service.js";

const signUpSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z.string().min(1, "Name is required")
});

const signInSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});

/**
 * Controller to return current authenticated user profile
 */
export const meController = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
    return;
  }

  res.json({
    success: true,
    user: req.user,
    token: req.token,
    session: req.session
  });
};

/**
 * Controller for user registration (sign-up)
 */
export const signUpController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = signUpSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parseResult.error.flatten().fieldErrors
    });
    return;
  }

  const origin = req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : undefined);

  try {
    const data = await signUpUser(parseResult.data, origin);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    res.status(400).json({
      success: false,
      message
    });
  }
};

/**
 * Controller for user authentication (sign-in)
 */
export const signInController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = signInSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parseResult.error.flatten().fieldErrors
    });
    return;
  }

  const origin = req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : undefined);

  try {
    const data = await signInUser(parseResult.data, origin);

    res.json({
      success: true,
      message: "Signed in successfully",
      data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    res.status(401).json({
      success: false,
      message
    });
  }
};

/**
 * Controller for user sign-out
 */
export const signOutController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authorization = req.headers.authorization;
  const cookie = req.headers.cookie;
  const origin = req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : undefined);

  const tokenOrCookie = authorization?.replace(/^Bearer\s+/i, "") || cookie;

  try {
    await signOutUser(tokenOrCookie, origin);

    res.json({
      success: true,
      message: "Signed out successfully"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign out failed";
    res.status(500).json({
      success: false,
      message
    });
  }
};

/**
 * Controller for validating and fetching current active session
 */
export const sessionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authorization = req.headers.authorization;
  const cookie = req.headers.cookie;
  const origin = req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : undefined);

  if (!authorization && !cookie) {
    res.status(401).json({
      success: false,
      message: "No session token or cookie provided"
    });
    return;
  }

  try {
    const data = await authenticateRequest(authorization, cookie, origin);

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        token: data.token
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid or expired session";
    res.status(401).json({
      success: false,
      message
    });
  }
};

/**
 * Controller to fetch/mint a signed JWT token from an existing session
 */
export const tokenController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authorization = req.headers.authorization;
  const cookie = req.headers.cookie;
  const origin = req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : undefined);

  const sessionToken = authorization?.replace(/^Bearer\s+/i, "") || "";

  if (!sessionToken && !cookie) {
    res.status(401).json({
      success: false,
      message: "Session token or cookie required to mint JWT"
    });
    return;
  }

  try {
    const token = await getJwtTokenFromSession(sessionToken, cookie, origin);

    res.json({
      success: true,
      token
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to obtain JWT token";
    res.status(401).json({
      success: false,
      message
    });
  }
};
