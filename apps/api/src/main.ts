import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    trustProxy: true,
    genReqId: () => randomUUID(),
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);
  const config = app.get(ConfigService);

  await app.register(fastifyCookie);
  await app.register(helmet, { contentSecurityPolicy: false });

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: config.getOrThrow<string[]>("cors.origins"),
    credentials: true,
  });
  app.enableShutdownHooks();

  const port = config.getOrThrow<number>("port");
  await app.listen({ port, host: "0.0.0.0" });
  Logger.log(`API listening on http://localhost:${port}/api`, "Bootstrap");
}

void bootstrap();
