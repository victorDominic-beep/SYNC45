import { PaystackConnector } from "../../connectors/payment/paystack/PaystackConnector";
//import { MongoDBConnector } from "../../connectors/ledger/mongodb/MongoDBConnector";

import { TransactionNormalizer } from "../normalizers/TransactionNormalizer";
import { TransactionMatcher } from "../matcher/TransactionMatcher";
import {
  ClassifiedDiscrepancy,
  DiscrepancyClassifier,
} from "../classifier/DiscrepancyClassifier";
import { ReportGenerator } from "../report/ReportGenerator";
import { ReconciliationReport } from "../../shared/types/ReconciliationReport";
import { AIInsightService } from "../../ai/services/AIInsightService";
import { Connector } from "../../shared/interfaces/Connector";
import { ReconciliationRepository } from "../../repositories/ReconciliationRepository";

type LedgerSource = "mongodb" | "postgresql" | "mysql" | "excel";

export interface ReconciliationRequest {
  organizationId: string;
  from: string;
  to: string;
}

export class ReconciliationService {
  constructor(
    private readonly paystackConnector: PaystackConnector,
    private readonly ledgerConnector: Connector,
    private readonly ledgerSource: LedgerSource,
    private readonly aiInsightService: AIInsightService,
    private readonly reconciliationRepository: ReconciliationRepository
  ) {}

  async reconcile(
    request: ReconciliationRequest
  ): Promise<{
    report: ReconciliationReport;
    insights: Awaited<
      ReturnType<AIInsightService["generateInsights"]>
    >;
  }> {
    await this.ledgerConnector.connect();

    try {
      // Fetch Paystack transactions
      const rawPaystackTransactions =
        await this.paystackConnector.fetchTransactions({
          from: request.from,
          to: request.to,
        });

      // Fetch ledger transactions
      const rawLedgerTransactions =
        await this.ledgerConnector.fetchTransactions();

      // Normalize transactions
      const paymentTransactions = rawPaystackTransactions.map(
        (transaction: any) =>
          TransactionNormalizer.fromPaystack(transaction)
      );

      // Normalize ledger transactions based on source
      const ledgerTransactions = rawLedgerTransactions.map(
        (transaction: any) => {
          switch (this.ledgerSource) {
            case "mongodb":
              return TransactionNormalizer.fromMongo(transaction);
            case "postgresql":
              return TransactionNormalizer.fromPostgreSQL(transaction);
            case "mysql":
              return TransactionNormalizer.fromMySQL(transaction);
            case "excel":
              return TransactionNormalizer.fromExcel(transaction);
            default:
              throw new Error(
                `Unsupported ledger source: ${this.ledgerSource}`
              );
          }
        }
      );

      // Match transactions
      const { matched, discrepancies } =
        TransactionMatcher.match(
          paymentTransactions,
          ledgerTransactions
        );

      // Classify discrepancies
      const classifiedDiscrepancies: ClassifiedDiscrepancy[] =
        DiscrepancyClassifier.classify(discrepancies);

      // Generate report
      const report = ReportGenerator.generate(
        request.organizationId,
        matched,
        classifiedDiscrepancies
      );

      // Generate AI insights
      const insights =
        await this.aiInsightService.generateInsights(report);

      await this.reconciliationRepository.create(report);

      return {
        report,
        insights,
      };
    } finally {
      await this.ledgerConnector.disconnect();
    }
  }
}