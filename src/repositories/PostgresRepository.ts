import { Pool } from "pg";
import { PostgreSQLRuntimeConfig } from "../config/PostgreSQLConfig";

export class PostgresRepository {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: PostgreSQLRuntimeConfig.HOST,
      port: PostgreSQLRuntimeConfig.PORT,
      database: PostgreSQLRuntimeConfig.DATABASE,
      user: PostgreSQLRuntimeConfig.USER,
      password: PostgreSQLRuntimeConfig.PASSWORD,
    });
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE SCHEMA IF NOT EXISTS sync45;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS sync45.organizations (
        id VARCHAR(80) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS sync45.users (
        id VARCHAR(80) PRIMARY KEY,
        organization_id VARCHAR(80) NOT NULL REFERENCES sync45.organizations(id),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        provider VARCHAR(50) DEFAULT 'local',
        provider_user_id VARCHAR(255),
        role VARCHAR(50) DEFAULT 'ADMIN',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS sync45.organization_connections (
        id VARCHAR(80) PRIMARY KEY,
        organization_id VARCHAR(80) NOT NULL REFERENCES sync45.organizations(id),
        paystack_secret_key TEXT,
        mongodb_uri TEXT,
        mongodb_database VARCHAR(255),
        mongodb_collection VARCHAR(255),
        postgresql_host VARCHAR(255),
        postgresql_port INTEGER,
        postgresql_database VARCHAR(255),
        postgresql_user VARCHAR(255),
        postgresql_password TEXT,
        postgresql_table VARCHAR(255),
        mysql_host VARCHAR(255),
        mysql_port INTEGER,
        mysql_database VARCHAR(255),
        mysql_user VARCHAR(255),
        mysql_password TEXT,
        mysql_table VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async findUserById(id: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT * FROM sync45.users WHERE id = $1 LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async findOrganizationByEmail(email: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT u.*, o.id as organization_id, o.name as organization_name
       FROM sync45.users u
       JOIN sync45.organizations o ON o.id = u.organization_id
       WHERE u.email = $1 LIMIT 1`,
      [email]
    );

    return result.rows[0] ?? null;
  }

  async createOrganization(name: string, email: string): Promise<any> {
    const id = `org-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const result = await this.pool.query(
      `INSERT INTO sync45.organizations (id, name, email, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, name, email]
    );

    return result.rows[0];
  }

  async findOrganizationById(id: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT * FROM sync45.organizations WHERE id = $1 LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async findAllOrganizations(): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM sync45.organizations ORDER BY created_at DESC`
    );

    return result.rows;
  }

  async updateOrganization(id: string, data: Record<string, any>): Promise<any | null> {
    const fields = [`updated_at = CURRENT_TIMESTAMP`];
    const values: any[] = [id];

    if (typeof data.name === "string") {
      fields.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }

    if (typeof data.email === "string") {
      fields.push(`email = $${values.length + 1}`);
      values.push(data.email);
    }

    const sql = `UPDATE sync45.organizations SET ${fields.join(", ")} WHERE id = $1 RETURNING *`;
    const result = await this.pool.query(sql, values);

    return result.rows[0] ?? null;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM sync45.organizations WHERE id = $1 RETURNING id`,
      [id]
    );

    return Boolean(result.rowCount && result.rowCount > 0);
  }

  async createUser(user: any): Promise<any> {
    const result = await this.pool.query(
      `INSERT INTO sync45.users (id, organization_id, first_name, last_name, email, password_hash, provider, provider_user_id, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        user.id,
        user.organizationId,
        user.firstName,
        user.lastName,
        user.email,
        user.passwordHash,
        user.provider || "local",
        user.providerUserId || null,
        user.role || "ADMIN",
        user.isActive ?? true,
      ]
    );

    return result.rows[0];
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT * FROM sync45.users WHERE email = $1 LIMIT 1`,
      [email]
    );

    return result.rows[0] ?? null;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE sync45.users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  async saveConnections(organizationId: string, payload: Record<string, any>): Promise<any | null> {
    const existing = await this.pool.query(
      `SELECT id FROM sync45.organization_connections WHERE organization_id = $1 LIMIT 1`,
      [organizationId]
    );

    const id = existing.rows[0]?.id || `conn-${Date.now()}-${Math.round(Math.random() * 100000)}`;

    const values = [
      id,
      organizationId,
      payload.paystack?.secretKey || payload.paystack?.encryptedSecretKey || null,
      payload.mongodb?.uri || payload.mongodb?.encryptedUri || null,
      payload.mongodb?.database || null,
      payload.mongodb?.collection || null,
      payload.postgresql?.host || null,
      payload.postgresql?.port || null,
      payload.postgresql?.database || null,
      payload.postgresql?.user || null,
      payload.postgresql?.password || payload.postgresql?.encryptedPassword || null,
      payload.postgresql?.table || null,
      payload.mysql?.host || null,
      payload.mysql?.port || null,
      payload.mysql?.database || null,
      payload.mysql?.user || null,
      payload.mysql?.password || payload.mysql?.encryptedPassword || null,
      payload.mysql?.table || null,
    ];

    if (existing.rows[0]) {
      const result = await this.pool.query(
        `UPDATE sync45.organization_connections SET
          paystack_secret_key = $3,
          mongodb_uri = $4,
          mongodb_database = $5,
          mongodb_collection = $6,
          postgresql_host = $7,
          postgresql_port = $8,
          postgresql_database = $9,
          postgresql_user = $10,
          postgresql_password = $11,
          postgresql_table = $12,
          mysql_host = $13,
          mysql_port = $14,
          mysql_database = $15,
          mysql_user = $16,
          mysql_password = $17,
          mysql_table = $18,
          updated_at = CURRENT_TIMESTAMP
        WHERE organization_id = $2
        RETURNING *`,
        values
      );

      return result.rows[0] ?? null;
    }

    const result = await this.pool.query(
      `INSERT INTO sync45.organization_connections (
        id, organization_id,
        paystack_secret_key,
        mongodb_uri,
        mongodb_database,
        mongodb_collection,
        postgresql_host,
        postgresql_port,
        postgresql_database,
        postgresql_user,
        postgresql_password,
        postgresql_table,
        mysql_host,
        mysql_port,
        mysql_database,
        mysql_user,
        mysql_password,
        mysql_table,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      values
    );

    return result.rows[0] ?? null;
  }

  async getConnections(organizationId: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT * FROM sync45.organization_connections WHERE organization_id = $1 LIMIT 1`,
      [organizationId]
    );

    return result.rows[0] ?? null;
  }
}

