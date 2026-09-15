export interface OrganizationConnectionSettings {
  paystack?: {
    secretKey?: string;
    encryptedSecretKey?: string;
    connected?: boolean;
    configured?: boolean;
  };

  mongodb?: {
    uri?: string;
    database?: string;
    collection?: string;
    encryptedUri?: string;
    connected?: boolean;
    configured?: boolean;
  };

  postgresql?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    encryptedPassword?: string;
    table?: string;
    connected?: boolean;
    configured?: boolean;
  };

  mysql?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    encryptedPassword?: string;
    table?: string;
    connected?: boolean;
    configured?: boolean;
  };
}

export interface Organization {
  id: string;

  name: string;

  email: string;

  phone?: string;

  address?: string;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  paymentProvider: string;

  ledgerProvider: string;

  settings: OrganizationSettings;

  connections?: OrganizationConnectionSettings;
}

export interface OrganizationSettings {
  autoReconciliation: boolean;

  reconciliationFrequency: "MANUAL" | "DAILY" | "WEEKLY" | "MONTHLY";

  sendNotifications: boolean;

  generateReports: boolean;
}