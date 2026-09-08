export interface Event<T = any> {
  id: string;

  name: string;

  occurredAt: Date;

  payload: T;
}