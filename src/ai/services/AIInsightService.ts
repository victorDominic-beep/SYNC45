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
      const invalidRowExplanations = (report.invalidLedgerRows || []).map(
        (row) =>
          `Ledger row ${row.rowNumber} was excluded because ${row.missingFields.join(", ")} is missing or invalid.`
      );

      return {
        summary: invalidRowExplanations.length
          ? `AI insights are unavailable for this report. ${invalidRowExplanations.length} ledger rows were excluded because required values were missing or invalid.`
          : "AI insights are unavailable for this report.",
        risks: report.statistics.mismatched + report.statistics.missing > 0
          ? ["The report contains unresolved transaction discrepancies."]
          : [],
        recommendations: [
          "Review the reconciliation discrepancies and connector health before taking action.",
          ...invalidRowExplanations,
        ],
        confidence: 0,
        generatedAt: new Date(),
      };
    }
  }
}