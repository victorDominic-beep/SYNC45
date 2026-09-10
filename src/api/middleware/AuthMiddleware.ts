import { Request, Response, NextFunction } from "express";
import { Jwt } from "../../shared/utils/Jwt";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
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
    req.user = payload as any;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}
