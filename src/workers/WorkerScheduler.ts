import { WorkerManager } from "./WorkerManager";
import { ReconciliationWorkItem } from "./ReconciliationWorker";

export class WorkerScheduler {
  private readonly pendingWorkItems: ReconciliationWorkItem[] = [];
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly workerManager: WorkerManager,
    private readonly intervalMs = 10000
  ) {}

  enqueue(workItem: ReconciliationWorkItem): void {
    this.pendingWorkItems.push(workItem);
  }

  getQueueSize(): number {
    return this.pendingWorkItems.length;
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this.processNext();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
  }

  private async processNext(): Promise<void> {
    const workItem = this.pendingWorkItems.shift();

    if (!workItem) {
      return;
    }

    try {
      await this.workerManager.runReconciliation(workItem);
    } catch (error) {
      console.error("WorkerScheduler failed to process work item:", error);
    }
  }
}