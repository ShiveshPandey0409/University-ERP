import { Module } from "@nestjs/common";
import { PublicResultsController } from "./public.controller.js";
import { PublicService } from "./public.service.js";

@Module({
  controllers: [PublicResultsController],
  providers: [PublicService],
})
export class PublicModule {}
