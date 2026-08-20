import type { AuthenticatedUser, AuthSession } from "./auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser | undefined;
      token?: string | undefined;
      session?: AuthSession | undefined;
    }
  }
}

export {};