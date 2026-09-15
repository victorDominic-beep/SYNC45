import { Transaction } from "../../shared/types/Transaction";
import {
  ReconciliationReport,
  ReportStatistics,
  InvalidLedgerRow,
} from "../../shared/types/ReconciliationReport";
import { ClassifiedDiscrepancy } from "../classifier/DiscrepancyClassifier";
import { DiscrepancyType } from "../../shared/types/Discrepancy";


export class ReportGenerator {
  static generate(
    organizationId: string,
    matchedTransactions: Transaction[],
    discrepancies: ClassifiedDiscrepancy[],
    invalidLedgerRows: InvalidLedgerRow[] = []
  ): ReconciliationReport {
    const statistics = this.buildStatistics(
      matchedTransactions,
      discrepancies
    );

    return {
      id: crypto.randomUUID(),
      organizationId,
      generatedAt: new Date(),
      statistics,
      discrepancies,
      invalidLedgerRows: invalidLedgerRows.length ? invalidLedgerRows : undefined,
    };
  }

  private static buildStatistics(
    matchedTransactions: Transaction[],
    discrepancies: ClassifiedDiscrepancy[]
  ): ReportStatistics {
    const statistics: ReportStatistics = {
      totalTransactions:
        matchedTransactions.length + discrepancies.length,

      matched: matchedTransactions.length,

      missing: 0,

      unmatched: 0,

      mismatched: 0,

      duplicates: 0,
    };

    for (const discrepancy of discrepancies) {
      switch (discrepancy.type) {
        case DiscrepancyType.MISSING_LEDGER_ENTRY:
          statistics.missing++;
          break;

        case DiscrepancyType.UNMATCHED_LEDGER_ENTRY:
          statistics.unmatched++;
          break;

        case DiscrepancyType.MISMATCH:
          statistics.mismatched++;
          break;

        case DiscrepancyType.DUPLICATE:
          statistics.duplicates++;
          break;
      }
    }

    return statistics;
  }
}