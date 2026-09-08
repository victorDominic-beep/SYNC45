import { Event } from "./Event";

export interface Publisher {
  publish<T>(event: Event<T>): Promise<void>;
}