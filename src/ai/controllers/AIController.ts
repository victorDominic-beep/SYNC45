import { Request, Response, NextFunction } from "express";

import { AIInsightService } from "../services/AIInsightService";

export class AIController {
  constructor(
    private readonly aiInsightService: AIInsightService
  ) {}

  async generateInsights(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const report = req.body.report;

      const insight =
        await this.aiInsightService.generateInsights(
          report
        );

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