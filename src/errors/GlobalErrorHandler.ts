import { Request, Response, NextFunction } from "express";

import { AppError } from "./AppError";
import { ErrorCode } from "./ErrorCode";

import { AuditService } from "../audit/AuditService";

const auditService = new AuditService();

export class GlobalErrorHandler {
  public static handle(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const correlationId = crypto.randomUUID();

    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({
        success: false,
        code: "ERR-4000",
        correlationId,
        message: "Invalid JSON request body.",
      });
      return;
    }

    if (error instanceof AppError) {
      auditService.recordEvent(
        "SYSTEM",
        error.code as any,
        "ERROR" as any,
        error.message,
        {
          correlationId,
          endpoint: req.originalUrl,
          method: req.method,
          metadata: error.metadata
        }
      );

      res.status(error.statusCode).json({
        success: false,
        code: error.code,
        correlationId,
        message: error.message,
      });

      return;
    }

    auditService.recordEvent(
      "SYSTEM",
      ErrorCode.INTERNAL_SERVER_ERROR as any,
      "CRITICAL" as any,
      error.message,
      {
        correlationId,
        endpoint: req.originalUrl,
        method: req.method,
        stack: error.stack
      }
    );

    res.status(500).json({
      success: false,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      correlationId,
      message:
        "An unexpected error occurred."
    });
  }
}