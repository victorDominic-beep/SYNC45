export class NotificationConfig {
  // Email Configuration
  static readonly EMAIL_FROM =
    process.env.EMAIL_FROM || "noreply@sync45.com";

  static readonly SMTP_HOST =
    process.env.SMTP_HOST || "localhost";

  static readonly SMTP_PORT = Number(
    process.env.SMTP_PORT || 587
  );

  static readonly SMTP_USERNAME =
    process.env.SMTP_USERNAME || "";

  static readonly SMTP_PASSWORD =
    process.env.SMTP_PASSWORD || "";

  // Webhook Configuration
  static readonly WEBHOOK_TIMEOUT = Number(
    process.env.WEBHOOK_TIMEOUT || 10000
  );

  // Retry Configuration
  static readonly MAX_RETRIES = Number(
    process.env.NOTIFICATION_MAX_RETRIES || 3
  );

  static readonly RETRY_DELAY = Number(
    process.env.NOTIFICATION_RETRY_DELAY || 5000
  );

  // Queue Configuration
  static readonly QUEUE_SIZE = Number(
    process.env.NOTIFICATION_QUEUE_SIZE || 100
  );
}