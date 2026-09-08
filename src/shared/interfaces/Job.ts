export interface Job {
  execute(...args: any[]): Promise<void>;
}