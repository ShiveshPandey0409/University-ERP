import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";
import { AppModule } from "../../src/app.module.js";

export async function createTestApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ["error", "warn"] },
  );
  await app.register(fastifyCookie);
  app.setGlobalPrefix("api");
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
