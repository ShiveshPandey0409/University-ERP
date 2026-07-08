import { createHash, randomInt } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { RedisService } from "../../redis/redis.service.js";
import { NotificationService } from "../notifications/notification.service.js";

const OTP_TTL_SEC = 300;
const MAX_ATTEMPTS = 5;

const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");
const codeKey = (purpose: string, key: string) => `otp:${purpose}:${key}`;
const attemptsKey = (purpose: string, key: string) => `otp:${purpose}:${key}:attempts`;

@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisService,
    private readonly notifications: NotificationService,
  ) {}

  async send(purpose: string, key: string): Promise<void> {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.redis.setEx(codeKey(purpose, key), hashCode(code), OTP_TTL_SEC);
    await this.redis.del(attemptsKey(purpose, key));
    await this.notifications.sendOtp(key, code);
  }

  async verify(purpose: string, key: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(codeKey(purpose, key));
    if (!stored) return false;

    const attempts = await this.redis.incrWithWindow(attemptsKey(purpose, key), OTP_TTL_SEC);
    if (attempts > MAX_ATTEMPTS) {
      await this.redis.del(codeKey(purpose, key));
      return false;
    }

    const ok = stored === hashCode(code);
    if (ok) {
      await this.redis.del(codeKey(purpose, key));
      await this.redis.del(attemptsKey(purpose, key));
    }
    return ok;
  }
}
