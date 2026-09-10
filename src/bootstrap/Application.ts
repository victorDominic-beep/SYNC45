import { PaystackConnector } from "../connectors/payment/paystack/PaystackConnector";
import { MongoDBConnector } from "../connectors/ledger/mongodb/MongoDBConnector";
import { PostgreSQLConnector } from "../connectors/ledger/postgresql/PostgreSQLConnector";
import { MySQLConnector } from "../connectors/ledger/mysql/MySQLConnector";
import { ExcelConnector } from "../connectors/ledger/excel/ExcelConnector";
import { Connector } from "../shared/interfaces/Connector";

import { AuditService } from "../audit/AuditService";
import { EventPublisher } from "../events/EventPublisher";

import { ReconciliationService } from "../reconciliation/services/ReconciliationService";
import { ReconciliationJob } from "../jobs/ReconciliationJob";

import { ReconciliationController } from "../api/controllers/ReconciliationController";
import { DatabaseConfig } from "../config/DatabaseConfig";
import { EventBus } from "../events/EventBus";
import { ConnectorConfig } from "../config/ConnectorConfig";
import { GroqProvider } from "../ai/providers/GroqProvider";
import { AIInsightService } from "../ai/services/AIInsightService";
import { AIController } from "../ai/controllers/AIController";
import { ReconciliationRepository } from "../repositories/ReconciliationRepository";
import { OrganizationController } from "../organizations/OrganizationController";
import { OrganizationService } from "../organizations/OrganizationService";

type LedgerSource = "mongodb" | "postgresql" | "mysql" | "excel";

export class Application {
  public readonly reconciliationController: ReconciliationController;
  public readonly reconciliationJob: ReconciliationJob;
  public readonly reconciliationService: ReconciliationService;
  public readonly aiController: AIController;
  public readonly aiInsightService: AIInsightService;
  public readonly reconciliationRepository: ReconciliationRepository;
  public readonly paystackConnector: PaystackConnector;
  public readonly ledgerConnector: Connector;
  public readonly csvUploadRegistry = new Map<string, string>();
  public readonly organizationService: OrganizationService;
  public readonly organizationController: OrganizationController;

  constructor() {
    // Connectors
    const paystackConnector = new PaystackConnector(
      ConnectorConfig.PAYSTACK_SECRET_KEY
    );

    // Select ledger connector based on LEDGER_SOURCE
    const ledgerSource: LedgerSource = (
      ConnectorConfig.LEDGER_SOURCE as LedgerSource
    ) || "mongodb";

    let ledgerConnector: Connector;

    switch (ledgerSource) {
      case "mongodb":
        ledgerConnector = new MongoDBConnector({
          uri: DatabaseConfig.URI,
          database: DatabaseConfig.DATABASE,
          collection: DatabaseConfig.COLLECTION,
        });
        break;
      case "postgresql":
        ledgerConnector = new PostgreSQLConnector({
          host: ConnectorConfig.POSTGRESQL_HOST,
          port: ConnectorConfig.POSTGRESQL_PORT,
          database: ConnectorConfig.POSTGRESQL_DATABASE,
          user: ConnectorConfig.POSTGRESQL_USER,
          password: ConnectorConfig.POSTGRESQL_PASSWORD,
          table: ConnectorConfig.POSTGRESQL_TABLE,
        });
        break;
      case "mysql":
        ledgerConnector = new MySQLConnector({
          host: ConnectorConfig.MYSQL_HOST,
          port: ConnectorConfig.MYSQL_PORT,
          database: ConnectorConfig.MYSQL_DATABASE,
          user: ConnectorConfig.MYSQL_USER,
          password: ConnectorConfig.MYSQL_PASSWORD,
          table: ConnectorConfig.MYSQL_TABLE,
        });
        break;
      case "excel":
        ledgerConnector = new ExcelConnector({
          filePath: ConnectorConfig.EXCEL_FILE_PATH,
          sheetName: ConnectorConfig.EXCEL_SHEET_NAME,
        });
        break;
      default:
        throw new Error(
          `Unsupported ledger source: ${ledgerSource}`
        );
    }

    // Organization connection persistence service and controller
    this.organizationService = new OrganizationService();
    this.organizationController = new OrganizationController(
      this.organizationService
    );

    // Infrastructure
    this.paystackConnector = paystackConnector;
    this.ledgerConnector = ledgerConnector;
    this.reconciliationRepository = new ReconciliationRepository();
    const auditService = new AuditService();

    const eventBus = new EventBus();

    const eventPublisher = new EventPublisher(eventBus);

    // AI
    const groqProvider = new GroqProvider();

    this.aiInsightService = new AIInsightService(
      groqProvider
    );

    // Core Services
    this.reconciliationService = new ReconciliationService(
      paystackConnector,
      ledgerConnector,
      ledgerSource,
      this.aiInsightService,
      this.reconciliationRepository,
      this.csvUploadRegistry,
      this.organizationService
    );

    this.reconciliationJob = new ReconciliationJob(
      this.reconciliationService,
      auditService,
      eventPublisher
    );

    // Controllers
    this.reconciliationController =
      new ReconciliationController(
        this.reconciliationService,
        this.reconciliationRepository,
        this.csvUploadRegistry
      );

    this.aiController = new AIController(
      this.aiInsightService
    );
  }}