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
  noticeCreateSchema,
  noticeQuerySchema,
  noticeUpdateSchema,
  type NoticeCreate,
  type NoticeQuery,
  type NoticeUpdate,
} from "@erp/shared";
import { Public } from "../../common/decorators/public.decorator.js";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { NoticesService } from "./notices.service.js";

@Controller("public/notices")
export class PublicNoticesController {
  constructor(private readonly notices: NoticesService) {}

  @Public()
  @Get()
  list() {
    return this.notices.listPublic();
  }
}

@Controller("admin/notices")
export class AdminNoticesController {
  constructor(private readonly notices: NoticesService) {}

  @Get()
  @Permissions("notice.item.read")
  list(@Query(new ZodValidationPipe(noticeQuerySchema)) query: NoticeQuery) {
    return this.notices.list(query);
  }

  @Get(":id")
  @Permissions("notice.item.read")
  get(@Param("id") id: string) {
    return this.notices.get(id);
  }

  @Post()
  @Permissions("notice.item.write")
  @Audit({ action: "notice.item.create", entityType: "notice" })
  create(
    @Body(new ZodValidationPipe(noticeCreateSchema)) body: NoticeCreate,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.notices.create(body, actor.userId);
  }

  @Patch(":id")
  @Permissions("notice.item.write")
  @Audit({ action: "notice.item.update", entityType: "notice" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(noticeUpdateSchema)) body: NoticeUpdate,
  ) {
    return this.notices.update(id, body);
  }

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @Permissions("notice.item.publish")
  @Audit({ action: "notice.item.publish", entityType: "notice" })
  publish(@Param("id") id: string) {
    return this.notices.publish(id);
  }

  @Post(":id/hide")
  @HttpCode(HttpStatus.OK)
  @Permissions("notice.item.hide")
  @Audit({ action: "notice.item.hide", entityType: "notice" })
  hide(@Param("id") id: string) {
    return this.notices.hide(id);
  }

  @Delete(":id")
  @Permissions("notice.item.write")
  @Audit({ action: "notice.item.delete", entityType: "notice" })
  remove(@Param("id") id: string) {
    return this.notices.remove(id);
  }
}
