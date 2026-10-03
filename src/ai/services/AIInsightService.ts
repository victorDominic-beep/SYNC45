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
      const invalidFieldCounts = (report.invalidLedgerRows || []).reduce<Record<string, number>>(
        (counts, row) => {
          for (const field of row.missingFields) {
            counts[field] = (counts[field] ?? 0) + 1;
          }
          return counts;
        },
        {}
      );
      const excludedRows = report.invalidLedgerRows?.length ?? 0;
      const invalidFieldSummary = Object.entries(invalidFieldCounts)
        .map(([field, count]) => `${field}: ${count}`);
      const unresolved = report.statistics.mismatched + report.statistics.missing
        + report.statistics.unmatched + report.statistics.duplicates;

      return {
        summary: `AI insights are unavailable. The reconciliation recorded ${report.statistics.matched} matched transactions and ${unresolved} discrepancies.${excludedRows ? ` ${excludedRows} ledger rows were excluded for invalid required fields.` : ""}`,
        risks: unresolved > 0
          ? [`The report contains ${unresolved} unresolved discrepancy records.`]
          : [],
        recommendations: invalidFieldSummary.length
          ? [`Review the source field mappings and data quality: ${invalidFieldSummary.join("; ")}.`]
          : ["Review the reconciliation discrepancies and connector health before taking action."],
        confidence: 0,
        generatedAt: new Date(),
      };
    }
  }
}