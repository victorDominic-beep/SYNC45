import { Router } from "express";
import { Application } from "../../bootstrap/Application";
import { requireAuth } from "../middleware/AuthMiddleware";

export function createAuthRoutes(application: Application): Router {
  const router = Router();
  const userController = application.userController;

  router.post("/register", userController.register.bind(userController));
  router.post("/login", userController.login.bind(userController));
  router.post("/forgot-password", userController.forgotPassword.bind(userController));
  router.post("/reset-password", userController.resetPassword.bind(userController));
  router.get(
    "/me",
    requireAuth(application.postgresRepository),
    userController.getMe.bind(userController)
  );
  router.post("/google", userController.googleLogin.bind(userController));

  return router;
}
