import { ReconciliationEvent } from "./ReconciliationEvents";

export type EventHandler = (payload: any) => void | Promise<void>;

export class EventBus {
  private readonly handlers: Map<
    ReconciliationEvent,
    EventHandler[]
  > = new Map();

  public subscribe(
    event: ReconciliationEvent,
    handler: EventHandler
  ): void {
    const existingHandlers = this.handlers.get(event) ?? [];

    existingHandlers.push(handler);

    this.handlers.set(event, existingHandlers);
  }

  public async publish(
    event: ReconciliationEvent,
    payload: any
  ): Promise<void> {
    const handlers = this.handlers.get(event);

    if (!handlers || handlers.length === 0) {
      return;
    }

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(
          `Event handler failed for ${event}:`,
          error
        );
      }
    }
  }

  public unsubscribe(
    event: ReconciliationEvent,
    handler: EventHandler
  ): void {
    const handlers = this.handlers.get(event);

    if (!handlers) {
      return;
    }

    this.handlers.set(
      event,
      handlers.filter(
        (registeredHandler) => registeredHandler !== handler
      )
    );
  }

  public clear(): void {
    this.handlers.clear();
  }
}