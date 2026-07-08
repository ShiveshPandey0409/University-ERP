import { Injectable } from "@nestjs/common";
import type { AdmissionVerifierQuery } from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { BaseCrudService, type CrudDelegate } from "../../common/crud/base-crud.service.js";

@Injectable()
export class AdmissionVerifierService extends BaseCrudService<AdmissionVerifierQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "email"];
  protected override readonly sortableFields = ["name", "createdAt"];
  protected override readonly defaultSort = "name";
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = prisma.admissionVerifier as unknown as CrudDelegate;
  }
  protected override buildWhere(q: AdmissionVerifierQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.isActive !== undefined) where.isActive = q.isActive;
    return where;
  }
}
