export class PostgreSQLRuntimeConfig {
  static readonly HOST =
    process.env.POSTGRESQL_HOST ||
    process.env.POSTGRES_HOST ||
    "localhost";

  static readonly PORT = Number(
    process.env.POSTGRESQL_PORT || process.env.POSTGRES_PORT || 5432
  );

  static readonly DATABASE =
    process.env.POSTGRESQL_DATABASE ||
    process.env.POSTGRES_DB ||
    "sync45_test";

  static readonly USER =
    process.env.POSTGRESQL_USER || process.env.POSTGRES_USER || "postgres";

  static readonly PASSWORD =
    process.env.POSTGRESQL_PASSWORD ||
    process.env.POSTGRES_PASSWORD ||
    "admin";
}
