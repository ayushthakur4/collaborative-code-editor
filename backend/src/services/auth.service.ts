import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAMES, getJwksSet } from "../config/auth.js";
import { env } from "../config/env.js";
import type {
  AuthenticatedUser,
  AuthResponseData,
  AuthSession,
  SignInInput,
  SignUpInput
} from "../types/auth.types.js";

const DEFAULT_ORIGIN = env.clientOrigins[0] || "http://localhost:5000";

interface NeonAuthUserPayload {
  id: string;
  email?: string | undefined;
  name?: string | undefined;
  role?: string | undefined;
  emailVerified?: boolean | undefined;
  image?: string | null | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

interface NeonAuthSessionPayload {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

interface NeonSessionResponse {
  user?: NeonAuthUserPayload | null | undefined;
  session?: NeonAuthSessionPayload | null | undefined;
}

/**
 * Sign up a new user via Neon Auth
 */
export const signUpUser = async (
  input: SignUpInput,
  origin: string = DEFAULT_ORIGIN
): Promise<AuthResponseData> => {
  const url = `${env.neonAuthUrl}/sign-up/email`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name
    })
  });

  const body = (await response.json()) as {
    token?: string | undefined;
    user?: NeonAuthUserPayload | undefined;
    session?: NeonAuthSessionPayload | undefined;
    message?: string | undefined;
    error?: { message?: string | undefined } | string | undefined;
  };

  if (!response.ok) {
    const errorMsg =
      (typeof body.error === "object" ? body.error?.message : body.error) ||
      body.message ||
      `Sign up failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  const rawUser = body.user;
  if (!rawUser) {
    throw new Error("Failed to retrieve user data from authentication provider");
  }

  const user: AuthenticatedUser = {
    id: rawUser.id,
    email: rawUser.email,
    name: rawUser.name,
    role: rawUser.role,
    emailVerified: rawUser.emailVerified,
    image: rawUser.image,
    createdAt: rawUser.createdAt,
    updatedAt: rawUser.updatedAt
  };

  const rawSetCookie = response.headers.get("set-cookie") || "";
  const sessionToken = body.token || body.session?.token;

  let jwtToken: string | undefined;
  if (sessionToken) {
    try {
      jwtToken = await getJwtTokenFromSession(sessionToken, rawSetCookie, origin);
    } catch {
      // If minting JWT fails, fallback to session token
    }
  }

  const session: AuthSession | undefined = body.session
    ? {
        id: body.session.id,
        token: body.session.token,
        userId: body.session.userId,
        expiresAt: body.session.expiresAt,
        createdAt: body.session.createdAt,
        updatedAt: body.session.updatedAt
      }
    : undefined;

  return {
    user,
    token: jwtToken || sessionToken,
    session
  };
};

/**
 * Sign in an existing user via Neon Auth
 */
export const signInUser = async (
  input: SignInInput,
  origin: string = DEFAULT_ORIGIN
): Promise<AuthResponseData> => {
  const url = `${env.neonAuthUrl}/sign-in/email`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password
    })
  });

  const body = (await response.json()) as {
    token?: string | undefined;
    user?: NeonAuthUserPayload | undefined;
    session?: NeonAuthSessionPayload | undefined;
    message?: string | undefined;
    error?: { message?: string | undefined } | string | undefined;
  };

  if (!response.ok) {
    const errorMsg =
      (typeof body.error === "object" ? body.error?.message : body.error) ||
      body.message ||
      `Sign in failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  const rawUser = body.user;
  if (!rawUser) {
    throw new Error("Failed to retrieve user profile from authentication provider");
  }

  const user: AuthenticatedUser = {
    id: rawUser.id,
    email: rawUser.email,
    name: rawUser.name,
    role: rawUser.role,
    emailVerified: rawUser.emailVerified,
    image: rawUser.image,
    createdAt: rawUser.createdAt,
    updatedAt: rawUser.updatedAt
  };

  const rawSetCookie = response.headers.get("set-cookie") || "";
  const sessionToken = body.token || body.session?.token;

  let jwtToken: string | undefined;
  if (sessionToken) {
    try {
      jwtToken = await getJwtTokenFromSession(sessionToken, rawSetCookie, origin);
    } catch {
      // Fallback
    }
  }

  const session: AuthSession | undefined = body.session
    ? {
        id: body.session.id,
        token: body.session.token,
        userId: body.session.userId,
        expiresAt: body.session.expiresAt,
        createdAt: body.session.createdAt,
        updatedAt: body.session.updatedAt
      }
    : undefined;

  return {
    user,
    token: jwtToken || sessionToken,
    session
  };
};

/**
 * Sign out user by invalidating their session on Neon Auth
 */
