import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { RedisService } from "./redis.service.js";
import { REDIS_CLIENT } from "./redis.constants.js";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>("redisUrl");
        return new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
