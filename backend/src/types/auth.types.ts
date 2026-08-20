export interface AuthenticatedUser {
  id: string;
  email?: string | undefined;
  name?: string | undefined;
  role?: string | undefined;
  emailVerified?: boolean | undefined;
  image?: string | null | undefined;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: string | Date;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
}

export interface AuthResponseData {
  user: AuthenticatedUser;
  token?: string | undefined;
  session?: AuthSession | undefined;
}