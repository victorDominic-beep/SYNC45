import { ReconciliationReport } from "../shared/types/ReconciliationReport";

export class PDFExporter {
  export(report: ReconciliationReport): string {
    const lines: string[] = [];

    lines.push("========== SYNC45 RECONCILIATION REPORT ==========");
    lines.push("");
    lines.push(`Report ID: ${report.id}`);
    lines.push(`Organization: ${report.organizationId}`);
    lines.push(`Generated At: ${report.generatedAt.toISOString()}`);
    lines.push("");

    lines.push("STATISTICS");
    lines.push("----------------------------");
    lines.push(`Total Transactions : ${report.statistics.totalTransactions}`);
    lines.push(`Matched            : ${report.statistics.matched}`);
    lines.push(`Missing            : ${report.statistics.missing}`);
    lines.push(`Unmatched          : ${report.statistics.unmatched}`);
    lines.push(`Mismatched         : ${report.statistics.mismatched}`);
    lines.push(`Duplicates         : ${report.statistics.duplicates}`);
    lines.push("");

    lines.push("DISCREPANCIES");
    lines.push("----------------------------");

    for (const discrepancy of report.discrepancies) {
      lines.push(`Reference : ${discrepancy.reference}`);
      lines.push(`Type      : ${discrepancy.type}`);
      lines.push(`Severity  : ${discrepancy.severity}`);
      lines.push(`Priority  : ${discrepancy.priority}`);
      lines.push(`Description: ${discrepancy.description}`);
      lines.push("----------------------------------------");
    }

    return lines.join("\n");
  }
}