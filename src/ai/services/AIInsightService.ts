import { ReconciliationReport } from "../../shared/types/ReconciliationReport";
import { AIInsight } from "../models/AIInsight";
import { AIProvider } from "../providers/AIProvider";

export class AIInsightService {
  constructor(
    private readonly provider: AIProvider
  ) {}

  async generateInsights(
    report: ReconciliationReport
  ): Promise<AIInsight> {
    try {
      return await this.provider.generateInsights(report);
    } catch {
      return {
        summary: "AI insights are unavailable for this report.",
        risks: report.statistics.mismatched + report.statistics.missing > 0
          ? ["The report contains unresolved transaction discrepancies."]
          : [],
        recommendations: ["Review the reconciliation discrepancies and connector health before taking action."],
        confidence: 0,
        generatedAt: new Date(),
      };
    }
  }
}