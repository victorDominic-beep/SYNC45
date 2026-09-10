import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";
import { ReconciliationService } from "../../reconciliation/services/ReconciliationService";
import { ReconciliationRepository } from "../../repositories/ReconciliationRepository";
import { CSVConnector } from "../../connectors/ledger/excel/ExcelConnector";

export class ReconciliationController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly reconciliationRepository: ReconciliationRepository,
    private readonly csvUploadRegistry: Map<string, string>
  ) {}

  async reconcile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { organizationId, from, to, ledgerSource, csvFileId, csvFilePath } = req.body;

      if (!organizationId || !from || !to) {
        res.status(400).json({
          success: false,
          message: "organizationId, from and to are required.",
        });
        return;
      }

      if (ledgerSource === "csv") {
        if (!csvFileId && !csvFilePath) {
          res.status(400).json({
            success: false,
            message: "csvFileId or csvFilePath is required when ledgerSource is csv.",
          });
          return;
        }

        if (csvFileId && !this.csvUploadRegistry.has(csvFileId)) {
          res.status(400).json({
            success: false,
            message: "Uploaded CSV file reference is invalid or expired.",
          });
          return;
        }
      }

      const result = await this.reconciliationService.reconcile({
        organizationId,
        from,
        to,
        ledgerSource,
        csvFileId,
        csvFilePath,
      });

      res.status(200).json({
        success: true,
        message: "Reconciliation completed successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadCsv(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "CSV file is required.",
        });
        return;
      }

      const uploadedPath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      if (ext !== ".csv") {
        await fs.unlink(uploadedPath).catch(() => undefined);
        res.status(400).json({
          success: false,
          message: "Uploaded ledger file must be a CSV file.",
        });
        return;
      }

      await CSVConnector.validateFile(uploadedPath);

      const fileId = uuidv4();
      this.csvUploadRegistry.set(fileId, uploadedPath);

      res.status(201).json({
        success: true,
        message: "CSV ledger uploaded successfully.",
        data: {
          fileId,
          fileName: req.file.originalname,
          size: req.file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = req.query.organizationId
        ? await this.reconciliationRepository.findByOrganization(String(req.query.organizationId))
        : await this.reconciliationRepository.findAll();
      res.json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await this.reconciliationRepository.findById(String(req.params.id));
      if (!report) {
        res.status(404).json({ success: false, message: "Reconciliation report not found." });
        return;
      }
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}