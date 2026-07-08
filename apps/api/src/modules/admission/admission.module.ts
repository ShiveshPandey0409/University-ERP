import { Module } from "@nestjs/common";
import {
  AdmissionController,
  AdmissionVerifierController,
  PublicAdmissionController,
} from "./admission.controller.js";
import { AdmissionService } from "./admission.service.js";
import { AdmissionVerifierService } from "./verifier.service.js";

@Module({
  controllers: [PublicAdmissionController, AdmissionController, AdmissionVerifierController],
  providers: [AdmissionService, AdmissionVerifierService],
})
export class AdmissionModule {}
