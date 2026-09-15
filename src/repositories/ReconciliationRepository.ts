import { ReconciliationReport } from "../shared/types/ReconciliationReport";
import { BaseRepository } from "./BaseRepository";
import { promises as fs } from "fs";
import path from "path";
import { ConnectorConfig } from "../config/ConnectorConfig";
import { PostgresRepository } from "./PostgresRepository";

export class ReconciliationRepository extends BaseRepository<ReconciliationReport> {
  constructor(private readonly postgresRepository?: PostgresRepository) {
    super();
  }

  private readonly filePath = path.resolve(ConnectorConfig.RECONCILIATION_STORE_PATH);
  private reconciliations: ReconciliationReport[] | null = null;

  private async load(): Promise<ReconciliationReport[]> {
    if (this.reconciliations) return this.reconciliations;
    try {
      const content = await fs.readFile(this.filePath, "utf8");
      const reports = JSON.parse(content) as ReconciliationReport[];
      this.reconciliations = reports.map((report) => ({
        ...report,
        generatedAt: new Date(report.generatedAt),
      }));
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
      this.reconciliations = [];
    }
    return this.reconciliations;
  }

  private async persist(): Promise<void> {
    const reports = await this.load();
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(reports, null, 2), "utf8");
  }

  async create(
    report: ReconciliationReport
  ): Promise<ReconciliationReport> {
    if (this.postgresRepository) {
      return this.postgresRepository.createReport(report);
    }

    const reports = await this.load();
    reports.push(report);
    await this.persist();

    return report;
  }

  async findById(
    id: string
  ): Promise<ReconciliationReport | null> {
    if (this.postgresRepository) {
      return this.postgresRepository.findReportById(id);
    }

    const reports = await this.load();
    const report = reports.find(
      (reconciliation) => reconciliation.id === id
    );

    return report ?? null;
  }

  async findAll(): Promise<ReconciliationReport[]> {
    if (this.postgresRepository) {
      const reports = await this.postgresRepository.findAllReports();
      return reports;
    }

    return [...(await this.load())];
  }

  async update(
    id: string,
    data: Partial<ReconciliationReport>
  ): Promise<ReconciliationReport | null> {
    const reports = await this.load();
    const index = reports.findIndex(
      (reconciliation) => reconciliation.id === id
    );

    if (index === -1) {
      return null;
    }

    reports[index] = {
      ...reports[index],
      ...data,
    };
    await this.persist();

    return reports[index];
  }

  async delete(id: string): Promise<boolean> {
    const reports = await this.load();
    const index = reports.findIndex(
      (reconciliation) => reconciliation.id === id
    );

    if (index === -1) {
      return false;
    }

    reports.splice(index, 1);
    await this.persist();

    return true;
  }

  async findByOrganization(
    organizationId: string
  ): Promise<ReconciliationReport[]> {
    if (this.postgresRepository) {
      return this.postgresRepository.findReportsByOrganization(organizationId);
    }

    const reports = await this.load();
    return reports.filter(
      (report) => report.organizationId === organizationId
    );
  }

  async findLatest(
    organizationId: string
  ): Promise<ReconciliationReport | null> {
    const reports = (await this.load())
      .filter(
        (report) => report.organizationId === organizationId
      )
      .sort(
        (a, b) =>
          b.generatedAt.getTime() - a.generatedAt.getTime()
      );

    return reports.length > 0 ? reports[0] : null;
  }
}