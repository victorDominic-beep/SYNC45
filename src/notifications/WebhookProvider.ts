import axios from "axios";

import { Notification } from "./Notification";
import { NotificationProvider } from "./NotificationProvider";

export class WebhookProvider implements NotificationProvider {
  constructor(private readonly webhookUrl: string) {}

  async send(
    notification: Notification
  ): Promise<boolean> {
    try {
      await axios.post(this.webhookUrl, {
        id: notification.id,
        organizationId: notification.organizationId,
        subject: notification.subject,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
        metadata: notification.metadata,
      });

      console.log(
        `Webhook notification sent to ${this.webhookUrl}`
      );

      return true;
    } catch (error) {
      console.error(
        "Failed to send webhook notification.",
        error
      );

      return false;
    }
  }
}