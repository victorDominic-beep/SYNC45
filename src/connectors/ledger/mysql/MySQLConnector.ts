import mysql, { Pool } from "mysql2/promise";
import { MySQLConfig } from "./MySQLConfig";
import { Connector } from "../../../shared/interfaces/Connector";

export class MySQLConnector implements Connector {
  private readonly pool: Pool;

  constructor(private readonly config: MySQLConfig) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  async connect(): Promise<void> {
    const connection = await this.pool.getConnection();
    connection.release();
  }

  async fetchTransactions(): Promise<any[]> {
    const [rows] = await this.pool.query(
      `SELECT * FROM ${this.config.table}`
    );

    return rows as any[];
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