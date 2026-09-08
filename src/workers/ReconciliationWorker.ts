import { v4 as uuidv4 } from "uuid";

import { Worker, WorkerStatus } from "./Worker";
import { ReconciliationJob } from "../jobs/ReconciliationJob";

export interface ReconciliationWorkItem {
  organizationId: string;
  from: string;
  to: string;
  metadata?: Record<string, any>;
}

export class ReconciliationWorker implements Worker {
  id: string;
  name: string;
  status: WorkerStatus;
  startedAt?: Date;
  stoppedAt?: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
  error?: string;
  metadata?: Record<string, any>;

  private readonly reconciliationJob: ReconciliationJob;

  constructor(reconciliationJob: ReconciliationJob, name = "ReconciliationWorker") {
    this.id = uuidv4();
    this.name = name;
    this.status = WorkerStatus.IDLE;
    this.reconciliationJob = reconciliationJob;
  }

  async start(): Promise<void> {
    this.status = WorkerStatus.RUNNING;
    this.startedAt = new Date();
  }

  async stop(): Promise<void> {
    this.status = WorkerStatus.STOPPED;
    this.stoppedAt = new Date();
  }

  async run(workItem: ReconciliationWorkItem): Promise<void> {
    try {
      this.status = WorkerStatus.RUNNING;
      this.lastRunAt = new Date();
      this.error = undefined;

      await this.reconciliationJob.execute(
        workItem.organizationId,
        workItem.from,
        workItem.to,
        workItem.metadata
      );
    } catch (error) {
      this.status = WorkerStatus.FAILED;
      this.error = error instanceof Error ? error.message : "Unknown worker failure.";
      throw error;
    } finally {
      if (this.status !== WorkerStatus.FAILED) {
        this.status = WorkerStatus.IDLE;
      }
    }
  }
}