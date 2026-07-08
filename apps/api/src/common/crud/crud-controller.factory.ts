import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  type Type,
} from "@nestjs/common";
import type { ZodSchema } from "zod";
import type { PermissionKey } from "@erp/shared";
import { Permissions } from "../decorators/permissions.decorator.js";
import { Audit } from "../decorators/audit.decorator.js";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe.js";
import type { BaseCrudService } from "./base-crud.service.js";

export interface CrudControllerOptions {
  path: string;
  permission: PermissionKey;
  entityType: string;
  querySchema: ZodSchema;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
}

/** Builds a permission-guarded, Zod-validated, audited CRUD controller bound to
 * the given service token. Every master-data entity reuses this. */
export function createCrudController(
  opts: CrudControllerOptions,
  serviceToken: Type<BaseCrudService>,
): Type<unknown> {
  @Controller(opts.path)
  @Permissions(opts.permission)
  class CrudController {
    constructor(@Inject(serviceToken) readonly service: BaseCrudService) {}

    @Get()
    list(@Query(new ZodValidationPipe(opts.querySchema)) query: unknown) {
      return this.service.list(query as never);
    }

    @Get(":id")
    getOne(@Param("id") id: string) {
      return this.service.get(id);
    }

    @Post()
    @Audit({ action: `${opts.entityType}.create`, entityType: opts.entityType })
    create(@Body(new ZodValidationPipe(opts.createSchema)) body: Record<string, unknown>) {
      return this.service.create(body);
    }

    @Patch(":id")
    @Audit({ action: `${opts.entityType}.update`, entityType: opts.entityType })
    update(
      @Param("id") id: string,
      @Body(new ZodValidationPipe(opts.updateSchema)) body: Record<string, unknown>,
    ) {
      return this.service.update(id, body);
    }

    @Delete(":id")
    @Audit({ action: `${opts.entityType}.delete`, entityType: opts.entityType })
    remove(@Param("id") id: string) {
      return this.service.remove(id);
    }
  }

  return CrudController;
}
