import { Worker, WorkerStatus } from "./Worker";
import { WorkerManager } from "./WorkerManager";

export interface WorkerHealthReport {
  totalWorkers: number;
  idleWorkers: number;
  runningWorkers: number;
  stoppedWorkers: number;
  failedWorkers: number;
  workers: Worker[];
}

export class WorkerMonitor {
  constructor(private readonly workerManager: WorkerManager) {}

  public getHealthReport(): WorkerHealthReport {
    const workers = this.workerManager.getAllWorkers();

    return {
      totalWorkers: workers.length,
      idleWorkers: workers.filter(
        (worker) => worker.status === WorkerStatus.IDLE
      ).length,
      runningWorkers: workers.filter(
        (worker) => worker.status === WorkerStatus.RUNNING
      ).length,
      stoppedWorkers: workers.filter(
        (worker) => worker.status === WorkerStatus.STOPPED
      ).length,
      failedWorkers: workers.filter(
        (worker) => worker.status === WorkerStatus.FAILED
      ).length,
      workers,
    };
  }

  public getFailedWorkers(): Worker[] {
    return this.workerManager.getWorkersByStatus(WorkerStatus.FAILED);
  }

  public getRunningWorkers(): Worker[] {
    return this.workerManager.getWorkersByStatus(WorkerStatus.RUNNING);
  }

  public getIdleWorkers(): Worker[] {
    return this.workerManager.getWorkersByStatus(WorkerStatus.IDLE);
  }
}