import { Module } from "@nestjs/common";
import { AdminNoticesController, PublicNoticesController } from "./notices.controller.js";
import { NoticesService } from "./notices.service.js";

@Module({
  controllers: [PublicNoticesController, AdminNoticesController],
  providers: [NoticesService],
})
export class NoticesModule {}
