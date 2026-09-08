import {
  Transaction,
  TransactionStatus,
} from "../../shared/types/Transaction";

export class TransactionNormalizer {
  /**
   * Normalizes a Paystack transaction into the canonical Transaction format.
   */
  static fromPaystack(data: any): Transaction {
    return {
      reference: data.reference,
      amount: Number(data.amount) / 100,
      currency: data.currency,
      status: this.normalizeStatus(data.status),
      customer: data.customer?.email ?? "",
      paidAt: new Date(data.paid_at),
    };
  }

  /**
   * Normalizes a MongoDB transaction into the canonical Transaction format.
   */
  static fromMongo(data: any): Transaction {
    return {
      reference: data.transactionRef,
      amount: Number(data.amountPaid),
      currency: data.currencyCode,
      status: this.normalizeStatus(data.paymentStatus),
      customer: data.customerEmail,
      paidAt: new Date(data.createdAt),
    };
  }

    /**
   * Normalizes a PostgreSQL transaction into the canonical Transaction format.
   */
  static fromPostgreSQL(data: any): Transaction {
    return {
      reference: data.reference,
      amount: Number(data.amount),
      currency: data.currency,
      status: this.normalizeStatus(data.status),
      customer: data.customer ?? "",
      paidAt: new Date(data.paid_at),
    };
  }

  /**
   * Normalizes a MySQL transaction into the canonical Transaction format.
   */
  static fromMySQL(data: any): Transaction {
    return {
      reference: data.reference,
      amount: Number(data.amount),
      currency: data.currency,
      status: this.normalizeStatus(data.status),
      customer: data.customer ?? "",
      paidAt: new Date(data.paid_at),
    };
  }

  /**
   * Normalizes an Excel transaction into the canonical Transaction format.
   */
  static fromExcel(data: any): Transaction {
    return {
      reference: data.reference,
      amount: Number(data.amount),
      currency: data.currency,
      status: this.normalizeStatus(data.status),
      customer: data.customer ?? "",
      paidAt: new Date(data.paidAt),
    };
  }
  
  /**
   * Converts provider-specific statuses into our standard status.
   */
  private static normalizeStatus(status: string): TransactionStatus {
    switch (status?.toLowerCase()) {
      case "success":
        return TransactionStatus.SUCCESS;

      case "failed":
        return TransactionStatus.FAILED;

      case "pending":
        return TransactionStatus.PENDING;

      case "refunded":
        return TransactionStatus.REFUNDED;

        case "abandoned":
  return TransactionStatus.ABANDONED;

      default:
        throw new Error(`Unsupported transaction status: ${status}`);
    }
  }
}