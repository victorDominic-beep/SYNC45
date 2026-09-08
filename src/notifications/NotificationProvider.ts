import { Notification } from "./Notification";

export interface NotificationProvider {
  send(
    notification: Notification
  ): Promise<boolean>;
}