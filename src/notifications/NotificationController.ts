import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./NotificationService";
import { NotificationStatus } from "./Notification";

interface NotificationParams {
  id: string;
}

export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService
  ) {}

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notification =
        await this.notificationService.create(req.body);

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  public findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notifications =
        await this.notificationService.findAll();

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  public findById = async (
    req: Request<NotificationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notification =
        await this.notificationService.findById(
          req.params.id
        );

      if (!notification) {
        res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (
    req: Request<NotificationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status } = req.body;

      const notification =
        await this.notificationService.updateStatus(
          req.params.id,
          status as NotificationStatus
        );

      if (!notification) {
        res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  public getPending = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notifications =
        await this.notificationService.getPendingNotifications();

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  public getFailed = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notifications =
        await this.notificationService.getFailedNotifications();

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  public retryFailed = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.notificationService.retryFailedNotifications();

      res.status(200).json({
        success: true,
        message: "Failed notifications queued for retry.",
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (
    req: Request<NotificationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted =
        await this.notificationService.delete(
          req.params.id
        );

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Notification not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };
}