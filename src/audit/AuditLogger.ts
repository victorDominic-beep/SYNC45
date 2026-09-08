import { AuditLog } from "./AuditTypes";

export class AuditLogger {
  public log(auditLog: AuditLog): void {
    console.log("========== AUDIT LOG ==========");
    console.log(`ID: ${auditLog.id}`);
    console.log(`Organization: ${auditLog.organizationId}`);
    console.log(`Event: ${auditLog.event}`);
    console.log(`Severity: ${auditLog.severity}`);
    console.log(`Message: ${auditLog.message}`);
    console.log(`Timestamp: ${auditLog.timestamp.toISOString()}`);

    if (auditLog.metadata) {
      console.log("Metadata:");
      console.log(JSON.stringify(auditLog.metadata, null, 2));
    }

    console.log("================================");
  }
}