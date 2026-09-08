import axios, { AxiosInstance } from "axios";

export interface PaystackTransactionQuery {
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export class PaystackConnector {
  private readonly client: AxiosInstance;

  constructor(secretKey: string) {
    this.client = axios.create({
      baseURL: "https://api.paystack.co",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Fetch transactions from Paystack.
   */
  async fetchTransactions(query: PaystackTransactionQuery = {}) {
    const response = await this.client.get("/transaction", {
      params: {
        from: query.from,
        to: query.to,
        page: query.page ?? 1,
        perPage: query.perPage ?? 50,
      },
    });

    return response.data.data;
  }

  /**
   * Verify the Paystack connection.
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/transaction", {
        params: {
          perPage: 1,
        },
      });

      return true;
    } catch {
      return false;
    }
  }
}