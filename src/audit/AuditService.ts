import { v4 as uuidv4 } from "uuid";

import { AuditLogger } from "./AuditLogger";
import {
  AuditEventType,
  AuditSeverity,
  AuditLog,
} from "./AuditTypes";

export class AuditService {
  private readonly auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = new AuditLogger();
  }

  public recordEvent(
    organizationId: string,
    event: AuditEventType,
    severity: AuditSeverity,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const auditLog: AuditLog = {
      id: uuidv4(),
      organizationId,
      event,
      severity,
      message,
      timestamp: new Date(),
      metadata,
    };

    this.auditLogger.log(auditLog);
  }

  public reconciliationStarted(
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    this.recordEvent(
      organizationId,
      AuditEventType.RECONCILIATION_STARTED,
      AuditSeverity.INFO,
      "Reconciliation process started.",
      metadata
    );
  }

  public reconciliationCompleted(
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    this.recordEvent(
      organizationId,
      AuditEventType.RECONCILIATION_COMPLETED,
      AuditSeverity.INFO,
      "Reconciliation completed successfully.",
      metadata
    );
  }

  public reconciliationFailed(
    organizationId: string,
    error: string,
    metadata?: Record<string, any>
  ): void {
    this.recordEvent(
      organizationId,
      AuditEventType.RECONCILIATION_FAILED,
      AuditSeverity.ERROR,
      error,
      metadata
    );
  }

  public discrepancyDetected(
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    this.recordEvent(
      organizationId,
      AuditEventType.DISCREPANCY_DETECTED,
      AuditSeverity.WARNING,
      "Discrepancy detected.",
      metadata
    );
  }

  public reportGenerated(
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    this.recordEvent(
      organizationId,
      AuditEventType.REPORT_GENERATED,
      AuditSeverity.INFO,
      "Reconciliation report generated.",
      metadata
    );
  }
}