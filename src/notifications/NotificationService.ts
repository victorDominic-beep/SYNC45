import {
  Notification,
  NotificationStatus,
} from "./Notification";

export class NotificationService {
  private readonly notifications: Notification[] = [];

  async create(
    notification: Notification
  ): Promise<Notification> {
    this.notifications.push(notification);

    return notification;
  }

  async findById(
    id: string
  ): Promise<Notification | null> {
    const notification = this.notifications.find(
      (notification) => notification.id === id
    );

    return notification ?? null;
  }

  async findAll(): Promise<Notification[]> {
    return [...this.notifications];
  }

  async findByOrganization(
    organizationId: string
  ): Promise<Notification[]> {
    return this.notifications.filter(
      (notification) =>
        notification.organizationId === organizationId
    );
  }

  async updateStatus(
    id: string,
    status: NotificationStatus
  ): Promise<Notification | null> {
    const notification = await this.findById(id);

    if (!notification) {
      return null;
    }

    notification.status = status;

    if (status === NotificationStatus.SENT) {
      notification.sentAt = new Date();
    }

    return notification;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.notifications.findIndex(
      (notification) => notification.id === id
    );

    if (index === -1) {
      return false;
    }

    this.notifications.splice(index, 1);

    return true;
  }

  async getPendingNotifications(): Promise<Notification[]> {
    return this.notifications.filter(
      (notification) =>
        notification.status === NotificationStatus.PENDING
    );
  }

  async getFailedNotifications(): Promise<Notification[]> {
    return this.notifications.filter(
      (notification) =>
        notification.status === NotificationStatus.FAILED
    );
  }

  async retryFailedNotifications(): Promise<void> {
    const failedNotifications =
      await this.getFailedNotifications();

    for (const notification of failedNotifications) {
      notification.status = NotificationStatus.PENDING;
    }
  }
}