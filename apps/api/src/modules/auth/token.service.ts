import { createHash, randomBytes } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { UserType } from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../redis/redis.service.js";
import { sessionKey } from "../../common/guards/jwt-auth.guard.js";

export interface AccessTokenSubject {
  userId: string;
  sessionId: string;
  userType: UserType;
  roleVersion: number;
}

export interface RotationResult {
  userId: string;
  sessionId: string;
  userType: UserType;
  roleVersion: number;
  rawRefreshToken: string;
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  private get refreshTtlMs(): number {
    return this.config.getOrThrow<number>("auth.refreshTtlDays") * 24 * 60 * 60 * 1000;
  }

  async signAccessToken(subject: AccessTokenSubject): Promise<string> {
    const options: JwtSignOptions = {
      secret: this.config.getOrThrow<string>("auth.jwtSecret"),
      subject: subject.userId,
      expiresIn: this.config.getOrThrow<string>("auth.accessTtl") as JwtSignOptions["expiresIn"],
    };
    return this.jwt.signAsync(
      { sid: subject.sessionId, typ: subject.userType, rv: subject.roleVersion },
      options,
    );
  }

  /** Creates a session row and marks it live in Redis. */
  async createSession(userId: string, ip?: string, userAgent?: string): Promise<string> {
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);
    const session = await this.prisma.session.create({
      data: { userId, expiresAt, ip: ip ?? null, userAgent: userAgent ?? null },
    });
    await this.markSessionLive(session.id, userId);
    return session.id;
  }

  async issueRefreshToken(
    sessionId: string,
    userId: string,
    ip?: string,
    userAgent?: string,
    familyId?: string,
    prevTokenId?: string,
  ): Promise<string> {
    const raw = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);
    const created = await this.prisma.refreshToken.create({
      data: {
        sessionId,
        userId,
        tokenHash: hashToken(raw),
        familyId: familyId ?? (await this.newFamilyId(sessionId)),
        prevTokenId: prevTokenId ?? null,
        expiresAt,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
    // Encode the token id alongside the secret so lookups are indexed and O(1).
    return `${created.id}.${raw}`;
  }

  /** Rotates a refresh token. Detects reuse of a consumed/revoked token and
   * revokes the entire family + session in response. */
  async rotateRefresh(presented: string, ip?: string, userAgent?: string): Promise<RotationResult> {
    const [tokenId, raw] = presented.split(".");
    if (!tokenId || !raw) throw new UnauthorizedException({ code: "INVALID_REFRESH" });

    const record = await this.prisma.refreshToken.findUnique({ where: { id: tokenId } });
    if (!record || record.tokenHash !== hashToken(raw)) {
      throw new UnauthorizedException({ code: "INVALID_REFRESH" });
    }

    if (record.consumedAt || record.revokedAt) {
      // Reuse of an already-rotated/revoked token → compromise. Burn the family.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: record.familyId, reuseDetectedAt: null },
        data: { revokedAt: new Date(), reuseDetectedAt: new Date() },
      });
      await this.revokeSession(record.sessionId);
      throw new UnauthorizedException({ code: "REFRESH_REUSE_DETECTED" });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: "REFRESH_EXPIRED" });
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: record.userId },
      select: { userType: true, roleVersion: true, status: true },
    });
    if (user.status !== "active") throw new UnauthorizedException({ code: "USER_INACTIVE" });

    // Consume current, issue successor in the same family.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    const rawNext = await this.issueRefreshToken(
      record.sessionId,
      record.userId,
      ip,
      userAgent,
      record.familyId,
      record.id,
    );
    await this.prisma.session.update({
      where: { id: record.sessionId },
      data: { lastSeenAt: new Date() },
    });
    await this.markSessionLive(record.sessionId, record.userId);

    return {
      userId: record.userId,
      sessionId: record.sessionId,
      userType: user.userType,
      roleVersion: user.roleVersion,
      rawRefreshToken: rawNext,
    };
  }

  /** Validates a refresh token WITHOUT rotating it (used by /session for SSR). */
  async verifyRefresh(presented: string): Promise<{ userId: string; sessionId: string }> {
    const [tokenId, raw] = presented.split(".");
    if (!tokenId || !raw) throw new UnauthorizedException({ code: "INVALID_REFRESH" });
    const record = await this.prisma.refreshToken.findUnique({ where: { id: tokenId } });
    if (
      !record ||
      record.tokenHash !== hashToken(raw) ||
      record.revokedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException({ code: "INVALID_REFRESH" });
    }
    const live = await this.redis.get(sessionKey(record.sessionId));
    if (!live) throw new UnauthorizedException({ code: "SESSION_EXPIRED" });
    return { userId: record.userId, sessionId: record.sessionId };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.redis.del(sessionKey(sessionId));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });
    await Promise.all(sessions.map((s) => this.revokeSession(s.id)));
  }

  private async markSessionLive(sessionId: string, userId: string): Promise<void> {
    await this.redis.setEx(sessionKey(sessionId), userId, Math.floor(this.refreshTtlMs / 1000));
  }

  private async newFamilyId(sessionId: string): Promise<string> {
    // Family id is a uuid; reuse the session id space by generating a fresh uuid.
    void sessionId;
    return randomBytes(16).toString("hex").replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/,
      "$1-$2-$3-$4-$5",
    );
  }
}
