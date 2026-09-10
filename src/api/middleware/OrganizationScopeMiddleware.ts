import { Request, Response, NextFunction } from "express";

export function requireOrganizationScope(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const routeOrganizationId = String(
      req.params.id ||
        req.body?.organizationId ||
        req.body?.organization ||
        ""
    ).trim();

    const tokenOrganizationId = String(
      req.user?.organizationId || ""
    ).trim();

    if (!routeOrganizationId) {
      next();
      return;
    }

    if (!tokenOrganizationId || tokenOrganizationId !== routeOrganizationId) {
      res.status(403).json({
        success: false,
        message: "You do not have access to this organization.",
      });
      return;
    }

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Unauthorized organization scope.",
    });
  }
}
