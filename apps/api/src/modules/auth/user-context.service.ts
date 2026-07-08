import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RbacService } from "../rbac/rbac.service.js";
import { ScopeService } from "../rbac/scope.service.js";

@Injectable()
export class UserContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly scope: ScopeService,
  ) {}

  /** Assembles the client-facing identity: profile + role keys + effective
   * permissions + active scope context. */
  async buildAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, displayName: true, userType: true },
    });
    const [roleKeys, permSet, scopeCtx] = await Promise.all([
      this.rbac.getRoleKeys(userId),
      this.rbac.getEffectivePermissions(userId),
      this.scope.getScopeContext(userId),
    ]);

    return {
      id: user.id,
      displayName: user.displayName,
      userType: user.userType,
      roles: roleKeys as AuthUser["roles"],
      permissions: [...permSet],
      activeContext: {
        collegeId: scopeCtx.collegeIds[0],
        departmentId: scopeCtx.departmentIds[0],
        sessionId: scopeCtx.sessionIds[0],
      },
    };
  }
}
