export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
  ABANDONED = "ABANDONED",
}

/** A known flow of funds. Absence means the source did not provide a safe value. */
export enum TransactionDirection {
  IN = "IN",
  OUT = "OUT",
}

export interface Transaction {
  reference: string;
  /** A second source reference when a ledger supplies both reference fields. */
  alternateReference?: string;
  amount: number;
  /** Canonical decimal amount used for comparison; amount remains for existing consumers. */
  canonicalAmount: string;
  currency: string;
  status: TransactionStatus;
  direction?: TransactionDirection;
  customer: string;
  paidAt: Date;
}