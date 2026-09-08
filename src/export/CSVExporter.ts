import { ReconciliationReport } from "../shared/types/ReconciliationReport";

export class CSVExporter {
  export(report: ReconciliationReport): string {
    const rows: string[] = [];

    // Header
    rows.push(
      "Reference,Type,Severity,Priority,Description,Created At"
    );

    // Discrepancies
    for (const discrepancy of report.discrepancies) {
      rows.push([
        discrepancy.reference,
        discrepancy.type,
        discrepancy.severity,
        discrepancy.priority,
        `"${discrepancy.description}"`,
        discrepancy.createdAt.toISOString(),
      ].join(","));
    }

    return rows.join("\n");
  }
}