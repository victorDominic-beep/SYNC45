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
      res.status(403).json({
        success: false,
        message: "Organization creation is only available during registration.",
      });
    } catch (error) {
      next(error);
    }
  };

  public findAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const organizationId = String(req.user?.organizationId || "");
      const organization = await this.organizationService.findById(organizationId);

      res.status(200).json({
        success: true,
        data: organization ? [organization] : [],
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
      const tokenOrganizationId = String(req.user?.organizationId || "");
      const requestedOrganizationId =
        req.params.id || req.body.organizationId || req.body.organization || tokenOrganizationId;

      if (requestedOrganizationId !== tokenOrganizationId) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this organization.",
        });
        return;
      }

      const body = req.body.connections ?? req.body;

      const organization =
        await this.organizationService.saveConnections(
          tokenOrganizationId,
          body
        );

      if (!organization) {
        res.status(404).json({
          success: false,
          message: "Organization not found.",
        });
        return;
      }

      const connections = await this.organizationService.getConnections(tokenOrganizationId);

      res.status(200).json({
        success: true,
        message: "Connections saved successfully.",
        data: connections || {},
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