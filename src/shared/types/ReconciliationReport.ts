import { ClassifiedDiscrepancy } from "../../reconciliation/classifier/DiscrepancyClassifier";

export interface ReportStatistics {
  totalTransactions: number;
  matched: number;
  missing: number;
  unmatched: number;
  mismatched: number;
  duplicates: number;
}

export interface InvalidLedgerRow {
  rowNumber: number;
  missingFields: string[];
}

export interface ReconciliationReport {
  id: string;
  organizationId: string;
  generatedAt: Date;
  statistics: ReportStatistics;
  discrepancies: ClassifiedDiscrepancy[];
  invalidLedgerRows?: InvalidLedgerRow[];
}