import { Pool } from "pg";
import { PostgreSQLConfig } from "./PostgreSQLConfig";
import { Connector } from "../../../shared/interfaces/Connector";

export class PostgreSQLConnector implements Connector {
  private readonly pool: Pool;

  constructor(private readonly config: PostgreSQLConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();
    client.release();
  }

  async fetchTransactions(): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM ${this.config.table}`
    );

    return result.rows;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }
}