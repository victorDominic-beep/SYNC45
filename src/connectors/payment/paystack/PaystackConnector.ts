import axios, { AxiosInstance } from "axios";

export interface PaystackTransactionQuery {
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export class PaystackConnector {
  private readonly client: AxiosInstance;
  private static readonly DEFAULT_PER_PAGE = 50;
  private static readonly MAX_PAGES_WITHOUT_METADATA = 10_000;

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

  /** Fetch every page for the requested date range without logging credentials. */
  async fetchTransactions(query: PaystackTransactionQuery = {}): Promise<any[]> {
    const perPage = query.perPage && query.perPage > 0
      ? Math.min(query.perPage, PaystackConnector.DEFAULT_PER_PAGE)
      : PaystackConnector.DEFAULT_PER_PAGE;
    let page = query.page && query.page > 0 ? query.page : 1;
    const transactions: any[] = [];
    const fetchedPages = new Set<number>();
    let expectedLastPage: number | undefined;

    while (true) {
      if (fetchedPages.has(page)) {
        throw new Error("Paystack pagination repeated a page.");
      }
      if (fetchedPages.size >= PaystackConnector.MAX_PAGES_WITHOUT_METADATA) {
        throw new Error("Paystack pagination exceeded the safe page limit.");
      }
      fetchedPages.add(page);

      const response = await this.client.get("/transaction", {
        params: { from: query.from, to: query.to, page, perPage },
      });
      const pageTransactions = Array.isArray(response.data?.data) ? response.data.data : [];
      transactions.push(...pageTransactions);

      const meta = response.data?.meta;
      const total = Number(meta?.total);
      if (Number.isFinite(total) && total >= 0) {
        expectedLastPage = Math.ceil(total / perPage);
      } else if (Number.isFinite(Number(meta?.pageCount))) {
        expectedLastPage = Number(meta.pageCount);
      }

      if (!pageTransactions.length || pageTransactions.length < perPage) break;
      if (expectedLastPage !== undefined && page >= expectedLastPage) break;
      page += 1;
    }

    return transactions;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/transaction", { params: { perPage: 1 } });
      return true;
    } catch {
      return false;
    }
  }
}