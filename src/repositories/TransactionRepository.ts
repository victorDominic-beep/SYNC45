import { BaseRepository } from "./BaseRepository";
import { Transaction } from "../shared/types/Transaction";

export class TransactionRepository extends BaseRepository<Transaction> {
  private readonly transactions: Transaction[] = [];

  async create(transaction: Transaction): Promise<Transaction> {
    this.transactions.push(transaction);
    return transaction;
  }

  async findById(reference: string): Promise<Transaction | null> {
    const transaction = this.transactions.find(
      (transaction) => transaction.reference === reference
    );

    return transaction ?? null;
  }

  async findAll(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  async update(
    reference: string,
    data: Partial<Transaction>
  ): Promise<Transaction | null> {
    const index = this.transactions.findIndex(
      (transaction) => transaction.reference === reference
    );

    if (index === -1) {
      return null;
    }

    this.transactions[index] = {
      ...this.transactions[index],
      ...data,
    };

    return this.transactions[index];
  }

  async delete(reference: string): Promise<boolean> {
    const index = this.transactions.findIndex(
      (transaction) => transaction.reference === reference
    );

    if (index === -1) {
      return false;
    }

    this.transactions.splice(index, 1);

    return true;
  }

  async findByReference(
    reference: string
  ): Promise<Transaction | null> {
    const transaction = this.transactions.find(
      (transaction) => transaction.reference === reference
    );

    return transaction ?? null;
  }

  async findByStatus(
    status: Transaction["status"]
  ): Promise<Transaction[]> {
    return this.transactions.filter(
      (transaction) => transaction.status === status
    );
  }

  async findByDateRange(
    from: Date,
    to: Date
  ): Promise<Transaction[]> {
    return this.transactions.filter((transaction) => {
      return transaction.paidAt >= from && transaction.paidAt <= to;
    });
  }
}