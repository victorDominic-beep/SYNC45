require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
  host: process.env.POSTGRESQL_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRESQL_PORT || process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRESQL_DATABASE || process.env.POSTGRES_DB || 'sync45_test',
  user: process.env.POSTGRESQL_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRESQL_PASSWORD || process.env.POSTGRES_PASSWORD || 'admin',
  ssl: {
    rejectUnauthorized: false,
  },
});
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS sync45;`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync45.organizations (
        id VARCHAR(80) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
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

    await pool.query(`
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

    console.log('POSTGRES_MIGRATION_OK');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
