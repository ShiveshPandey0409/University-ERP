import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { RequestScopeContext } from "../../common/interfaces/authenticated-principal.interface.js";

@Injectable()
export class ScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Loads a user's scope grants into a normalized context. A user with a
   * `global` scope (or none of the restricting types) is treated as unrestricted. */
  async getScopeContext(userId: string): Promise<RequestScopeContext> {
    const scopes = await this.prisma.userScope.findMany({ where: { userId } });
    const collegeIds: string[] = [];
    const departmentIds: string[] = [];
    const sessionIds: string[] = [];
    let isGlobal = false;

    for (const s of scopes) {
      if (s.scopeType === "global") isGlobal = true;
      if (s.collegeId) collegeIds.push(s.collegeId);
      if (s.departmentId) departmentIds.push(s.departmentId);
      if (s.sessionId) sessionIds.push(s.sessionId);
    }
    return { collegeIds, departmentIds, sessionIds, isGlobal };
  }
}
