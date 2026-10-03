import { Transaction } from "../../shared/types/Transaction";
import { Discrepancy, DiscrepancyStatus, DiscrepancyType } from "../../shared/types/Discrepancy";

export interface MatchResult {
  matched: Transaction[];
  discrepancies: Discrepancy[];
}

export class TransactionMatcher {
  static match(paymentTransactions: Transaction[], ledgerTransactions: Transaction[]): MatchResult {
    const matched: Transaction[] = [];
    const discrepancies: Discrepancy[] = [];
    const ledgerMap = new Map<string, Set<Transaction>>();
    const unmatchedLedger = new Set(ledgerTransactions);

    for (const ledger of ledgerTransactions) {
      for (const reference of this.references(ledger)) {
        const entries = ledgerMap.get(reference) ?? new Set<Transaction>();
        entries.add(ledger);
        ledgerMap.set(reference, entries);
      }
    }

    for (const payment of paymentTransactions) {
      const ledgerEntries = new Set<Transaction>();
      for (const reference of this.references(payment)) {
        for (const ledger of ledgerMap.get(reference) ?? []) {
          if (unmatchedLedger.has(ledger)) ledgerEntries.add(ledger);
        }
      }

      if (!ledgerEntries.size) {
        discrepancies.push(this.discrepancy(payment.reference, DiscrepancyType.MISSING_LEDGER_ENTRY, payment, undefined, "Transaction exists in payment provider but not in ledger."));
        continue;
      }
      if (ledgerEntries.size > 1) {
        discrepancies.push(this.discrepancy(payment.reference, DiscrepancyType.DUPLICATE, payment, ledgerEntries.values().next().value, "Multiple ledger entries exist for the same transaction reference."));
        for (const ledger of ledgerEntries) unmatchedLedger.delete(ledger);
        continue;
      }

      const ledger = ledgerEntries.values().next().value!;
      if (payment.canonicalAmount !== ledger.canonicalAmount || payment.currency !== ledger.currency || payment.status !== ledger.status || !this.directionsMatch(payment, ledger)) {
        discrepancies.push(this.discrepancy(payment.reference, DiscrepancyType.MISMATCH, payment, ledger, this.mismatchDescription(payment, ledger)));
        unmatchedLedger.delete(ledger);
        continue;
      }
      matched.push(payment);
      unmatchedLedger.delete(ledger);
    }

    for (const ledger of unmatchedLedger) {
      discrepancies.push(this.discrepancy(ledger.reference, DiscrepancyType.UNMATCHED_LEDGER_ENTRY, undefined, ledger, "Transaction exists in ledger but not in payment provider."));
    }
    return { matched, discrepancies };
  }

  private static references(transaction: Transaction): string[] {
    return [...new Set([transaction.reference, transaction.alternateReference]
      .map((reference) => String(reference ?? "").trim().toUpperCase())
      .filter(Boolean))];
  }

  /** Unknown direction is compatible for legacy sources; two known values must agree. */
  private static directionsMatch(payment: Transaction, ledger: Transaction): boolean {
    return !payment.direction || !ledger.direction || payment.direction === ledger.direction;
  }

  private static mismatchDescription(payment: Transaction, ledger: Transaction): string {
    if (payment.direction && ledger.direction && payment.direction !== ledger.direction) {
      return `Transaction direction mismatch: payment is ${payment.direction}, ledger is ${ledger.direction}.`;
    }
    return "Transaction fields do not match.";
  }

  private static discrepancy(reference: string, type: DiscrepancyType, paymentTransaction?: Transaction, ledgerTransaction?: Transaction, description = ""): Discrepancy {
    return { id: crypto.randomUUID(), reference, type, status: DiscrepancyStatus.OPEN, paymentTransaction, ledgerTransaction, description, createdAt: new Date(), updatedAt: new Date() };
  }
}