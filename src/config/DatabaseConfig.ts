export class DatabaseConfig {
  static readonly URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/sync45";

  static readonly DATABASE =
    process.env.MONGODB_DATABASE || "sync45";

    static readonly COLLECTION =
  process.env.MONGODB_COLLECTION || "transactions";
  
  static readonly MAX_POOL_SIZE = Number(
    process.env.DB_MAX_POOL_SIZE || 10
  );

  static readonly MIN_POOL_SIZE = Number(
    process.env.DB_MIN_POOL_SIZE || 2
  );

  static readonly CONNECT_TIMEOUT_MS = Number(
    process.env.DB_CONNECT_TIMEOUT || 10000
  );

  static readonly SOCKET_TIMEOUT_MS = Number(
    process.env.DB_SOCKET_TIMEOUT || 45000
  );

  static readonly SERVER_SELECTION_TIMEOUT_MS = Number(
    process.env.DB_SERVER_SELECTION_TIMEOUT || 5000
  );

  static readonly RETRY_WRITES =
    process.env.DB_RETRY_WRITES === "true";

  static readonly RETRY_READS =
    process.env.DB_RETRY_READS === "true";
}