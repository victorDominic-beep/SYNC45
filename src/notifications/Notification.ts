export enum NotificationType {
  EMAIL = "EMAIL",
  WEBHOOK = "WEBHOOK",
  SMS = "SMS"
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED"
}

export interface Notification {
  id: string;

  organizationId: string;

  type: NotificationType;

  recipient: string;

  subject: string;

  message: string;

  status: NotificationStatus;

  createdAt: Date;

  sentAt?: Date;

  metadata?: Record<string, any>;
}