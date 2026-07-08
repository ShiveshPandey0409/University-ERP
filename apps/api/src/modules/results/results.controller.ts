import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  marksBatchCreateSchema,
  marksBatchQuerySchema,
  marksBatchUpdateSchema,
  marksEntryUpsertSchema,
  paginationQuerySchema,
  publicationTargetSchema,
  type MarksBatchCreate,
  type MarksBatchQuery,
  type MarksEntryUpsertInput,
  type PaginationQuery,
  type PublicationTargetInput,
} from "@erp/shared";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { MarksService } from "./marks.service.js";
import { MarksBatchService } from "./marks-batch.service.js";
import { ResultsService } from "./results.service.js";

@Controller("admin/marks/batches")
export class MarksBatchController {
  constructor(private readonly batches: MarksBatchService) {}

  @Get()
  @Permissions("marks.batch.read")
  list(@Query(new ZodValidationPipe(marksBatchQuerySchema)) query: MarksBatchQuery) {
    return this.batches.list(query);
  }

  @Get(":id")
  @Permissions("marks.batch.read")
  get(@Param("id") id: string) {
    return this.batches.get(id);
  }

  @Post()
  @Permissions("marks.batch.write")
  @Audit({ action: "marks.batch.create", entityType: "marks_batch" })
  create(
    @Body(new ZodValidationPipe(marksBatchCreateSchema)) body: MarksBatchCreate,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.batches.create(body, actor.userId);
  }

  @Patch(":id")
  @Permissions("marks.batch.write")
  @Audit({ action: "marks.batch.update", entityType: "marks_batch" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(marksBatchUpdateSchema)) body: { status: MarksBatchCreate["status"] },
  ) {
    return this.batches.update(id, body);
  }

  @Delete(":id")
  @Permissions("marks.batch.write")
  @Audit({ action: "marks.batch.delete", entityType: "marks_batch" })
  remove(@Param("id") id: string) {
    return this.batches.remove(id);
  }
}

@Controller("admin/marks")
export class MarksController {
  constructor(private readonly marks: MarksService) {}

  @Post("entries")
  @HttpCode(HttpStatus.OK)
  @Permissions("marks.entry.write")
  @Audit({ action: "marks.entry.write", entityType: "marks_entry" })
  upsert(
    @Body(new ZodValidationPipe(marksEntryUpsertSchema)) body: MarksEntryUpsertInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.marks.upsertEntry(body, actor.userId);
  }

  @Get("batches/:id/entries")
  @Permissions("marks.batch.read")
  listEntries(@Param("id") batchId: string) {
    return this.marks.listBatchEntries(batchId);
  }
}

@Controller("admin/results")
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  // Submit for approval — held by marks operators.
  @Post("submit")
  @HttpCode(HttpStatus.OK)
  @Permissions("marks.entry.write")
  @Audit({ action: "result.publication.submit", entityType: "result_publication" })
  submit(
    @Body(new ZodValidationPipe(publicationTargetSchema)) body: PublicationTargetInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.results.submitForApproval(body, actor.userId);
  }

  // Approve + publish — DISTINCT permission (separation of duties).
  @Post("approve")
  @HttpCode(HttpStatus.OK)
  @Permissions("result.publication.approve")
  @Audit({ action: "result.publication.approve", entityType: "result_publication" })
  approve(
    @Body(new ZodValidationPipe(publicationTargetSchema)) body: PublicationTargetInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.results.approveAndPublish(body, actor.userId);
  }

  @Get("publications")
  @Permissions("result.publication.read")
  list(@Query(new ZodValidationPipe(paginationQuerySchema)) _query: PaginationQuery) {
    return this.results.listPublications();
  }
}
