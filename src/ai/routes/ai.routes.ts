import { Router } from "express";

import { Application } from "../../bootstrap/Application";
import { AIRequestValidator } from "../validators/AIRequestValidator"


export function createAIRoutes(application: Application): Router {
  const router = Router();
  const aiController = application.aiController;

  router.post(
    "/insights",
    AIRequestValidator.validate,
    aiController.generateInsights.bind(aiController)
  );

  return router;
}