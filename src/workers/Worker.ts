export enum WorkerStatus {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  FAILED = "FAILED",
}

export interface Worker {
  id: string;
  name: string;
  status: WorkerStatus;
  startedAt?: Date;
  stoppedAt?: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}