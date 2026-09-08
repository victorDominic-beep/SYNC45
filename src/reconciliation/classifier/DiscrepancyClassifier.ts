import {
  Discrepancy,
  DiscrepancyType,
} from "../../shared/types/Discrepancy";

export enum Severity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface ClassifiedDiscrepancy extends Discrepancy {
  severity: Severity;
  priority: Priority;
}

export class DiscrepancyClassifier {
  static classify(
    discrepancies: Discrepancy[]
  ): ClassifiedDiscrepancy[] {
    return discrepancies.map((discrepancy) => ({
      ...discrepancy,
      severity: this.getSeverity(discrepancy.type),
      priority: this.getPriority(discrepancy.type),
    }));
  }

  private static getSeverity(type: DiscrepancyType): Severity {
    switch (type) {
      case DiscrepancyType.MISSING_LEDGER_ENTRY:
        return Severity.HIGH;

      case DiscrepancyType.UNMATCHED_LEDGER_ENTRY:
        return Severity.MEDIUM;

      case DiscrepancyType.MISMATCH:
        return Severity.CRITICAL;

      case DiscrepancyType.DUPLICATE:
        return Severity.HIGH;

      default:
        return Severity.LOW;
    }
  }

  private static getPriority(type: DiscrepancyType): Priority {
    switch (type) {
      case DiscrepancyType.MISMATCH:
        return Priority.HIGH;

      case DiscrepancyType.MISSING_LEDGER_ENTRY:
        return Priority.HIGH;

      case DiscrepancyType.DUPLICATE:
        return Priority.MEDIUM;

      case DiscrepancyType.UNMATCHED_LEDGER_ENTRY:
        return Priority.LOW;

      default:
        return Priority.LOW;
    }
  }
}