import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { REDIS_CLIENT } from "./redis.constants.js";

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  get client(): Redis {
    return this.redis;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async setEx(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /** Increments a counter with a fixed window; returns the new count. */
  async incrWithWindow(key: string, windowSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return count;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
