import { Request, Response, NextFunction } from "express";

export class AIRequestValidator {
  static validate(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const { report } = req.body;

    if (!report) {
      res.status(400).json({
        success: false,
        message: "Reconciliation report is required.",
      });
      return;
    }

    next();
  }
}