export interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  table: string;
  ssl?: boolean | { rejectUnauthorized?: boolean; ca?: string; cert?: string; key?: string };
}