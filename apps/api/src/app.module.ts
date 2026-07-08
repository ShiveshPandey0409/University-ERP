import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DiscoveryModule } from "@nestjs/core";
import { configuration } from "./config/configuration.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RedisModule } from "./redis/redis.module.js";
import { RbacModule } from "./modules/rbac/rbac.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";
import { NotificationsModule } from "./modules/notifications/notifications.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { MasterDataModule } from "./modules/master-data/master-data.module.js";
import { AcademicModule } from "./modules/academic/academic.module.js";
import { ExamModule } from "./modules/exam/exam.module.js";
import { ResultsModule } from "./modules/results/results.module.js";
import { PublicModule } from "./modules/public/public.module.js";
import { globalProviders } from "./bootstrap/global-providers.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ["../../.env", ".env"],
      load: [configuration],
    }),
    DiscoveryModule,
    PrismaModule,
    RedisModule,
    RbacModule,
    AuditModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    HealthModule,
    MasterDataModule,
    AcademicModule,
    ExamModule,
    ResultsModule,
    PublicModule,
  ],
  providers: [...globalProviders],
})
export class AppModule {}
