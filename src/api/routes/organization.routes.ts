import { Router, Request, Response, NextFunction } from "express";
import { Application } from "../../bootstrap/Application";
import { requireAuth } from "../middleware/AuthMiddleware";
import { requireOrganizationScope } from "../middleware/OrganizationScopeMiddleware";

interface OrganizationParams {
  id: string;
}

export function createOrganizationRoutes(application: Application): Router {
  const router = Router();
  const organizationController = application.organizationController;

  router.post(
    "/organizations",
    requireAuth(application.postgresRepository),
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.create(req, res, next);
    }
  );

  router.get(
    "/organizations",
    requireAuth(application.postgresRepository),
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.findAll(req, res, next);
    }
  );

  router.get(
    "/organizations/:id",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.findById(req as unknown as Request<OrganizationParams>, res, next);
    }
  );

  router.put(
    "/organizations/:id",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.update(req as unknown as Request<OrganizationParams>, res, next);
    }
  );

  router.patch(
    "/organizations/:id/activate",
    requireAuth(application.postgresRepository, {
      allowInactiveOrganization: true,
    }),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.activate(req as unknown as Request<OrganizationParams>, res, next);
    }
  );

  router.patch(
    "/organizations/:id/deactivate",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.deactivate(req as unknown as Request<OrganizationParams>, res, next);
    }
  );

  router.delete(
    "/organizations/:id",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.delete(req as unknown as Request<OrganizationParams>, res, next);
    }
  );

  router.get(
    "/organizations/:id/connections",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.getConnections(req as unknown as Request<OrganizationParams>, res, next);
    }
  );

  router.post(
    "/connections",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.saveConnections(req, res, next);
    }
  );

  router.post(
    "/organizations/:id/connections",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    (req: Request, res: Response, next: NextFunction) => {
      void organizationController.saveConnections(req, res, next);
    }
  );

  return router;
}
