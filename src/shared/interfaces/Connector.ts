export interface Connector {
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  healthCheck(): Promise<boolean>;

  fetchTransactions(): Promise<any[]>;
}