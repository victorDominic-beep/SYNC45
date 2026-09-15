import { Request, Response, NextFunction } from "express";
import { Jwt } from "../../shared/utils/Jwt";
import { PostgresRepository } from "../../repositories/PostgresRepository";

export function requireAuth(
  postgresRepository: PostgresRepository,
  options: { allowInactiveOrganization?: boolean } = {}
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = String(authHeader).startsWith("Bearer ")
        ? String(authHeader).replace("Bearer ", "")
        : String(req.headers["x-auth-token"] || "");

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Authentication token is required.",
        });
        return;
      }

      const payload = Jwt.verify(token);
      const userId = String(payload.sub || "");
      const tokenOrganizationId = String(payload.organizationId || "");
      const user = userId ? await postgresRepository.findUserById(userId) : null;
      const organization = user
        ? await postgresRepository.findOrganizationById(user.organization_id)
        : null;

      if (!user || user.is_active === false) {
        res.status(401).json({
          success: false,
          message: "User account is inactive or no longer exists.",
        });
        return;
      }

      if (
        !organization ||
        (!options.allowInactiveOrganization && organization.is_active === false) ||
        user.organization_id !== tokenOrganizationId
      ) {
        res.status(403).json({
          success: false,
          message: "Organization is inactive or no longer exists.",
        });
        return;
      }

      req.user = {
        ...payload,
        sub: user.id,
        email: user.email,
        organizationId: user.organization_id,
        role: user.role,
      };
      next();
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  };
}
