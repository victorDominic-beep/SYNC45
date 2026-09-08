import {
  Transaction,
} from "../../shared/types/Transaction";

import {
  Discrepancy,
  DiscrepancyStatus,
  DiscrepancyType,
} from "../../shared/types/Discrepancy";

export interface MatchResult {
  matched: Transaction[];
  discrepancies: Discrepancy[];
}

export class TransactionMatcher {
  static match(
    paymentTransactions: Transaction[],
    ledgerTransactions: Transaction[]
  ): MatchResult {
    const matched: Transaction[] = [];
    const discrepancies: Discrepancy[] = [];

    // Group ledger transactions by reference
    const ledgerMap = new Map<string, Transaction[]>();

    for (const ledger of ledgerTransactions) {
      const existing = ledgerMap.get(ledger.reference) ?? [];
      existing.push(ledger);
      ledgerMap.set(ledger.reference, existing);
    }

    // Compare every payment transaction
    for (const payment of paymentTransactions) {
      const ledgerEntries = ledgerMap.get(payment.reference);

      // Missing from ledger
      if (!ledgerEntries || ledgerEntries.length === 0) {
        discrepancies.push({
          id: crypto.randomUUID(),
          reference: payment.reference,
          type: DiscrepancyType.MISSING_LEDGER_ENTRY,
          status: DiscrepancyStatus.OPEN,
          paymentTransaction: payment,
          description:
            "Transaction exists in payment provider but not in ledger.",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        continue;
      }

      // Duplicate ledger entries
      if (ledgerEntries.length > 1) {
        discrepancies.push({
          id: crypto.randomUUID(),
          reference: payment.reference,
          type: DiscrepancyType.DUPLICATE,
          status: DiscrepancyStatus.OPEN,
          paymentTransaction: payment,
          ledgerTransaction: ledgerEntries[0],
          description:
            "Multiple ledger entries exist for the same transaction reference.",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        ledgerMap.delete(payment.reference);

        continue;
      }

      const ledger = ledgerEntries[0];

      // Compare fields
      if (
        payment.amount !== ledger.amount ||
        payment.currency !== ledger.currency ||
        payment.status !== ledger.status
      ) {
        discrepancies.push({
          id: crypto.randomUUID(),
          reference: payment.reference,
          type: DiscrepancyType.MISMATCH,
          status: DiscrepancyStatus.OPEN,
          paymentTransaction: payment,
          ledgerTransaction: ledger,
          description:
            "Transaction fields do not match.",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        ledgerMap.delete(payment.reference);

        continue;
      }

      // Exact match
      matched.push(payment);

      ledgerMap.delete(payment.reference);
    }

    // Remaining ledger transactions are unmatched
    for (const ledgerEntries of ledgerMap.values()) {
      for (const ledger of ledgerEntries) {
        discrepancies.push({
          id: crypto.randomUUID(),
          reference: ledger.reference,
          type: DiscrepancyType.UNMATCHED_LEDGER_ENTRY,
          status: DiscrepancyStatus.OPEN,
          ledgerTransaction: ledger,
          description:
            "Transaction exists in ledger but not in payment provider.",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return {
      matched,
      discrepancies,
    };
  }
}