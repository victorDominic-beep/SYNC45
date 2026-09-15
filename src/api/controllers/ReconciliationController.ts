import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";
import { ReconciliationService } from "../../reconciliation/services/ReconciliationService";
import { ReconciliationRepository } from "../../repositories/ReconciliationRepository";
import { CSVConnector } from "../../connectors/ledger/excel/ExcelConnector";
import { ExcelConnector } from "../../connectors/ledger/excel/ExcelConnector";
import type { UploadedLedgerFile } from "../../bootstrap/Application";

export class ReconciliationController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly reconciliationRepository: ReconciliationRepository,
    private readonly csvUploadRegistry: Map<string, UploadedLedgerFile>
  ) {}

  async reconcile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { organizationId, from, to, ledgerSource, csvFileId } = req.body;

      if (!organizationId || !from || !to) {
        res.status(400).json({
          success: false,
          message: "organizationId, from and to are required.",
        });
        return;
      }

      if (ledgerSource === "csv" || ledgerSource === "excel") {
        if (!csvFileId) {
          res.status(400).json({
            success: false,
            message: "csvFileId is required when using an uploaded ledger file.",
          });
          return;
        }

        const uploadedFile = this.csvUploadRegistry.get(csvFileId);
        const userOrganizationId = String(req.user?.organizationId || "");
        if (!uploadedFile) {
          res.status(400).json({
            success: false,
            message: "Uploaded CSV file reference is invalid or expired.",
          });
          return;
        }

        if (uploadedFile.organizationId !== userOrganizationId) {
          res.status(403).json({
            success: false,
            message: "You do not have access to this uploaded file.",
          });
          return;
        }

        if (uploadedFile.fileType !== ledgerSource) {
          res.status(400).json({
            success: false,
            message: `Uploaded file type does not match ledgerSource ${ledgerSource}.`,
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
    let uploadedPath: string | undefined;
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "CSV or Excel file is required.",
        });
        return;
      }

      uploadedPath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileType = ext === ".csv" ? "csv" : "excel";

      if (![".csv", ".xlsx", ".xls"].includes(ext)) {
        await fs.unlink(uploadedPath).catch(() => undefined);
        res.status(400).json({
          success: false,
          message: "Uploaded ledger file must be a CSV or Excel file.",
        });
        return;
      }

      if (fileType === "csv") {
        await CSVConnector.validateFile(uploadedPath);
      } else {
        await ExcelConnector.validateFile(uploadedPath);
      }

      const fileId = uuidv4();
      const organizationId = String(req.user?.organizationId || "");
      this.csvUploadRegistry.set(fileId, {
        fileId,
        organizationId,
        filePath: uploadedPath,
        fileType,
        originalName: req.file.originalname,
      });

      res.status(201).json({
        success: true,
        message: `${fileType === "csv" ? "CSV" : "Excel"} ledger uploaded successfully.`,
        data: {
          fileId,
          fileType,
          fileName: req.file.originalname,
          size: req.file.size,
        },
      });
    } catch (error) {
      if (uploadedPath) {
        await fs.unlink(uploadedPath).catch(() => undefined);
      }
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = String(req.user?.organizationId || "");
      const reports = await this.reconciliationRepository.findByOrganization(organizationId);
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

      if (report.organizationId !== String(req.user?.organizationId || "")) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this reconciliation report.",
        });
        return;
      }

      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}