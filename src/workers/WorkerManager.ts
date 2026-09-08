import { Worker, WorkerStatus } from "./Worker";
import { ReconciliationWorker, ReconciliationWorkItem } from "./ReconciliationWorker";

export class WorkerManager {
  private readonly workers: Map<string, Worker> = new Map();
  private readonly reconciliationWorker: ReconciliationWorker;

  constructor(reconciliationWorker: ReconciliationWorker) {
    this.reconciliationWorker = reconciliationWorker;
    this.registerWorker(reconciliationWorker);
  }

  public registerWorker(worker: Worker): void {
    this.workers.set(worker.id, worker);
  }

  public getWorker(id: string): Worker | undefined {
    return this.workers.get(id);
  }

  public getAllWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  public getWorkersByStatus(status: WorkerStatus): Worker[] {
    return this.getAllWorkers().filter((worker) => worker.status === status);
  }

  public async startAll(): Promise<void> {
    for (const worker of this.workers.values()) {
      if ("start" in worker && typeof worker.start === "function") {
        await worker.start();
      }
    }
  }

  public async stopAll(): Promise<void> {
    for (const worker of this.workers.values()) {
      if ("stop" in worker && typeof worker.stop === "function") {
        await worker.stop();
      }
    }
  }

  public async runReconciliation(
    workItem: ReconciliationWorkItem
  ): Promise<void> {
    await this.reconciliationWorker.run(workItem);
  }

  public markWorkerFailed(workerId: string, error: string): void {
    const worker = this.workers.get(workerId);

    if (!worker) {
      return;
    }

    worker.status = WorkerStatus.FAILED;
    worker.error = error;
  }
}