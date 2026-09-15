export class ConnectorConfig {
  // Paystack
  static readonly PAYSTACK_BASE_URL =
    process.env.PAYSTACK_BASE_URL ||
    "https://api.paystack.co";

  static readonly PAYSTACK_SECRET_KEY =
    process.env.PAYSTACK_SECRET_KEY || "";

  // Flutterwave
  static readonly FLUTTERWAVE_BASE_URL =
    process.env.FLUTTERWAVE_BASE_URL ||
    "https://api.flutterwave.com/v3";

  static readonly FLUTTERWAVE_SECRET_KEY =
    process.env.FLUTTERWAVE_SECRET_KEY || "";

  // Stripe
  static readonly STRIPE_BASE_URL =
    process.env.STRIPE_BASE_URL ||
    "https://api.stripe.com/v1";

  static readonly STRIPE_SECRET_KEY =
    process.env.STRIPE_SECRET_KEY || "";

  // Ledger Sources
  static readonly LEDGER_SOURCE =
    process.env.LEDGER_SOURCE || "mongodb";

  // PostgreSQL
  static readonly POSTGRESQL_HOST =
    process.env.LEDGER_POSTGRES_HOST || "localhost";

  static readonly POSTGRESQL_PORT = Number(
    process.env.LEDGER_POSTGRES_PORT || 5432
  );

  static readonly POSTGRESQL_DATABASE =
    process.env.LEDGER_POSTGRES_DATABASE || "sync45";

  static readonly POSTGRESQL_USER =
    process.env.LEDGER_POSTGRES_USER || "postgres";

  static readonly POSTGRESQL_PASSWORD =
    process.env.LEDGER_POSTGRES_PASSWORD || "";

  static readonly POSTGRESQL_TABLE =
    process.env.LEDGER_POSTGRES_TABLE || "transactions";

  // MySQL
  static readonly MYSQL_HOST =
    process.env.MYSQL_HOST || "localhost";

  static readonly MYSQL_PORT = Number(
    process.env.MYSQL_PORT || 3306
  );

  static readonly MYSQL_DATABASE =
    process.env.MYSQL_DATABASE || "sync45";

  static readonly MYSQL_USER =
    process.env.MYSQL_USER || "root";

  static readonly MYSQL_PASSWORD =
    process.env.MYSQL_PASSWORD || "";

  static readonly MYSQL_TABLE =
    process.env.MYSQL_TABLE || "transactions";

  // Excel
  static readonly EXCEL_FILE_PATH =
    process.env.EXCEL_FILE_PATH || "./data/transactions.xlsx";

  static readonly EXCEL_SHEET_NAME =
    process.env.EXCEL_SHEET_NAME || "Transactions";

  static readonly RECONCILIATION_STORE_PATH =
    process.env.RECONCILIATION_STORE_PATH || "./data/reconciliation-reports.json";

  // Default Request Settings
  static readonly REQUEST_TIMEOUT = Number(
    process.env.CONNECTOR_REQUEST_TIMEOUT || 30000
  );

  static readonly MAX_RETRIES = Number(
    process.env.CONNECTOR_MAX_RETRIES || 3
  );
}