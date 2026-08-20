import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import databaseRoutes from "./routes/database.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (env.clientOrigins.includes(origin) || env.nodeEnv === "development") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application routes
app.use(healthRoutes);
app.use(databaseRoutes);
app.use(authRoutes);

// Catch-all and error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;