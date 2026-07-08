import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@erp/db";
import type { FastifyReply, FastifyRequest } from "fastify";

interface ErrorEnvelope {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exceptions");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();
    const requestId = req.id;

    const envelope = this.toEnvelope(exception, requestId);
    if (envelope.statusCode >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${envelope.statusCode} ${envelope.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    reply.status(envelope.statusCode).send(envelope);
  }

  private toEnvelope(exception: unknown, requestId?: string): ErrorEnvelope {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === "string") {
        return { statusCode: status, code: codeForStatus(status), message: resp, requestId };
      }
      const r = resp as Record<string, unknown>;
      return {
        statusCode: status,
        code: (r.code as string) ?? codeForStatus(status),
        message: normalizeMessage(r.message) ?? codeForStatus(status),
        requestId,
        details: r.details,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrisma(exception, requestId);
    }

    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : exception instanceof Error
          ? exception.message
          : "Internal server error";
    return { statusCode: 500, code: "INTERNAL_ERROR", message, requestId };
  }

  private mapPrisma(
    e: Prisma.PrismaClientKnownRequestError,
    requestId?: string,
  ): ErrorEnvelope {
    switch (e.code) {
      case "P2002":
        return {
          statusCode: HttpStatus.CONFLICT,
          code: "CONFLICT",
          message: "A record with these unique values already exists",
          requestId,
          details: e.meta,
        };
      case "P2025":
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: "NOT_FOUND",
          message: "Record not found",
          requestId,
        };
      case "P2003":
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: "FK_CONSTRAINT",
          message: "Related record constraint failed",
          requestId,
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: "DB_ERROR",
          message: "Database request failed",
          requestId,
        };
    }
  }
}

function normalizeMessage(message: unknown): string | undefined {
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return undefined;
}

function codeForStatus(status: number): string {
  return (
    {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      429: "RATE_LIMITED",
    }[status] ?? "ERROR"
  );
}
