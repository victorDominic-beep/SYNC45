import { Request, Response, NextFunction } from "express";
import { UserService } from "./UserService";

interface UserParams {
  id: string;
}

export class UserController {
  constructor(
    private readonly userService: UserService
  ) {}

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.create(req.body);

      res.status(201).json({
        success: true,
        data: user,
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
      const users = await this.userService.findAll();

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  public findById = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.findById(req.params.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.update(
        req.params.id,
        req.body
      );

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public activate = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const activated = await this.userService.activate(
        req.params.id
      );

      if (!activated) {
        res.status(404).json({
          success: false,
          message: "User not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User activated successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deactivated = await this.userService.deactivate(
        req.params.id
      );

      if (!deactivated) {
        res.status(404).json({
          success: false,
          message: "User not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User deactivated successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (
    req: Request<UserParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.userService.delete(
        req.params.id
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "User not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };
}