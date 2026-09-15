import { PaystackConnector } from "../../connectors/payment/paystack/PaystackConnector";
import { MongoDBConnector } from "../../connectors/ledger/mongodb/MongoDBConnector";
import { PostgreSQLConnector } from "../../connectors/ledger/postgresql/PostgreSQLConnector";
import { MySQLConnector } from "../../connectors/ledger/mysql/MySQLConnector";

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
import { CSVConnector } from "../../connectors/ledger/excel/ExcelConnector";
import { OrganizationService } from "../../organizations/OrganizationService";
import { promises as fs } from "fs";
import { AppError } from "../../errors/AppError";
import { ErrorCode } from "../../errors/ErrorCode";

type LedgerSource = "mongodb" | "postgresql" | "mysql" | "excel" | "csv";

export interface ReconciliationRequest {
  organizationId: string;
  from: string;
  to: string;
  ledgerSource?: LedgerSource;
  csvFilePath?: string;
  csvFileId?: string;
}

export class ReconciliationService {
  constructor(
    private readonly aiInsightService: AIInsightService,
    private readonly reconciliationRepository: ReconciliationRepository,
    private readonly csvUploadRegistry?: Map<string, string>,
    private readonly organizationService?: OrganizationService
  ) {}

  async reconcile(
    request: ReconciliationRequest
  ): Promise<{
    report: ReconciliationReport;
    insights: Awaited<
      ReturnType<AIInsightService["generateInsights"]>
    >;
  }> {
    const requestedSource = request.ledgerSource;
    const filePath = request.csvFileId
      ? this.csvUploadRegistry?.get(request.csvFileId)
      : request.csvFilePath;

    let activePaystackConnector: PaystackConnector;
    let activeConnector: Connector;
    let activeSource: LedgerSource;
    let startedCsvConnector = false;

    // If an organization has stored new credentials, prefer the requested connector type
    // for that organization. If the request sends no ledgerSource override, the existing
    // environment configuration remains the default fallback.
    if (!request.organizationId || !requestedSource || !this.organizationService) {
      throw new AppError(
        "Organization and ledger source are required for reconciliation.",
        ErrorCode.INVALID_REQUEST,
        422
      );
    }

    const savedConnections =
      await this.organizationService.resolveConnectionConfig(request.organizationId);

    if (!savedConnections?.paystack?.secretKey) {
      throw new AppError(
        "Paystack connection is not configured for this organization.",
        ErrorCode.PAYMENT_CONNECTOR_FAILED,
        422
      );
    }

    activePaystackConnector = new PaystackConnector(savedConnections.paystack.secretKey);
    activeSource = requestedSource;

    switch (requestedSource) {
      case "mongodb":
        if (!savedConnections.mongodb?.uri) {
          throw new AppError("MongoDB connection is not configured for this organization.", ErrorCode.LEDGER_CONNECTOR_FAILED, 422);
        }
        activeConnector = new MongoDBConnector({
          uri: savedConnections.mongodb.uri,
          database: savedConnections.mongodb.database || "sync45",
          collection: savedConnections.mongodb.collection || "transactions",
        });
        break;
      case "postgresql":
        if (!savedConnections.postgresql?.password) {
          throw new AppError("PostgreSQL ledger connection is not configured for this organization.", ErrorCode.LEDGER_CONNECTOR_FAILED, 422);
        }
        activeConnector = new PostgreSQLConnector({
          host: savedConnections.postgresql.host || "localhost",
          port: savedConnections.postgresql.port || 5432,
          database: savedConnections.postgresql.database || "sync45",
          user: savedConnections.postgresql.user || "postgres",
          password: savedConnections.postgresql.password,
          table: savedConnections.postgresql.table || "transactions",
        });
        break;
      case "mysql":
        if (!savedConnections.mysql?.password) {
          throw new AppError("MySQL connection is not configured for this organization.", ErrorCode.LEDGER_CONNECTOR_FAILED, 422);
        }
        activeConnector = new MySQLConnector({
          host: savedConnections.mysql.host || "localhost",
          port: savedConnections.mysql.port || 3306,
          database: savedConnections.mysql.database || "sync45",
          user: savedConnections.mysql.user || "root",
          password: savedConnections.mysql.password,
          table: savedConnections.mysql.table || "transactions",
        });
        break;
      case "excel":
        throw new AppError(
          "Global Excel files are not organization-isolated and cannot be used for organization reconciliation.",
          ErrorCode.LEDGER_CONNECTOR_FAILED,
          422
        );
      case "csv":
        if (!filePath) {
          throw new AppError(
            "CSV ledger file reference is required when ledgerSource is csv.",
            ErrorCode.INVALID_REQUEST,
            422
          );
        }
        activeConnector = new CSVConnector({ filePath: filePath || "" });
        activeSource = "csv";
        startedCsvConnector = true;
        break;
      default:
        throw new AppError("Unsupported ledger source.", ErrorCode.INVALID_REQUEST, 422);
    }

    await activeConnector.connect();

    try {
      const rawPaystackTransactions =
        await activePaystackConnector.fetchTransactions({
          from: request.from,
          to: request.to,
        });

      const rawLedgerTransactions =
        await activeConnector.fetchTransactions();

      const paymentTransactions = rawPaystackTransactions.map(
        (transaction: any) =>
          TransactionNormalizer.fromPaystack(transaction)
      );

      const ledgerTransactions = rawLedgerTransactions.map(
        (transaction: any) => {
          switch (activeSource) {
            case "mongodb":
              return TransactionNormalizer.fromMongo(transaction);
            case "postgresql":
              return TransactionNormalizer.fromPostgreSQL(transaction);
            case "mysql":
              return TransactionNormalizer.fromMySQL(transaction);
            case "excel":
              return TransactionNormalizer.fromExcel(transaction);
            case "csv":
              return TransactionNormalizer.fromCSV(transaction);
            default:
              throw new Error(
                `Unsupported ledger source: ${activeSource}`
              );
          }
        }
      );

      const { matched, discrepancies } =
        TransactionMatcher.match(
          paymentTransactions,
          ledgerTransactions
        );

      const classifiedDiscrepancies: ClassifiedDiscrepancy[] =
        DiscrepancyClassifier.classify(discrepancies);

      const report = ReportGenerator.generate(
        request.organizationId,
        matched,
        classifiedDiscrepancies
      );

      const insights =
        await this.aiInsightService.generateInsights(report);

      await this.reconciliationRepository.create(report);

      return {
        report,
        insights,
      };
    } finally {
      await activeConnector.disconnect();
      if (startedCsvConnector && filePath) {
        try {
          await fs.unlink(filePath);
        } catch {
          // uploaded CSV can already be removed by the environment
        }
      }
    }
  }
}