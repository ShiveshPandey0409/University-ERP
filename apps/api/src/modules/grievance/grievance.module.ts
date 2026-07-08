import { Module } from "@nestjs/common";
import { AdminGrievanceController, PublicGrievanceController } from "./grievance.controller.js";
import { GrievanceService } from "./grievance.service.js";

@Module({
  controllers: [PublicGrievanceController, AdminGrievanceController],
  providers: [GrievanceService],
})
export class GrievanceModule {}
