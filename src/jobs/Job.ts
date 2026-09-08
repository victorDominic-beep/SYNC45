export enum JobStatus {
  PENDING = "PENDING",
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

export interface Job {
  id: string;

  organizationId: string;

  type: string;

  status: JobStatus;

  createdAt: Date;

  startedAt?: Date;

  completedAt?: Date;

  error?: string;

  metadata?: Record<string, any>;
}