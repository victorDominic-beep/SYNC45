import { EventBus } from "./EventBus";
import {
  ReconciliationEvent,
  ReconciliationEventPayload,
} from "./ReconciliationEvents";

export class EventPublisher {
  constructor(private readonly eventBus: EventBus) {}

  public async publish(
    event: ReconciliationEvent,
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.eventBus.publish(event, payload);
  }

  public async reconciliationStarted(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.RECONCILIATION_STARTED,
      payload
    );
  }

  public async paymentTransactionsFetched(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.PAYMENT_TRANSACTIONS_FETCHED,
      payload
    );
  }

  public async ledgerTransactionsFetched(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.LEDGER_TRANSACTIONS_FETCHED,
      payload
    );
  }

  public async transactionsNormalized(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.TRANSACTIONS_NORMALIZED,
      payload
    );
  }

  public async transactionsMatched(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.TRANSACTIONS_MATCHED,
      payload
    );
  }

  public async discrepanciesDetected(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.DISCREPANCIES_DETECTED,
      payload
    );
  }

  public async reportGenerated(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.REPORT_GENERATED,
      payload
    );
  }

  public async reconciliationCompleted(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.RECONCILIATION_COMPLETED,
      payload
    );
  }

  public async reconciliationFailed(
    payload: ReconciliationEventPayload
  ): Promise<void> {
    await this.publish(
      ReconciliationEvent.RECONCILIATION_FAILED,
      payload
    );
  }
}