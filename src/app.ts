import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import { createReconciliationRoutes } from "./api/routes/reconciliation.routes";
import { createAuthRoutes } from "./api/routes/auth.routes";
import { createOrganizationRoutes } from "./api/routes/organization.routes";
import { GlobalErrorHandler } from "./errors/GlobalErrorHandler";
import { createAIRoutes } from "./ai/routes/ai.routes";
import { Application } from "./bootstrap/Application";

// ...


const app = express();
const application = new Application();

// Security
app.use(helmet());

// Enable CORS
app.use(cors());

// Compress responses
app.use(compression());

// HTTP request logging
app.use(morgan("dev"));

// Parse JSON requests
app.use(express.json());

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req, res, next) => {
  try {
    const [paystack, ledger] = await Promise.all([
      application.paystackConnector.testConnection(),
      application.ledgerConnector.healthCheck(),
    ]);
    const healthy = paystack && ledger;
    res.status(healthy ? 200 : 503).json({
      success: healthy,
      status: healthy ? "ready" : "degraded",
      connectors: { paystack, ledger },
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use("/api/auth", createAuthRoutes(application));
app.use("/api", createOrganizationRoutes(application));
app.use("/api/reconciliation", createReconciliationRoutes(application));
app.use("/api/ai", createAIRoutes(application));

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// Global Error Handler
app.use(GlobalErrorHandler.handle);

export default app;