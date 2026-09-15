import { Request, Response, NextFunction } from "express";

import { AIInsightService } from "../services/AIInsightService";
import { ReconciliationRepository } from "../../repositories/ReconciliationRepository";

export class AIController {
  constructor(
    private readonly aiInsightService: AIInsightService,
    private readonly reconciliationRepository: ReconciliationRepository
  ) {}

  async generateInsights(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reportId = String(req.body.reportId || "");
      const report = await this.reconciliationRepository.findById(reportId);

      if (!report) {
        res.status(404).json({
          success: false,
          message: "Reconciliation report not found.",
        });
        return;
      }

      if (report.organizationId !== String(req.user?.organizationId || "")) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this reconciliation report.",
        });
        return;
      }

      const insight =
        await this.aiInsightService.generateInsights(report);

      res.status(200).json({
        success: true,
        message: "AI insights generated successfully.",
        data: insight,
      });
    } catch (error) {
      next(error);
    }
  }
}