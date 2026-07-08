import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../redis/redis.service.js";

const PERM_CACHE_TTL_SEC = 300;
const permKey = (userId: string) => `perms:${userId}`;

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Resolves the caller's current effective permission set. Cached in Redis;
   * always reflects current roles (invalidated on any role change), so a
   * still-valid access token is de-authorized on the next request. */
  async getEffectivePermissions(userId: string): Promise<Set<string>> {
    const cached = await this.redis.get(permKey(userId));
    if (cached) return new Set<string>(JSON.parse(cached) as string[]);

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: { rolePermissions: { select: { permission: { select: { key: true } } } } },
        },
      },
    });

    const perms = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) perms.add(rp.permission.key);
    }
    await this.redis.setEx(permKey(userId), JSON.stringify([...perms]), PERM_CACHE_TTL_SEC);
    return perms;
  }

  async getRoleKeys(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { key: true } } },
    });
    return rows.map((r) => r.role.key);
  }

  async hasPermissions(
    userId: string,
    required: string[],
    mode: "all" | "any",
  ): Promise<boolean> {
    if (required.length === 0) return false;
    const perms = await this.getEffectivePermissions(userId);
    return mode === "any"
      ? required.some((p) => perms.has(p))
      : required.every((p) => perms.has(p));
  }

  /** Drops the cached permission set and bumps roleVersion. Call whenever a
   * user's roles or a role's permissions change. */
  async invalidateUser(userId: string): Promise<void> {
    await this.redis.del(permKey(userId));
    await this.prisma.user.update({
      where: { id: userId },
      data: { roleVersion: { increment: 1 } },
    });
  }
}
