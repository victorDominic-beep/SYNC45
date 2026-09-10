import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { Organization, OrganizationConnectionSettings } from "./Organization";

export class OrganizationService {
  private readonly organizations: Organization[] = [];

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

  async create(
    organization: Organization
  ): Promise<Organization> {
    this.organizations.push(organization);

    return organization;
  }

  async findById(
    id: string
  ): Promise<Organization | null> {
    const organization = this.organizations.find(
      (organization) => organization.id === id
    );

    return organization ?? null;
  }

  async findAll(): Promise<Organization[]> {
    return [...this.organizations];
  }

  async update(
    id: string,
    data: Partial<Organization>
  ): Promise<Organization | null> {
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
    const organization = await this.findById(id);

    if (!organization) {
      return false;
    }

    organization.isActive = true;
    organization.updatedAt = new Date();

    return true;
  }

  async deactivate(id: string): Promise<boolean> {
    const organization = await this.findById(id);

    if (!organization) {
      return false;
    }

    organization.isActive = false;
    organization.updatedAt = new Date();

    return true;
  }

  async delete(id: string): Promise<boolean> {
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