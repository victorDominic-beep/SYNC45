import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { Organization, OrganizationConnectionSettings } from "./Organization";
import { PostgresRepository } from "../repositories/PostgresRepository";

export class OrganizationService {
  private readonly organizations: Organization[] = [];

  constructor(private readonly postgresRepository?: PostgresRepository) {}

  private readonly encryptionKey =
    process.env.CONNECTION_ENCRYPTION_KEY ||
    "sync45-local-dev-connection-key-change-this";

  private encrypt(value: string): string {
    if (!value) {
      return "";
    }

    const key = createHash("sha256")
      .update(this.encryptionKey)
      .digest();
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);

    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
  }

  private decrypt(value: string): string {
    if (!value || !value.includes(":")) {
      return value;
    }

    try {
      const [ivHex, encryptedHex] = value.split(":");
      const key = createHash("sha256")
        .update(this.encryptionKey)
        .digest();
      const iv = Buffer.from(ivHex, "hex");
      const encrypted = Buffer.from(encryptedHex, "hex");
      const decipher = createDecipheriv("aes-256-cbc", key, iv);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch {
      return value;
    }
  }

  async create(organization: Organization): Promise<Organization> {
    if (this.postgresRepository) {
      const row = await this.postgresRepository.createOrganization(
        organization.name,
        organization.email
      );

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: true,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        paymentProvider: organization.paymentProvider,
        ledgerProvider: organization.ledgerProvider,
        settings: organization.settings,
        connections: organization.connections,
      };
    }

    this.organizations.push(organization);
    return organization;
  }

  async findById(id: string): Promise<Organization | null> {
    if (this.postgresRepository) {
      const row = await this.postgresRepository.findOrganizationById(id);
      if (!row) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: true,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        paymentProvider: "paystack",
        ledgerProvider: "excel",
        settings: {
          autoReconciliation: true,
          reconciliationFrequency: "MANUAL",
          sendNotifications: true,
          generateReports: true,
        },
      };
    }

    const organization = this.organizations.find(
      (organization) => organization.id === id
    );

    return organization ?? null;
  }

  async findAll(): Promise<Organization[]> {
    if (this.postgresRepository) {
      const rows = await this.postgresRepository.findAllOrganizations();
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: true,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        paymentProvider: "paystack",
        ledgerProvider: "excel",
        settings: {
          autoReconciliation: true,
          reconciliationFrequency: "MANUAL",
          sendNotifications: true,
          generateReports: true,
        },
      }));
    }

    return [...this.organizations];
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization | null> {
    if (this.postgresRepository) {
      const row = await this.postgresRepository.updateOrganization(id, {
        name: data.name,
        email: data.email,
      });

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: true,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        paymentProvider: "paystack",
        ledgerProvider: "excel",
        settings: {
          autoReconciliation: true,
          reconciliationFrequency: "MANUAL",
          sendNotifications: true,
          generateReports: true,
        },
      };
    }

    const index = this.organizations.findIndex(
      (organization) => organization.id === id
    );

    if (index === -1) {
      return null;
    }

    this.organizations[index] = {
      ...this.organizations[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.organizations[index];
  }

  async saveConnections(
    organizationId: string,
    payload: OrganizationConnectionSettings
  ): Promise<Organization | null> {
    if (this.postgresRepository) {
      const nextConnections: OrganizationConnectionSettings = {
        ...payload,
      };

      if (payload.paystack?.secretKey) {
        nextConnections.paystack = {
          ...nextConnections.paystack,
          encryptedSecretKey: this.encrypt(payload.paystack.secretKey),
          connected: true,
        };
      }

      if (payload.mongodb?.uri) {
        nextConnections.mongodb = {
          ...nextConnections.mongodb,
          ...payload.mongodb,
          encryptedUri: this.encrypt(payload.mongodb.uri),
          connected: true,
        };
      }

      if (payload.postgresql?.password) {
        nextConnections.postgresql = {
          ...nextConnections.postgresql,
          ...payload.postgresql,
          encryptedPassword: this.encrypt(payload.postgresql.password),
          connected: true,
        };
      }

      if (payload.mysql?.password) {
        nextConnections.mysql = {
          ...nextConnections.mysql,
          ...payload.mysql,
          encryptedPassword: this.encrypt(payload.mysql.password),
          connected: true,
        };
      }

      await this.postgresRepository.saveConnections(organizationId, nextConnections);
      return this.findById(organizationId);
    }

    const organization = await this.findById(organizationId);

    if (!organization) {
      return null;
    }

    const nextConnections: OrganizationConnectionSettings = {
      ...organization.connections,
      ...payload,
    };

    if (payload.paystack?.secretKey) {
      nextConnections.paystack = {
        ...nextConnections.paystack,
        encryptedSecretKey: this.encrypt(payload.paystack.secretKey),
        connected: true,
      };
    }

    if (payload.mongodb?.uri) {
      nextConnections.mongodb = {
        ...nextConnections.mongodb,
        ...payload.mongodb,
        encryptedUri: this.encrypt(payload.mongodb.uri),
        connected: true,
      };
    }

    if (payload.postgresql?.password) {
      nextConnections.postgresql = {
        ...nextConnections.postgresql,
        ...payload.postgresql,
        encryptedPassword: this.encrypt(payload.postgresql.password),
        connected: true,
      };
    }

    if (payload.mysql?.password) {
      nextConnections.mysql = {
        ...nextConnections.mysql,
        ...payload.mysql,
        encryptedPassword: this.encrypt(payload.mysql.password),
        connected: true,
      };
    }

    organization.connections = nextConnections;
    organization.updatedAt = new Date();

    return organization;
  }

  async getConnections(
    organizationId: string
  ): Promise<OrganizationConnectionSettings | null> {
    if (this.postgresRepository) {
      const row = await this.postgresRepository.getConnections(organizationId);

      if (!row) {
        return null;
      }

      return {
        paystack: row.paystack_secret_key ? { connected: true } : undefined,
        mongodb: row.mongodb_uri ? {
          connected: true,
          database: row.mongodb_database,
          collection: row.mongodb_collection,
        } : undefined,
        postgresql: row.postgresql_host ? {
          connected: true,
          host: row.postgresql_host,
          port: row.postgresql_port,
          database: row.postgresql_database,
          user: row.postgresql_user,
          table: row.postgresql_table,
        } : undefined,
        mysql: row.mysql_host ? {
          connected: true,
          host: row.mysql_host,
          port: row.mysql_port,
          database: row.mysql_database,
          user: row.mysql_user,
          table: row.mysql_table,
        } : undefined,
      };
    }

    const organization = await this.findById(organizationId);

    if (!organization || !organization.connections) {
      return null;
    }

    return {
      paystack: organization.connections.paystack
        ? {
            connected: Boolean(
              organization.connections.paystack
                ?.encryptedSecretKey
            ),
          }
        : undefined,
      mongodb: organization.connections.mongodb
        ? {
            connected: Boolean(
              organization.connections.mongodb?.encryptedUri
            ),
            database: organization.connections.mongodb?.database,
            collection: organization.connections.mongodb?.collection,
          }
        : undefined,
      postgresql: organization.connections.postgresql
        ? {
            connected: Boolean(
              organization.connections.postgresql
                ?.encryptedPassword
            ),
            host: organization.connections.postgresql?.host,
            port: organization.connections.postgresql?.port,
            database: organization.connections.postgresql?.database,
            user: organization.connections.postgresql?.user,
            table: organization.connections.postgresql?.table,
          }
        : undefined,
      mysql: organization.connections.mysql
        ? {
            connected: Boolean(
              organization.connections.mysql?.encryptedPassword
            ),
            host: organization.connections.mysql?.host,
            port: organization.connections.mysql?.port,
            database: organization.connections.mysql?.database,
            user: organization.connections.mysql?.user,
            table: organization.connections.mysql?.table,
          }
        : undefined,
    };
  }

  async resolveConnectionConfig(
    organizationId: string
  ): Promise<OrganizationConnectionSettings | null> {
    if (this.postgresRepository) {
      const row = await this.postgresRepository.getConnections(organizationId);
      if (!row) {
        return null;
      }

      const resolved: OrganizationConnectionSettings = {};
      if (row.paystack_secret_key) {
        resolved.paystack = { secretKey: this.decrypt(row.paystack_secret_key) };
      }
      if (row.mongodb_uri) {
        resolved.mongodb = {
          uri: this.decrypt(row.mongodb_uri),
          database: row.mongodb_database,
          collection: row.mongodb_collection,
        };
      }
      if (row.postgresql_password) {
        resolved.postgresql = {
          host: row.postgresql_host,
          port: row.postgresql_port,
          database: row.postgresql_database,
          user: row.postgresql_user,
          password: this.decrypt(row.postgresql_password),
          table: row.postgresql_table,
        };
      }
      if (row.mysql_password) {
        resolved.mysql = {
          host: row.mysql_host,
          port: row.mysql_port,
          database: row.mysql_database,
          user: row.mysql_user,
          password: this.decrypt(row.mysql_password),
          table: row.mysql_table,
        };
      }

      return resolved;
    }

    const organization = await this.findById(organizationId);

    if (!organization || !organization.connections) {
      return null;
    }

    const connections = organization.connections;
    const resolved: OrganizationConnectionSettings = {};

    if (connections.paystack?.encryptedSecretKey) {
      resolved.paystack = {
        ...connections.paystack,
        secretKey: this.decrypt(
          connections.paystack.encryptedSecretKey
        ),
      };
    }

    if (connections.mongodb?.encryptedUri) {
      resolved.mongodb = {
        ...connections.mongodb,
        uri: this.decrypt(connections.mongodb.encryptedUri),
      };
    }

    if (connections.postgresql?.encryptedPassword) {
      resolved.postgresql = {
        ...connections.postgresql,
        password: this.decrypt(
          connections.postgresql.encryptedPassword
        ),
      };
    }

    if (connections.mysql?.encryptedPassword) {
      resolved.mysql = {
        ...connections.mysql,
        password: this.decrypt(connections.mysql.encryptedPassword),
      };
    }

    return resolved;
  }

  async activate(id: string): Promise<boolean> {
    if (this.postgresRepository) {
      const organization = await this.findById(id);
      if (!organization) {
        return false;
      }
      return true;
    }

    const organization = await this.findById(id);

    if (!organization) {
      return false;
    }

    organization.isActive = true;
    organization.updatedAt = new Date();

    return true;
  }

  async deactivate(id: string): Promise<boolean> {
    if (this.postgresRepository) {
      const organization = await this.findById(id);
      if (!organization) {
        return false;
      }
      return true;
    }

    const organization = await this.findById(id);

    if (!organization) {
      return false;
    }

    organization.isActive = false;
    organization.updatedAt = new Date();

    return true;
  }

  async delete(id: string): Promise<boolean> {
    if (this.postgresRepository) {
      return await this.postgresRepository.deleteOrganization(id);
    }

    const index = this.organizations.findIndex(
      (organization) => organization.id === id
    );

    if (index === -1) {
      return false;
    }

    this.organizations.splice(index, 1);

    return true;
  }
}