export const signOutUser = async (
  sessionTokenOrCookie?: string | undefined,
  origin: string = DEFAULT_ORIGIN
): Promise<boolean> => {
  if (!sessionTokenOrCookie) return true;

  const url = `${env.neonAuthUrl}/sign-out`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    origin
  };

  if (sessionTokenOrCookie.includes("=") || sessionTokenOrCookie.includes(";")) {
    headers.cookie = sessionTokenOrCookie;
  } else {
    headers.authorization = `Bearer ${sessionTokenOrCookie}`;
    headers.cookie = `__Secure-neon-auth.session_token=${sessionTokenOrCookie}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({})
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Obtain a signed JWT token from Neon Auth using an active session token or cookie
 */
export const getJwtTokenFromSession = async (
  sessionToken: string,
  cookieHeader?: string | undefined,
  origin: string = DEFAULT_ORIGIN
): Promise<string> => {
  const url = `${env.neonAuthUrl}/token`;
  const headers: Record<string, string> = {
    origin,
    authorization: `Bearer ${sessionToken}`
  };

  if (cookieHeader) {
    headers.cookie = cookieHeader;
  } else if (sessionToken) {
    headers.cookie = `__Secure-neon-auth.session_token=${sessionToken}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to mint JWT token from session: ${response.statusText}`);
  }

  const data = (await response.json()) as { token?: string | undefined };
  if (!data.token) {
    throw new Error("No token returned by Neon Auth token endpoint");
  }

  return data.token;
};

/**
 * Verify a JWT cryptographically against Neon Auth JWKS via jose
 */
export const verifyJwtToken = async (jwtToken: string): Promise<AuthenticatedUser> => {
  const JWKS = getJwksSet();
  const { payload } = await jwtVerify(jwtToken, JWKS);

  const id = (payload.sub || payload.id) as string;
  if (!id) {
    throw new Error("JWT token missing subject (sub) claim");
  }

  return {
    id,
    email: (payload.email as string) || undefined,
    name: (payload.name as string) || undefined,
    role: (payload.role as string) || undefined,
    emailVerified: (payload.emailVerified as boolean) || undefined,
    createdAt: (payload.createdAt as string) || undefined,
    updatedAt: (payload.updatedAt as string) || undefined
  };
};

/**
 * Validate an opaque session token or cookie against Neon Auth /get-session
 */
export const validateSessionWithNeon = async (
  tokenOrCookie: string,
  origin: string = DEFAULT_ORIGIN
): Promise<{ user: AuthenticatedUser; session?: AuthSession | undefined }> => {
  const url = `${env.neonAuthUrl}/get-session`;
  const headers: Record<string, string> = { origin };

  if (tokenOrCookie.includes("=") || tokenOrCookie.includes(";")) {
    headers.cookie = tokenOrCookie;
  } else {
    headers.authorization = `Bearer ${tokenOrCookie}`;
    headers.cookie = `__Secure-neon-auth.session_token=${tokenOrCookie}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Session lookup failed");
  }

  const data = (await response.json()) as NeonSessionResponse | null;
  if (!data || !data.user || !data.session) {
    throw new Error("Invalid or expired session");
  }

  const user: AuthenticatedUser = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
    emailVerified: data.user.emailVerified,
    image: data.user.image,
    createdAt: data.user.createdAt,
    updatedAt: data.user.updatedAt
  };

  const session: AuthSession = {
    id: data.session.id,
    token: data.session.token,
    userId: data.session.userId,
    expiresAt: data.session.expiresAt,
    createdAt: data.session.createdAt,
    updatedAt: data.session.updatedAt
  };

  return { user, session };
};

/**
 * Extract Neon Auth cookie value from cookie header string
 */
export const extractCookieToken = (cookieHeader?: string | undefined): string | null => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const name of AUTH_COOKIE_NAMES) {
    const match = cookies.find((c) => c.startsWith(`${name}=`));
    if (match) {
      return match.substring(name.length + 1);
    }
  }

  return null;
};

/**
 * Unified verification for request headers and cookies:
 * Handles Bearer JWT tokens, Bearer session tokens, and session cookies.
 */
export const authenticateRequest = async (
  authorizationHeader?: string | undefined,
  cookieHeader?: string | undefined,
  origin: string = DEFAULT_ORIGIN
): Promise<{ user: AuthenticatedUser; token?: string | undefined; session?: AuthSession | undefined }> => {
  let token: string | undefined;

  if (authorizationHeader?.startsWith("Bearer ")) {
    token = authorizationHeader.substring("Bearer ".length).trim();
  }

  // 1. Try JWT verification if it resembles a JWT format (header.payload.signature)
  if (token && token.split(".").length === 3) {
    try {
      const user = await verifyJwtToken(token);
      return { user, token, session: undefined };
    } catch {
      // If JWT verification fails, fall through to session check
    }
  }

  // 2. Try session token verification if bearer token exists
  if (token) {
    try {
      const result = await validateSessionWithNeon(token, origin);
      return { user: result.user, token, session: result.session };
    } catch {
      // Fall through to cookie check
    }
  }

  // 3. Try session cookie verification
  if (cookieHeader) {
    const cookieToken = extractCookieToken(cookieHeader);
    if (cookieToken) {
      // Check if cookie token itself is a JWT
      if (cookieToken.split(".").length === 3) {
        try {
          const user = await verifyJwtToken(cookieToken);
          return { user, token: cookieToken, session: undefined };
        } catch {
          // Fall through
        }
      }

      // Check against Neon Auth session endpoint
      const result = await validateSessionWithNeon(cookieHeader, origin);
      return { user: result.user, token: cookieToken, session: result.session };
    }
  }

  throw new Error("No valid authentication token or session found");
};
