import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { RedisService } from "../../redis/redis.service.js";

const RESET_TTL_SEC = 1800;
const resetKey = (rawToken: string) =>
  `pwreset:${createHash("sha256").update(rawToken).digest("hex")}`;

@Injectable()
export class PasswordService {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: this.config.getOrThrow<number>("auth.argon.memoryCost"),
      timeCost: this.config.getOrThrow<number>("auth.argon.timeCost"),
      parallelism: this.config.getOrThrow<number>("auth.argon.parallelism"),
    });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  async issueResetToken(userId: string): Promise<string> {
    const raw = randomBytes(32).toString("base64url");
    await this.redis.setEx(resetKey(raw), userId, RESET_TTL_SEC);
    return raw;
  }

  async consumeResetToken(rawToken: string): Promise<string | null> {
    const key = resetKey(rawToken);
    const userId = await this.redis.get(key);
    if (userId) await this.redis.del(key);
    return userId;
  }
}
