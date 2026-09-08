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
}

export interface OrganizationSettings {
  autoReconciliation: boolean;

  reconciliationFrequency: "MANUAL" | "DAILY" | "WEEKLY" | "MONTHLY";

  sendNotifications: boolean;

  generateReports: boolean;
}