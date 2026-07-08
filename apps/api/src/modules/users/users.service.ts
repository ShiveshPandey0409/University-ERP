import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AssignRolesInput,
  CreateUserInput,
  Paginated,
  PaginationQuery,
  UpdateUserInput,
} from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { PasswordService } from "../auth/password.service.js";
import { TokenService } from "../auth/token.service.js";
import { RbacService } from "../rbac/rbac.service.js";
import { setAuditBefore } from "../../common/context/audit-context.js";

const USER_SELECT = {
  id: true,
  userType: true,
  username: true,
  email: true,
  displayName: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly rbac: RbacService,
  ) {}

  async list(query: PaginationQuery): Promise<Paginated<unknown>> {
    const where = query.search
      ? {
          OR: [
            { username: { contains: query.search } },
            { displayName: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { [query.sort ?? "createdAt"]: query.order },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      data,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async create(input: CreateUserInput, actorId: string) {
    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        userType: input.userType,
        username: input.username,
        email: input.email ?? null,
        displayName: input.displayName,
        passwordHash,
        status: "active",
        createdBy: actorId,
      },
      select: USER_SELECT,
    });
    if (input.roleKeys.length) {
      await this.setRoles(user.id, input.roleKeys, actorId);
    }
    return user;
  }

  async update(id: string, input: UpdateUserInput, actorId: string) {
    const before = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!before) throw new NotFoundException({ code: "NOT_FOUND", message: "User not found" });
    setAuditBefore(before);
    return this.prisma.user.update({
      where: { id },
      data: { ...input, updatedBy: actorId },
      select: USER_SELECT,
    });
  }

  async disable(id: string, actorId: string) {
    const before = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!before) throw new NotFoundException({ code: "NOT_FOUND", message: "User not found" });
    setAuditBefore(before);
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: "disabled", updatedBy: actorId },
      select: USER_SELECT,
    });
    await this.tokens.revokeAllUserSessions(id);
    return user;
  }

  async assignRoles(id: string, input: AssignRolesInput, actorId: string) {
    const before = await this.rbac.getRoleKeys(id);
    setAuditBefore({ roleKeys: before });
    await this.setRoles(id, input.roleKeys, actorId);
    return { id, roleKeys: input.roleKeys };
  }

  private async setRoles(userId: string, roleKeys: string[], actorId: string): Promise<void> {
    const roles = await this.prisma.role.findMany({
      where: { key: { in: roleKeys } },
      select: { id: true },
    });
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roles.map((r) => ({ userId, roleId: r.id, assignedBy: actorId })),
        skipDuplicates: true,
      }),
    ]);
    await this.rbac.invalidateUser(userId);
  }
}
