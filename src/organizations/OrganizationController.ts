import { Request, Response, NextFunction } from "express";

import { OrganizationService } from "./OrganizationService";
interface OrganizationParams {
  id: string;
}

export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService
  ) {}

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const organization =
        await this.organizationService.create(req.body);

      res.status(201).json({
        success: true,
        data: organization,
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
      const organizations =
        await this.organizationService.findAll();

      res.status(200).json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      next(error);
    }
  };

  public findById = async (
    req: Request<OrganizationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const organization =
        await this.organizationService.findById(req.params.id);

      if (!organization) {
        res.status(404).json({
          success: false,
          message: "Organization not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (
    req: Request<OrganizationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const organization =
        await this.organizationService.update(
          req.params.id,
          req.body
        );

      if (!organization) {
        res.status(404).json({
          success: false,
          message: "Organization not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  public saveConnections = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const organizationId =
        req.params.id || req.body.organizationId || req.body.organization;

      const body = req.body.connections ?? req.body;

      const organization =
        await this.organizationService.saveConnections(
          organizationId,
          body
        );

      if (!organization) {
        res.status(404).json({
          success: false,
          message: "Organization not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: organization.connections,
      });
    } catch (error) {
      next(error);
    }
  };

  public getConnections = async (
    req: Request<OrganizationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const connections =
        await this.organizationService.getConnections(
          req.params.id
        );

      if (!connections) {
        res.status(200).json({
          success: true,
          data: {},
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: connections,
      });
    } catch (error) {
      next(error);
    }
  };

  public activate = async (
    req: Request<OrganizationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const activated =
        await this.organizationService.activate(req.params.id);

      if (!activated) {
        res.status(404).json({
          success: false,
          message: "Organization not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Organization activated successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (
    req: Request<OrganizationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deactivated =
        await this.organizationService.deactivate(req.params.id);

      if (!deactivated) {
        res.status(404).json({
          success: false,
          message: "Organization not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Organization deactivated successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (
    req: Request<OrganizationParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted =
        await this.organizationService.delete(req.params.id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Organization not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Organization deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };
}