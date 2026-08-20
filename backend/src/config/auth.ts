import { createAuthClient } from "@neondatabase/neon-js/auth";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { env } from "./env.js";

export const authClient = createAuthClient(env.neonAuthUrl);

let jwksCache: JWTVerifyGetKey | null = null;

export const getJwksSet = (): JWTVerifyGetKey => {
  if (!jwksCache && env.jwksUrl) {
    jwksCache = createRemoteJWKSet(new URL(env.jwksUrl));
  }
  if (!jwksCache) {
    throw new Error("Neon Auth JWKS URL is not configured in environment variables.");
  }
  return jwksCache;
};

export const AUTH_COOKIE_NAMES = [
  "__Secure-neon-auth.session_token",
  "neon-auth.session_token",
  "better-auth.session_token"
] as const;