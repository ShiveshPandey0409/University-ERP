import { Injectable, Logger } from "@nestjs/common";
import { Prisma, type ActorType, type AuditOutcome } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { redact } from "../../common/util/redact.js";

export interface AuditEntry {
  actorUserId?: string | null;
  actorType?: ActorType;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  outcome?: AuditOutcome;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger("Audit");

  constructor(private readonly prisma: PrismaService) {}

  async write(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: entry.actorUserId ?? null,
          actorType: entry.actorType ?? "user",
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          before:
            entry.before === undefined
              ? Prisma.JsonNull
              : (redact(entry.before) as Prisma.InputJsonValue),
          after:
            entry.after === undefined
              ? Prisma.JsonNull
              : (redact(entry.after) as Prisma.InputJsonValue),
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
          requestId: entry.requestId ?? null,
          outcome: entry.outcome ?? "success",
        },
      });
    } catch (err) {
      // Auditing must never break the request; log and move on.
      this.logger.error(`Failed to write audit log for ${entry.action}`, err as Error);
    }
  }
}
