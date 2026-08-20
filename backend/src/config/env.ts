import "dotenv/config";

const rawPort = process.env.PORT?.toString().replace(/[^0-9]/g, "");
const port = rawPort ? parseInt(rawPort, 10) : 5000;
const neonAuthUrl = (process.env.NEON_AUTH_URL || "").replace(/\/$/, "");
const clientOrigin = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"];

export const env = {
  port: Number.isNaN(port) ? 5000 : port,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  neonAuthUrl,
  jwksUrl: neonAuthUrl ? `${neonAuthUrl}/.well-known/jwks.json` : "",
  clientOrigins: clientOrigin
};