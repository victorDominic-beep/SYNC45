import { Transaction } from "./Transaction";

export enum DiscrepancyType {
  MISSING_LEDGER_ENTRY = "MISSING_LEDGER_ENTRY",
  UNMATCHED_LEDGER_ENTRY = "UNMATCHED_LEDGER_ENTRY",
  MISMATCH = "MISMATCH",
  DUPLICATE = "DUPLICATE",
}

export enum DiscrepancyStatus {
  OPEN = "OPEN",
  INVESTIGATING = "INVESTIGATING",
  RESOLVED = "RESOLVED",
  IGNORED = "IGNORED",
}

export interface Discrepancy {
  id: string;
  reference: string;
  type: DiscrepancyType;
  status: DiscrepancyStatus;
  paymentTransaction?: Transaction;
  ledgerTransaction?: Transaction;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}