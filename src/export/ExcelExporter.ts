import { ReconciliationReport } from "../shared/types/ReconciliationReport";

export class ExcelExporter {
  export(report: ReconciliationReport): string[][] {
    const rows: string[][] = [];

    // Header row
    rows.push([
      "Reference",
      "Type",
      "Severity",
      "Priority",
      "Description",
      "Created At",
    ]);

    // Data rows
    for (const discrepancy of report.discrepancies) {
      rows.push([
        discrepancy.reference,
        discrepancy.type,
        discrepancy.severity,
        discrepancy.priority,
        discrepancy.description,
        discrepancy.createdAt.toISOString(),
      ]);
    }

    return rows;
  }
}