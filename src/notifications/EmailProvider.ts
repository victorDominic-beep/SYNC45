import { Notification } from "./Notification";
import { NotificationProvider } from "./NotificationProvider";

export class EmailProvider implements NotificationProvider {
  async send(
    notification: Notification
  ): Promise<boolean> {
    try {
      console.log("====================================");
      console.log("Sending Email Notification");
      console.log("To:", notification.recipient);
      console.log("Subject:", notification.subject);
      console.log("Message:", notification.message);
      console.log("====================================");

      return true;
    } catch (error) {
      console.error(
        "Failed to send email notification.",
        error
      );

      return false;
    }
  }
}