import { Module } from "@nestjs/common";
import { DegreeController } from "./degree.controller.js";
import { DegreeService } from "./degree.service.js";

@Module({
  controllers: [DegreeController],
  providers: [DegreeService],
})
export class DegreeModule {}
