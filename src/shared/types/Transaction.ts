export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
  ABANDONED = "ABANDONED",
}

export interface Transaction {
  reference: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  customer: string;
  paidAt: Date;
}