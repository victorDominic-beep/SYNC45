import { Request, Response, NextFunction } from "express";

export class ReconciliationValidator {
  static validate(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const { organizationId, from, to } = req.body;

    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: "organizationId is required.",
      });
      return;
    }

    if (!from) {
      res.status(400).json({
        success: false,
        message: "from date is required.",
      });
      return;
    }

    if (!to) {
      res.status(400).json({
        success: false,
        message: "to date is required.",
      });
      return;
    }

    if (isNaN(Date.parse(from))) {
      res.status(400).json({
        success: false,
        message: "Invalid 'from' date.",
      });
      return;
    }

    if (isNaN(Date.parse(to))) {
      res.status(400).json({
        success: false,
        message: "Invalid 'to' date.",
      });
      return;
    }

    if (new Date(from) > new Date(to)) {
      res.status(400).json({
        success: false,
        message: "'from' date cannot be after 'to' date.",
      });
      return;
    }

    next();
  }
}