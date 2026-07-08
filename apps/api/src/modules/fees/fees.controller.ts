import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import {
  feeTransactionQuerySchema,
  rftIssueSchema,
  rftQuerySchema,
  rftUpdateSchema,
  type FeeTransactionQuery,
  type RftIssueInput,
  type RftQuery,
  type RftUpdateInput,
} from "@erp/shared";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { FeesService } from "./fees.service.js";

@Controller("admin/fees")
export class FeesController {
  constructor(private readonly fees: FeesService) {}

  @Get("transactions")
  @Permissions("fees.transaction.read")
  listTransactions(
    @Query(new ZodValidationPipe(feeTransactionQuerySchema)) query: FeeTransactionQuery,
  ) {
    return this.fees.listTransactions(query);
  }

  @Get("dashboard")
  @Permissions("fees.transaction.read")
  dashboard() {
    return this.fees.dashboard();
  }

  @Get("rft")
  @Permissions("fees.transaction.read")
  listRft(@Query(new ZodValidationPipe(rftQuerySchema)) query: RftQuery) {
    return this.fees.listRft(query);
  }

  @Get("rft/:id")
  @Permissions("fees.transaction.read")
  getRft(@Param("id") id: string) {
    return this.fees.getRft(id);
  }

  @Post("rft")
  @Permissions("fees.rft.issue")
  @Audit({ action: "fees.rft.issue", entityType: "rft_request" })
  issueRft(
    @Body(new ZodValidationPipe(rftIssueSchema)) body: RftIssueInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.fees.issueRft(body, actor.userId);
  }

  @Patch("rft/:id")
  @Permissions("fees.rft.edit")
  @Audit({ action: "fees.rft.edit", entityType: "rft_request" })
  updateRft(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(rftUpdateSchema)) body: RftUpdateInput,
  ) {
    return this.fees.updateRft(id, body);
  }

  @Get("rft/:id/print")
  @Permissions("fees.rft.print")
  printRft(@Param("id") id: string) {
    return this.fees.printRft(id);
  }
}
