import { JobQueue } from "./JobQueue";
import { Job, JobStatus } from "./Job";

export class JobScheduler {
  constructor(private readonly jobQueue: JobQueue) {}

  public async execute(
    jobId: string,
    handler: (job: Job) => Promise<void>
  ): Promise<void> {
    const job = this.jobQueue.get(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found.`);
    }

    try {
      this.jobQueue.updateStatus(job.id, JobStatus.RUNNING);

      await handler(job);

      this.jobQueue.updateStatus(
        job.id,
        JobStatus.COMPLETED
      );
    } catch (error) {
      this.jobQueue.fail(
        job.id,
        error instanceof Error
          ? error.message
          : "Unknown job failure."
      );

      throw error;
    }
  }

  public async executePending(
    handler: (job: Job) => Promise<void>
  ): Promise<void> {
    const pendingJobs = this.jobQueue.getByStatus(
      JobStatus.QUEUED
    );

    for (const job of pendingJobs) {
      await this.execute(job.id, handler);
    }
  }
}