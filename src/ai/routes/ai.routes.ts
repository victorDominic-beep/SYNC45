import { Router } from "express";

import { Application } from "../../bootstrap/Application";
import { AIRequestValidator } from "../validators/AIRequestValidator";
import { requireAuth } from "../../api/middleware/AuthMiddleware";

export function createAIRoutes(application: Application): Router {
  const router = Router();
  const aiController = application.aiController;

  router.post(
    "/insights",
    requireAuth(application.postgresRepository),
    AIRequestValidator.validate,
    aiController.generateInsights.bind(aiController)
  );

  return router;
}