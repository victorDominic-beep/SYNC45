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

  private reencryptStored(value?: string): string | undefined {
    return value ? this.encrypt(this.decrypt(value)) : undefined;
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
        isActive: row.is_active !== false,
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
        isActive: row.is_active !== false,
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
        isActive: row.is_active !== false,
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
        isActive: row.is_active !== false,
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
      const current = await this.postgresRepository.getConnections(organizationId);
      const encryptedConnections: OrganizationConnectionSettings = {};

      if (payload.paystack || current?.paystack_secret_key) {
        encryptedConnections.paystack = {
          encryptedSecretKey: payload.paystack?.secretKey
            ? this.encrypt(payload.paystack.secretKey)
            : this.reencryptStored(current?.paystack_secret_key),
        };
      }

      if (payload.mongodb || current?.mongodb_uri) {
        encryptedConnections.mongodb = {
          encryptedUri: payload.mongodb?.uri
            ? this.encrypt(payload.mongodb.uri)
            : this.reencryptStored(current?.mongodb_uri),
          database: payload.mongodb?.database ?? current?.mongodb_database,
          collection: payload.mongodb?.collection ?? current?.mongodb_collection,
        };
      }

      if (payload.postgresql || current?.postgresql_password) {
        encryptedConnections.postgresql = {
          encryptedPassword: payload.postgresql?.password
            ? this.encrypt(payload.postgresql.password)
            : this.reencryptStored(current?.postgresql_password),
          host: payload.postgresql?.host ?? current?.postgresql_host,
          port: payload.postgresql?.port ?? current?.postgresql_port,
          database: payload.postgresql?.database ?? current?.postgresql_database,
          user: payload.postgresql?.user ?? current?.postgresql_user,
          table: payload.postgresql?.table ?? current?.postgresql_table,
        };
      }

      if (payload.mysql || current?.mysql_password) {
        encryptedConnections.mysql = {
          encryptedPassword: payload.mysql?.password
            ? this.encrypt(payload.mysql.password)
            : this.reencryptStored(current?.mysql_password),
          host: payload.mysql?.host ?? current?.mysql_host,
          port: payload.mysql?.port ?? current?.mysql_port,
          database: payload.mysql?.database ?? current?.mysql_database,
          user: payload.mysql?.user ?? current?.mysql_user,
          table: payload.mysql?.table ?? current?.mysql_table,
        };
      }

      await this.postgresRepository.saveConnections(organizationId, encryptedConnections);
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
        paystack: row.paystack_secret_key ? { connected: true, configured: true } : undefined,
        mongodb: row.mongodb_uri ? {
          connected: true,
          configured: true,
          database: row.mongodb_database,
          collection: row.mongodb_collection,
        } : undefined,
        postgresql: row.postgresql_password ? {
          connected: true,
          configured: true,
          host: row.postgresql_host,
          port: row.postgresql_port,
          database: row.postgresql_database,
          user: row.postgresql_user,
          table: row.postgresql_table,
        } : undefined,
        mysql: row.mysql_password ? {
          connected: true,
          configured: true,
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
      return Boolean(await this.postgresRepository.updateOrganizationActive(id, true));
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
      return Boolean(await this.postgresRepository.updateOrganizationActive(id, false));
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