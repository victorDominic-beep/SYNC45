import { Collection, Db, MongoClient } from "mongodb";
import { Connector } from "../../../shared/interfaces/Connector";

export interface MongoConnectorConfig {
  uri: string;
  database: string;
  collection: string;
}

export class MongoDBConnector implements Connector {
  private client: MongoClient;
  private db!: Db;
  private collection!: Collection;

  constructor(private readonly config: MongoConnectorConfig) {
    this.client = new MongoClient(config.uri);
  }

  /**
   * Connect to the client's MongoDB database.
   */
  async connect(): Promise<void> {
    await this.client.connect();

    this.db = this.client.db(this.config.database);

    this.collection = this.db.collection(this.config.collection);
  }

  /**
   * Fetch all transactions from the configured collection.
   */
  async fetchTransactions(filter = {}) {
    return await this.collection.find(filter).toArray();
  }

  /**
   * Verify the MongoDB connection.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();

      await this.db.command({ ping: 1 });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the database connection.
   */
  async disconnect(): Promise<void> {
    await this.client.close();
  }
}