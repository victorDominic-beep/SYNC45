export class PostgreSQLRuntimeConfig {
  static readonly HOST =
    process.env.SYNC45_DB_HOST ||
    process.env.POSTGRESQL_HOST ||
    process.env.POSTGRES_HOST ||
    "localhost";

  static readonly PORT = Number(
    process.env.SYNC45_DB_PORT ||
    process.env.POSTGRESQL_PORT || process.env.POSTGRES_PORT || 5432
  );

  static readonly DATABASE =
    process.env.SYNC45_DB_DATABASE ||
    process.env.POSTGRESQL_DATABASE ||
    process.env.POSTGRES_DB ||
    "sync45_test";

  static readonly USER =
    process.env.SYNC45_DB_USER ||
    process.env.POSTGRESQL_USER || process.env.POSTGRES_USER || "postgres";

  static readonly PASSWORD =
    process.env.SYNC45_DB_PASSWORD ||
    process.env.POSTGRESQL_PASSWORD ||
    process.env.POSTGRES_PASSWORD ||
    "admin";

  static readonly SSL = PostgreSQLRuntimeConfig.parseBoolean(
    process.env.SYNC45_DB_SSL ||
    process.env.POSTGRESQL_SSL ||
    process.env.PGSSLMODE ||
    "false"
  );

  static readonly SSL_REJECT_UNAUTHORIZED = PostgreSQLRuntimeConfig.parseBoolean(
    process.env.SYNC45_DB_SSL_REJECT_UNAUTHORIZED ||
    process.env.POSTGRESQL_SSL_REJECT_UNAUTHORIZED ||
    "false"
  );

  private static parseBoolean(value: string): boolean {
    if (!value) return false;

    const normalized = value.trim().toLowerCase();
    return [
      "1",
      "true",
      "yes",
      "on",
      "require",
      "verify-ca",
      "verify-full",
    ].includes(normalized);
  }
}
