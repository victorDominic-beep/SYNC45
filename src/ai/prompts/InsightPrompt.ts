import { ReconciliationReport } from "../../shared/types/ReconciliationReport";

export class InsightPrompt {
  static build(report: ReconciliationReport): string {
    const discrepancyCounts = report.discrepancies.reduce<Record<string, number>>(
      (counts, discrepancy) => {
        counts[discrepancy.type] = (counts[discrepancy.type] ?? 0) + 1;
        return counts;
      },
      {}
    );
    const severityCounts = report.discrepancies.reduce<Record<string, number>>(
      (counts, discrepancy) => {
        counts[discrepancy.severity] = (counts[discrepancy.severity] ?? 0) + 1;
        return counts;
      },
      {}
    );
    const invalidFieldCounts = (report.invalidLedgerRows ?? []).reduce<Record<string, number>>(
      (counts, row) => {
        for (const field of row.missingFields) {
          counts[field] = (counts[field] ?? 0) + 1;
        }
        return counts;
      },
      {}
    );

    return `
You are an expert financial reconciliation analyst.

Provide concise, cautious insights based only on the aggregate counts below.
The counts are authoritative; do not recalculate or invent values.

Reconciliation statistics

- Total Transactions: ${report.statistics.totalTransactions}
- Matched: ${report.statistics.matched}
- Missing: ${report.statistics.missing}
- Unmatched: ${report.statistics.unmatched}
- Mismatched: ${report.statistics.mismatched}
- Duplicates: ${report.statistics.duplicates}

Discrepancy counts by type:
${JSON.stringify(discrepancyCounts)}

Discrepancy counts by severity:
${JSON.stringify(severityCounts)}

Invalid ledger row count: ${report.invalidLedgerRows?.length ?? 0}
Invalid field counts:
${JSON.stringify(invalidFieldCounts)}

Do not infer individual transaction causes from aggregate counts. Do not claim that an item was investigated or resolved. Recommend checking the relevant source data and mappings where appropriate. Do not include identifiers, references, customer information, row numbers, or raw transaction data.

Respond ONLY with valid JSON.

The JSON must follow exactly this structure:

{
  "summary": "string",
  "risks": [
    "string"
  ],
  "recommendations": [
    "string"
  ],
  "confidence": 0.95
}
  Do not include markdown.
Do not wrap the JSON in triple backticks.
Return JSON only.
`;
  }
}