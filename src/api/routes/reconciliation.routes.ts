import { Router } from "express";
import multer from "multer";
import path from "path";
import { Application } from "../../bootstrap/Application";
import { ReconciliationValidator } from "../validators/ReconciliationValidator";

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
    reconciliationController.list.bind(reconciliationController)
  );

  router.get(
    "/reports/:id",
    reconciliationController.getById.bind(reconciliationController)
  );

  router.post(
    "/upload-csv",
    upload.single("file"),
    reconciliationController.uploadCsv.bind(reconciliationController)
  );

  router.post(
    "/reconcile",
    ReconciliationValidator.validate,
    reconciliationController.reconcile.bind(reconciliationController)
  );

  return router;
}