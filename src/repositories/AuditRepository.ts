import { AuditLog } from "../audit/AuditTypes";
import { BaseRepository } from "./BaseRepository";

export class AuditRepository extends BaseRepository<AuditLog> {
  private readonly auditLogs: AuditLog[] = [];

  async create(data: AuditLog): Promise<AuditLog> {
    this.auditLogs.push(data);

    return data;
  }

  async findById(id: string): Promise<AuditLog | null> {
    const auditLog =
      this.auditLogs.find((log) => log.id === id);

    return auditLog ?? null;
  }

  async findAll(): Promise<AuditLog[]> {
    return [...this.auditLogs];
  }

  async update(
    id: string,
    data: Partial<AuditLog>
  ): Promise<AuditLog | null> {
    const index = this.auditLogs.findIndex(
      (log) => log.id === id
    );

    if (index === -1) {
      return null;
    }

    this.auditLogs[index] = {
      ...this.auditLogs[index],
      ...data,
    };

    return this.auditLogs[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.auditLogs.findIndex(
      (log) => log.id === id
    );

    if (index === -1) {
      return false;
    }

    this.auditLogs.splice(index, 1);

    return true;
  }

  async findByOrganization(
    organizationId: string
  ): Promise<AuditLog[]> {
    return this.auditLogs.filter(
      (log) => log.organizationId === organizationId
    );
  }

  async findByEvent(event: string): Promise<AuditLog[]> {
    return this.auditLogs.filter(
      (log) => log.event === event
    );
  }
}