import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import {
  admissionDeficiencySchema,
  admissionQuerySchema,
  admissionRegisterSchema,
  admissionRejectSchema,
  admissionVerifierCreateSchema,
  admissionVerifierQuerySchema,
  admissionVerifierUpdateSchema,
  meritGenerateSchema,
  type AdmissionDeficiencyInput,
  type AdmissionQuery,
  type AdmissionRegisterInput,
  type AdmissionRejectInput,
  type AdmissionVerifierCreate,
  type AdmissionVerifierQuery,
  type MeritGenerateInput,
} from "@erp/shared";
import { Public } from "../../common/decorators/public.decorator.js";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { AdmissionService } from "./admission.service.js";
import { AdmissionVerifierService } from "./verifier.service.js";

/** Public admission registration (regular / private / phd / agriculture). */
@Controller("public/admission")
export class PublicAdmissionController {
  constructor(private readonly admission: AdmissionService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("register")
  register(@Body(new ZodValidationPipe(admissionRegisterSchema)) body: AdmissionRegisterInput) {
    return this.admission.register(body);
  }
}

@Controller("admin/admission/applications")
export class AdmissionController {
  constructor(private readonly admission: AdmissionService) {}

  @Get("dashboard")
  @Permissions("admission.postadm.read")
  dashboard(@Query("academicSessionId") academicSessionId?: string) {
    return this.admission.dashboard(academicSessionId);
  }

  @Get()
  @Permissions("admission.application.read")
  list(@Query(new ZodValidationPipe(admissionQuerySchema)) query: AdmissionQuery) {
    return this.admission.list(query);
  }

  @Get(":id")
  @Permissions("admission.application.read")
  get(@Param("id") id: string) {
    return this.admission.get(id);
  }

  @Post(":id/verify")
  @HttpCode(HttpStatus.OK)
  @Permissions("admission.application.verify")
  @Audit({ action: "admission.application.verify", entityType: "admission_application" })
  verify(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.admission.verify(id, actor.userId);
  }

  @Post(":id/deficiency")
  @HttpCode(HttpStatus.OK)
  @Permissions("admission.application.mark-deficiency")
  @Audit({ action: "admission.application.mark-deficiency", entityType: "admission_application" })
  deficiency(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(admissionDeficiencySchema)) body: AdmissionDeficiencyInput,
  ) {
    return this.admission.markDeficiency(id, body.note);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @Permissions("admission.application.reject")
  @Audit({ action: "admission.application.reject", entityType: "admission_application" })
  reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(admissionRejectSchema)) body: AdmissionRejectInput,
  ) {
    return this.admission.reject(id, body.reason);
  }

  @Post("merit/generate")
  @HttpCode(HttpStatus.OK)
  @Permissions("admission.merit.generate")
  @Audit({ action: "admission.merit.generate", entityType: "admission_application" })
  generateMerit(@Body(new ZodValidationPipe(meritGenerateSchema)) body: MeritGenerateInput) {
    return this.admission.generateMerit(body);
  }

  @Post(":id/subject-selection/approve")
  @HttpCode(HttpStatus.OK)
  @Permissions("admission.subjectselection.approve")
  @Audit({ action: "admission.subjectselection.approve", entityType: "admission_application" })
  approveSubjectSelection(@Param("id") id: string) {
    return this.admission.approveSubjectSelection(id);
  }

  @Post(":id/cancellation/approve")
  @HttpCode(HttpStatus.OK)
  @Permissions("admission.cancellation.approve")
  @Audit({ action: "admission.cancellation.approve", entityType: "admission_application" })
  approveCancellation(@Param("id") id: string) {
    return this.admission.approveCancellation(id);
  }
}

@Controller("admin/admission/verifiers")
@Permissions("admission.verificationuser.manage")
export class AdmissionVerifierController {
  constructor(private readonly verifiers: AdmissionVerifierService) {}

  @Get()
  list(@Query(new ZodValidationPipe(admissionVerifierQuerySchema)) query: AdmissionVerifierQuery) {
    return this.verifiers.list(query);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.verifiers.get(id);
  }

  @Post()
  @Audit({ action: "admission_verifier.create", entityType: "admission_verifier" })
  create(@Body(new ZodValidationPipe(admissionVerifierCreateSchema)) body: AdmissionVerifierCreate) {
    return this.verifiers.create(body);
  }

  @Patch(":id")
  @Audit({ action: "admission_verifier.update", entityType: "admission_verifier" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(admissionVerifierUpdateSchema)) body: Record<string, unknown>,
  ) {
    return this.verifiers.update(id, body);
  }
}
