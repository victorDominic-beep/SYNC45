import { Router } from "express";
import multer from "multer";
import path from "path";
import { Application } from "../../bootstrap/Application";
import { ReconciliationValidator } from "../validators/ReconciliationValidator";
import { requireAuth } from "../middleware/AuthMiddleware";
import { requireOrganizationScope } from "../middleware/OrganizationScopeMiddleware";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./data",
    filename: (_req, file, cb) => {
      const safe = path.basename(file.originalname).replace(/[^a-z0-9_.-]/gi, "_");
      const unique = `${Date.now()}-${Math.round(Math.random() * 100000)}-${safe}`;
      cb(null, unique);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".csv") {
      cb(new Error("Uploaded ledger file must be a CSV file."));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export function createReconciliationRoutes(application: Application): Router {
  const router = Router();
  const reconciliationController = application.reconciliationController;

    router.get(
    "/reports",
    requireAuth(application.postgresRepository),
    (req, res, next) => {
      void reconciliationController.list(req, res, next);
    }
  );

  router.get(
    "/reports/:id",
    requireAuth(application.postgresRepository),
    (req, res, next) => {
      void reconciliationController.getById(req, res, next);
    }
  );

  router.post(
    "/upload-csv",
    requireAuth(application.postgresRepository),
    upload.single("file"),
    (req, res, next) => {
      void reconciliationController.uploadCsv(req, res, next);
    }
  );

  router.post(
    "/reconcile",
    requireAuth(application.postgresRepository),
    requireOrganizationScope,
    ReconciliationValidator.validate,
    (req, res, next) => {
      void reconciliationController.reconcile(req, res, next);
    }
  );

  return router;
}