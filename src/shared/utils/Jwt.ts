import jwt from "jsonwebtoken";

export class Jwt {
  static readonly JWT_SECRET =
    process.env.JWT_SECRET || "sync45-local-dev-secret-change-me";

  static sign(payload: Record<string, unknown>): string {
    return jwt.sign(payload, Jwt.JWT_SECRET, {
      expiresIn: "7d",
    });
  }

  static verify(token: string): Record<string, unknown> {
    return jwt.verify(token, Jwt.JWT_SECRET) as Record<string, unknown>;
  }
}
