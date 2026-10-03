import {
  Transaction,
  TransactionDirection,
  TransactionStatus,
} from "../../shared/types/Transaction";

export class TransactionNormalizer {
  static fromPaystack(data: any): Transaction {
    // Paystack's /transaction list response does not expose a reliable money-flow field.
    // Keep direction unknown rather than assigning an unsafe default.
    return {
      reference: this.normalizeReference(data.reference),
      amount: Number(data.amount) / 100,
      canonicalAmount: this.fromMinorUnits(data.amount),
      currency: this.normalizeCurrency(data.currency),
      status: this.normalizeStatus(data.status),
      customer: data.customer?.email ?? "",
      paidAt: new Date(data.paid_at),
    };
  }

  static fromMongo(data: any): Transaction {
    return this.fromLedger(data);
  }

  static fromPostgreSQL(data: any): Transaction {
    return this.fromLedger(data);
  }

  static fromMySQL(data: any): Transaction {
    return this.fromLedger(data);
  }

  static fromExcel(data: any): Transaction {
    return this.fromLedger(data);
  }

  static fromCSV(data: any): Transaction {
    return {
      reference: this.normalizeReference(data.reference),
      alternateReference: data.alternateReference ? this.normalizeReference(data.alternateReference) : undefined,
      amount: Number(data.amount),
      canonicalAmount: this.normalizeAmount(data.amount),
      currency: this.normalizeCurrency(data.currency),
      status: this.normalizeStatus(data.status),
      direction: this.normalizeDirection(data.transactionType),
      customer: data.customer ?? "",
      paidAt: new Date(data.paidAt),
    };
  }

  static normalizeReference(reference: unknown): string {
    return String(reference ?? "").trim().toUpperCase();
  }

  static normalizeCurrency(currency: unknown): string {
    return String(currency ?? "").trim().toUpperCase();
  }

  /** Exact decimal representation used instead of floating-point equality. */
  static normalizeAmount(amount: unknown): string {
    const value = String(amount ?? "").trim();
    if (!/^[+-]?\d+(?:\.\d+)?$/.test(value)) throw new Error(`Unsupported transaction amount: ${value}`);
    const negative = value.startsWith("-") ? "-" : "";
    const [whole, fraction = ""] = value.replace(/^[+-]/, "").split(".");
    const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || "0";
    const normalizedFraction = fraction.replace(/0+$/, "");
    return `${negative}${normalizedWhole}${normalizedFraction ? `.${normalizedFraction}` : ""}`;
  }

  static fromMinorUnits(amount: unknown): string {
    const minor = String(amount ?? "").trim();
    if (!/^[+-]?\d+$/.test(minor)) throw new Error(`Unsupported Paystack minor-unit amount: ${minor}`);
    const negative = minor.startsWith("-") ? "-" : "";
    const digits = minor.replace(/^[+-]/, "").replace(/^0+(?=\d)/, "") || "0";
    const padded = digits.padStart(3, "0");
    return this.normalizeAmount(`${negative}${padded.slice(0, -2)}.${padded.slice(-2)}`);
  }

  static normalizeDirection(value: unknown): TransactionDirection | undefined {
    const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
    if (["in", "credit", "incoming", "inflow", "money in", "deposit"].includes(normalized)) return TransactionDirection.IN;
    if (["out", "debit", "outgoing", "outflow", "money out", "withdrawal"].includes(normalized)) return TransactionDirection.OUT;
    return undefined;
  }

  private static getFirstValue(data: any, aliases: string[], isUsable: (value: unknown) => boolean = (value) => value !== undefined && value !== null && String(value).trim() !== ""): unknown {
    if (!data || typeof data !== "object") return undefined;

    for (const alias of aliases) {
      const key = Object.keys(data).find((field) => field.toLowerCase() === alias.toLowerCase());
      if (key && isUsable(data[key])) return data[key];
    }

    return undefined;
  }

  private static fromLedger(data: any): Transaction {
    const reference = this.getFirstValue(data, [
      "transactionReference", "transaction_reference", "transactionRef", "transaction_ref",
      "reference", "ref", "transactionId", "transaction_id", "txnRef", "txn_ref",
      "psReference", "ps_reference",
    ]);
    const normalizedReference = this.normalizeReference(reference);
    const normalizedAlternateReference = this.normalizeReference(this.getFirstValue(data, [
      "alternateReference", "alternate_reference", "psReference", "ps_reference", "paymentReference", "payment_reference",
      "transactionReference", "transaction_reference", "transactionRef", "transaction_ref",
      "transactionId", "transaction_id", "reference", "ref",
    ], (value) => value !== undefined && value !== null && String(value).trim() !== "" && this.normalizeReference(value) !== normalizedReference));
    const amount = this.getFirstValue(data, [
      "amount", "amountPaid", "amount_paid", "amountPaidNGN", "amount_paid_ngn",
      "value", "ledgerAmount", "ledger_amount", "totalAmount", "total_amount",
    ], (value) => {
      try {
        this.normalizeAmount(value);
        return true;
      } catch {
        return false;
      }
    });
    const currency = this.getFirstValue(data, [
      "currency", "currencyCode", "currency_code", "ledgerCurrency", "ledger_currency",
    ]);
    const status = this.getFirstValue(data, [
      "status", "paymentStatus", "payment_status", "transactionStatus", "transaction_status", "state",
    ], (value) => ["success", "failed", "pending", "refunded", "abandoned"].includes(String(value).trim().toLowerCase()));
    const customer = this.getFirstValue(data, [
      "customer", "customerEmail", "customer_email", "customerName", "customer_name",
      "senderName", "sender_name", "email", "payerEmail", "payer_email",
    ]);
    const direction = this.getFirstValue(data, [
      "direction", "transactionType", "transaction_type", "type",
    ]);
    const paidAt = this.getFirstValue(data, [
      "transactionDate", "transaction_date", "paidAt", "paid_at", "createdAt", "created_at",
      "processedAt", "processed_at", "date", "timestamp",
    ], (value) => value !== undefined && value !== null && String(value).trim() !== "" && !Number.isNaN(new Date(String(value)).getTime()));

    return {
      reference: normalizedReference,
      alternateReference: normalizedAlternateReference && normalizedAlternateReference !== normalizedReference
        ? normalizedAlternateReference
        : undefined,
      amount: Number(amount),
      canonicalAmount: this.normalizeAmount(amount),
      currency: this.normalizeCurrency(currency ?? "NGN"),
      status: this.normalizeStatus(String(status ?? "")),
      direction: this.normalizeDirection(direction),
      customer: String(customer ?? ""),
      paidAt: new Date(String(paidAt ?? "")),
    };
  }

  private static normalizeStatus(status: string): TransactionStatus {
    switch (status?.trim().toLowerCase()) {
      case "success": return TransactionStatus.SUCCESS;
      case "failed": return TransactionStatus.FAILED;
      case "pending": return TransactionStatus.PENDING;
      case "refunded": return TransactionStatus.REFUNDED;
      case "abandoned": return TransactionStatus.ABANDONED;
      default: throw new Error(`Unsupported transaction status: ${status}`);
    }
  }
}