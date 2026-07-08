import { NotFoundException } from "@nestjs/common";
import type { Paginated, PaginationQuery } from "@erp/shared";
import { skipTake, toPaginated } from "../util/paginate.js";
import { setAuditBefore } from "../context/audit-context.js";

/** Minimal shape shared by all Prisma model delegates. */
export interface CrudDelegate {
  findMany(args: unknown): Promise<unknown[]>;
  count(args: unknown): Promise<number>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
}

/**
 * Reusable CRUD for master-data entities. Subclasses provide the Prisma
 * delegate, searchable/sortable fields, an optional include, and an optional
 * filter builder. Actor attribution lives in audit_logs (written by the audit
 * interceptor), so no createdBy/updatedBy columns are assumed here.
 */
export abstract class BaseCrudService<Q extends PaginationQuery = PaginationQuery> {
  protected abstract readonly delegate: CrudDelegate;
  protected readonly include: Record<string, unknown> | undefined = undefined;
  protected readonly searchFields: string[] = [];
  protected readonly sortableFields: string[] = ["createdAt"];
  protected readonly defaultSort: string = "createdAt";

  /** Override to add entity-specific filters; call super for search. */
  protected buildWhere(query: Q): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (query.search && this.searchFields.length > 0) {
      where.OR = this.searchFields.map((field) => ({
        [field]: { contains: query.search, mode: "insensitive" },
      }));
    }
    return where;
  }

  private orderBy(query: Q): Record<string, "asc" | "desc"> {
    const field =
      query.sort && this.sortableFields.includes(query.sort) ? query.sort : this.defaultSort;
    return { [field]: query.order };
  }

  async list(query: Q): Promise<Paginated<unknown>> {
    const where = this.buildWhere(query);
    const [total, data] = await Promise.all([
      this.delegate.count({ where }),
      this.delegate.findMany({
        where,
        include: this.include,
        orderBy: this.orderBy(query),
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string): Promise<unknown> {
    const row = await this.delegate.findUnique({ where: { id }, include: this.include });
    if (!row) throw new NotFoundException({ code: "NOT_FOUND", message: "Record not found" });
    return row;
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    const before = await this.get(id);
    setAuditBefore(before);
    return this.delegate.update({ where: { id }, data });
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const before = await this.get(id);
    setAuditBefore(before);
    await this.delegate.delete({ where: { id } });
    return { id, deleted: true };
  }
}
