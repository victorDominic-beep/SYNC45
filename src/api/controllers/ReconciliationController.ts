import { Request, Response, NextFunction } from "express";
import { ReconciliationService } from "../../reconciliation/services/ReconciliationService";
import { ReconciliationRepository } from "../../repositories/ReconciliationRepository";

export class ReconciliationController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly reconciliationRepository: ReconciliationRepository
  ) {}

  async reconcile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { organizationId, from, to } = req.body;

      if (!organizationId || !from || !to) {
        res.status(400).json({
          success: false,
          message: "organizationId, from and to are required.",
        });
        return;
      }

            const result = await this.reconciliationService.reconcile({
        organizationId,
        from,
        to,
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