import { ReconciliationReport } from "../../shared/types/ReconciliationReport";

export class InsightPrompt {
  static build(report: ReconciliationReport): string {
    return `
You are an expert financial reconciliation analyst.

Analyze the reconciliation report below and provide professional insights.

Reconciliation Report

Organization ID:
${report.organizationId}

Generated At:
${report.generatedAt.toISOString()}

Statistics

- Total Transactions: ${report.statistics.totalTransactions}
- Matched: ${report.statistics.matched}
- Missing: ${report.statistics.missing}
- Unmatched: ${report.statistics.unmatched}
- Mismatched: ${report.statistics.mismatched}
- Duplicates: ${report.statistics.duplicates}

Discrepancies

${report.discrepancies
  .map(
    (d) => `
Reference: ${d.reference}
Type: ${d.type}
Severity: ${d.severity}
Priority: ${d.priority}
Description: ${d.description}
`
  )
  .join("\n")}

Invalid Ledger Rows Excluded

${report.invalidLedgerRows?.length
  ? report.invalidLedgerRows
      .map(
        (row) =>
          `Row ${row.rowNumber}: excluded because ${row.missingFields.join(", ")} is missing or invalid.`
      )
      .join("\n")
  : "None"}

Explain every excluded ledger row in the summary, risks, or recommendations.
State that each exclusion was caused by missing or invalid required values.
Do not invent replacement values and do not mention or infer user identifiers.

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
  "confidence": 95
}
  Do not include markdown.
Do not wrap the JSON in triple backticks.
Return JSON only.
`;
  }
}