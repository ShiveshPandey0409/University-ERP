import { Module } from "@nestjs/common";
import { AdminExamController, CollegeExamController } from "./exam.controller.js";
import { ExamFormsService } from "./exam.service.js";

@Module({
  controllers: [AdminExamController, CollegeExamController],
  providers: [ExamFormsService],
})
export class ExamModule {}
