import { Router } from "express";
import { Application } from "../../bootstrap/Application";
import { ReconciliationValidator } from "../validators/ReconciliationValidator";

export function createReconciliationRoutes(application: Application): Router {
  const router = Router();
  const reconciliationController = application.reconciliationController;

  router.get(
    "/reports",
    reconciliationController.list.bind(reconciliationController)
  );

  router.get(
    "/reports/:id",
    reconciliationController.getById.bind(reconciliationController)
  );

  router.post(
    "/reconcile",
    ReconciliationValidator.validate,
    reconciliationController.reconcile.bind(reconciliationController)
  );

  return router;
}