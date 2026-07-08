import { Module } from "@nestjs/common";
import { MarksBatchController, MarksController, ResultsController } from "./results.controller.js";
import { MarksService } from "./marks.service.js";
import { MarksBatchService } from "./marks-batch.service.js";
import { ResultsService } from "./results.service.js";

@Module({
  controllers: [MarksController, ResultsController, MarksBatchController],
  providers: [MarksService, MarksBatchService, ResultsService],
})
export class ResultsModule {}
