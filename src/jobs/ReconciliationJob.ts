import { v4 as uuidv4 } from "uuid";

import { Job, JobStatus } from "./Job";

import { ReconciliationService } from "../reconciliation/services/ReconciliationService";

import { AuditService } from "../audit/AuditService";

import { EventPublisher } from "../events/EventPublisher";

import { ReconciliationEventPayload } from "../events/ReconciliationEvents";

export class ReconciliationJob {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly auditService: AuditService,
    private readonly eventPublisher: EventPublisher
  ) {}

  public async execute(
    organizationId: string,
    from: string,
    to: string,
    metadata?: Record<string, any>
  ): Promise<Job> {
    const job: Job = {
      id: uuidv4(),
      organizationId,
      type: "RECONCILIATION",
      status: JobStatus.PENDING,
      createdAt: new Date(),
      metadata,
    };

    const eventPayload: ReconciliationEventPayload = {
      organizationId,
      reconciliationId: job.id,
      timestamp: new Date(),
      metadata,
    };

    try {
      job.status = JobStatus.RUNNING;
      job.startedAt = new Date();

      this.auditService.reconciliationStarted(
        organizationId,
        metadata
      );

      await this.eventPublisher.reconciliationStarted(
        eventPayload
      );

      // Run reconciliation
      const report =
        await this.reconciliationService.reconcile({
          organizationId,
          from,
          to,
        });

      // Store report for later access
      job.metadata = {
        ...metadata,
        report,
      };

      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();

      this.auditService.reconciliationCompleted(
        organizationId,
        metadata
      );

      await this.eventPublisher.reconciliationCompleted(
        eventPayload
      );

      return job;
    } catch (error) {
      job.status = JobStatus.FAILED;
      job.completedAt = new Date();

      job.error =
        error instanceof Error
          ? error.message
          : "Unknown reconciliation failure.";

      this.auditService.reconciliationFailed(
        organizationId,
        job.error,
        metadata
      );

      await this.eventPublisher.reconciliationFailed(
        eventPayload
      );

      throw error;
    }
  }
}