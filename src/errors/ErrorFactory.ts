import { AppError } from "./AppError";
import { ErrorCode } from "./ErrorCode";

export class ErrorFactory {
  public static badRequest(
    message = "Invalid request.",
    metadata?: Record<string, any>
  ): AppError {
    return new AppError(
      message,
      ErrorCode.INVALID_REQUEST,
      400,
      metadata
    );
  }

  public static unauthorized(
    message = "Unauthorized."
  ): AppError {
    return new AppError(
      message,
      ErrorCode.UNAUTHORIZED,
      401
    );
  }

  public static forbidden(
    message = "Forbidden."
  ): AppError {
    return new AppError(
      message,
      ErrorCode.FORBIDDEN,
      403
    );
  }

  public static internal(
    message = "Internal server error.",
    metadata?: Record<string, any>
  ): AppError {
    return new AppError(
      message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      metadata
    );
  }

  public static connectorFailure(
    message: string,
    metadata?: Record<string, any>
  ): AppError {
    return new AppError(
      message,
      ErrorCode.PAYMENT_CONNECTOR_FAILED,
      500,
      metadata
    );
  }

  public static databaseFailure(
    message: string,
    metadata?: Record<string, any>
  ): AppError {
    return new AppError(
      message,
      ErrorCode.DATABASE_CONNECTION_FAILED,
      500,
      metadata
    );
  }

  public static reconciliationFailure(
    message: string,
    metadata?: Record<string, any>
  ): AppError {
    return new AppError(
      message,
      ErrorCode.MATCHING_FAILED,
      500,
      metadata
    );
  }
}