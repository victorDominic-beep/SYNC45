import { AuditService } from "../audit/AuditService";
import { EventPublisher } from "../events/EventPublisher";

import { ReconciliationService } from "../reconciliation/services/ReconciliationService";
import { ReconciliationJob } from "../jobs/ReconciliationJob";

import { ReconciliationController } from "../api/controllers/ReconciliationController";
import { EventBus } from "../events/EventBus";
import { GroqProvider } from "../ai/providers/GroqProvider";
import { AIInsightService } from "../ai/services/AIInsightService";
import { AIController } from "../ai/controllers/AIController";
import { ReconciliationRepository } from "../repositories/ReconciliationRepository";
import { OrganizationController } from "../organizations/OrganizationController";
import { OrganizationService } from "../organizations/OrganizationService";
import { UserController } from "../users/UserController";
import { UserService } from "../users/UserService";
import { PostgresRepository } from "../repositories/PostgresRepository";

export class Application {
  public readonly reconciliationController: ReconciliationController;
  public readonly reconciliationJob: ReconciliationJob;
  public readonly reconciliationService: ReconciliationService;
  public readonly aiController: AIController;
  public readonly aiInsightService: AIInsightService;
  public readonly reconciliationRepository: ReconciliationRepository;
  public readonly csvUploadRegistry = new Map<string, string>();
  public readonly organizationService: OrganizationService;
  public readonly organizationController: OrganizationController;
  public readonly userService: UserService;
  public readonly userController: UserController;
  public readonly postgresRepository: PostgresRepository;

  constructor() {
    // Auth + organization identity persistence
    this.postgresRepository = new PostgresRepository();
    this.userService = new UserService(this.postgresRepository);
    this.userController = new UserController(this.userService);
    this.postgresRepository.init().catch(() => undefined);

    // Organization connection persistence service and controller
    this.organizationService = new OrganizationService(this.postgresRepository);
    this.organizationController = new OrganizationController(
      this.organizationService
    );

    this.reconciliationRepository = new ReconciliationRepository(this.postgresRepository);
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
      this.aiInsightService,
      this.reconciliationRepository
    );
  }}