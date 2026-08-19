import express from "express";
import healthRoutes from "./routes/health.routes.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use(healthRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;