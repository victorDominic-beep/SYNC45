import { Request, Response, NextFunction } from "express";

export class AIRequestValidator {
  static validate(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const { reportId } = req.body;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: "reportId is required.",
      });
      return;
    }

    next();
  }
}