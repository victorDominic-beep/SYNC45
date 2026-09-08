import { Job, JobStatus } from "./Job";

export class JobQueue {
  private readonly jobs: Map<string, Job> = new Map();

  public add(job: Job): void {
    job.status = JobStatus.QUEUED;
    this.jobs.set(job.id, job);
  }

  public get(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  public getAll(): Job[] {
    return Array.from(this.jobs.values());
  }

  public getByStatus(status: JobStatus): Job[] {
    return this.getAll().filter(
      (job) => job.status === status
    );
  }

  public updateStatus(
    jobId: string,
    status: JobStatus
  ): void {
    const job = this.jobs.get(jobId);

    if (!job) {
      return;
    }

    job.status = status;

    switch (status) {
      case JobStatus.RUNNING:
        job.startedAt = new Date();
        break;

      case JobStatus.COMPLETED:
      case JobStatus.FAILED:
      case JobStatus.CANCELLED:
        job.completedAt = new Date();
        break;
    }
  }

  public fail(
    jobId: string,
    error: string
  ): void {
    const job = this.jobs.get(jobId);

    if (!job) {
      return;
    }

    job.status = JobStatus.FAILED;
    job.error = error;
    job.completedAt = new Date();
  }

  public remove(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  public clear(): void {
    this.jobs.clear();
  }

  public size(): number {
    return this.jobs.size;
  }
}