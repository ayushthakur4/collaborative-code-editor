import express, { type Request,type  Response } from "express";
import healthRoutes from "../src/routes/health.routes.js"
const app = express();

app.use(express.json());

app.use(express.json());

app.use(healthRoutes);

export default app;