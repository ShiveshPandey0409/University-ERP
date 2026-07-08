import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { UserType } from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../redis/redis.service.js";

const userKey = (username: string) => `login:u:${username.toLowerCase()}`;
const ipKey = (ip: string) => `login:ip:${ip}`;

@Injectable()
export class LoginAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private get max(): number {
    return this.config.getOrThrow<number>("rateLimit.loginMax");
  }
  private get windowSec(): number {
    return this.config.getOrThrow<number>("rateLimit.loginWindowSec");
  }

  /** Throws 429 if the username or IP has exceeded the failure threshold. */
  async assertNotRateLimited(username: string, ip: string): Promise<void> {
    const [uCount, ipRaw] = await Promise.all([
      this.redis.get(userKey(username)),
      this.redis.get(ipKey(ip)),
    ]);
    const uFails = uCount ? Number(uCount) : 0;
    const ipFails = ipRaw ? Number(ipRaw) : 0;
    if (uFails >= this.max || ipFails >= this.max * 5) {
      throw new HttpException(
        { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async onFailure(username: string, ip: string): Promise<void> {
    await Promise.all([
      this.redis.incrWithWindow(userKey(username), this.windowSec),
      this.redis.incrWithWindow(ipKey(ip), this.windowSec),
    ]);
  }

  async onSuccess(username: string, ip: string): Promise<void> {
    await Promise.all([this.redis.del(userKey(username)), this.redis.del(ipKey(ip))]);
  }

  async record(params: {
    usernameAttempted: string;
    ip: string;
    userAgent?: string | null;
    success: boolean;
    userId?: string | null;
    userType?: UserType | null;
    failureReason?: string | null;
  }): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        usernameAttempted: params.usernameAttempted,
        ip: params.ip,
        userAgent: params.userAgent ?? null,
        success: params.success,
        userId: params.userId ?? null,
        userType: params.userType ?? null,
        failureReason: params.failureReason ?? null,
      },
    });
  }
}
