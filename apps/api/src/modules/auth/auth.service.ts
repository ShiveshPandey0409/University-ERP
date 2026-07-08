import { Injectable, UnauthorizedException } from "@nestjs/common";
import type {
  AuthUser,
  ForgotPasswordInput,
  LoginRequest,
  ResetPasswordInput,
  SendOtpInput,
  VerifyOtpInput,
} from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { PasswordService } from "./password.service.js";
import { TokenService } from "./token.service.js";
import { OtpService } from "./otp.service.js";
import { LoginAttemptService } from "./login-attempt.service.js";
import { UserContextService } from "./user-context.service.js";
import { NotificationService } from "../notifications/notification.service.js";

export interface RequestMeta {
  ip: string;
  userAgent?: string | null;
}

export type LoginResult =
  | { kind: "mfa_required"; challengeId: string }
  | { kind: "success"; user: AuthUser; accessToken: string; rawRefreshToken: string };

const INVALID = { code: "INVALID_CREDENTIALS", message: "Invalid username or password" };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly otp: OtpService,
    private readonly loginAttempts: LoginAttemptService,
    private readonly userContext: UserContextService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  async login(input: LoginRequest, meta: RequestMeta): Promise<LoginResult> {
    await this.loginAttempts.assertNotRateLimited(input.username, meta.ip);

    const user = await this.prisma.user.findUnique({
      where: { userType_username: { userType: input.loginType, username: input.username } },
    });

    const fail = async (reason: string): Promise<never> => {
      await this.loginAttempts.onFailure(input.username, meta.ip);
      await this.loginAttempts.record({
        usernameAttempted: input.username,
        ip: meta.ip,
        userAgent: meta.userAgent,
        success: false,
        userId: user?.id ?? null,
        userType: input.loginType,
        failureReason: reason,
      });
      throw new UnauthorizedException(INVALID);
    };

    if (!user || user.deletedAt) return fail("user_not_found");
    if (!(await this.passwords.verify(user.passwordHash, input.password))) {
      return fail("bad_password");
    }
    if (user.status !== "active") return fail(`status_${user.status}`);

    // MFA (mandatory for admins/finance; enforced via user.mfaEnabled).
    if (user.mfaEnabled) {
      if (!input.otpCode) {
        await this.otp.send("login", user.id);
        return { kind: "mfa_required", challengeId: user.id };
      }
      if (!(await this.otp.verify("login", user.id, input.otpCode))) {
        return fail("bad_otp");
      }
    }

    await this.loginAttempts.onSuccess(input.username, meta.ip);
    const sessionId = await this.tokens.createSession(user.id, meta.ip, meta.userAgent ?? undefined);
    const rawRefreshToken = await this.tokens.issueRefreshToken(
      sessionId,
      user.id,
      meta.ip,
      meta.userAgent ?? undefined,
    );
    const accessToken = await this.tokens.signAccessToken({
      userId: user.id,
      sessionId,
      userType: user.userType,
      roleVersion: user.roleVersion,
    });

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.loginAttempts.record({
      usernameAttempted: input.username,
      ip: meta.ip,
      userAgent: meta.userAgent,
      success: true,
      userId: user.id,
      userType: user.userType,
    });
    await this.audit.write({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "session",
      entityId: sessionId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    const authUser = await this.userContext.buildAuthUser(user.id);
    return { kind: "success", user: authUser, accessToken, rawRefreshToken };
  }

  async refresh(
    rawRefreshToken: string,
    meta: RequestMeta,
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    const rotated = await this.tokens.rotateRefresh(
      rawRefreshToken,
      meta.ip,
      meta.userAgent ?? undefined,
    );
    const accessToken = await this.tokens.signAccessToken({
      userId: rotated.userId,
      sessionId: rotated.sessionId,
      userType: rotated.userType,
      roleVersion: rotated.roleVersion,
    });
    return { accessToken, rawRefreshToken: rotated.rawRefreshToken };
  }

  async logout(rawRefreshToken: string | undefined, meta: RequestMeta): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const { userId, sessionId } = await this.tokens.verifyRefresh(rawRefreshToken);
      await this.tokens.revokeSession(sessionId);
      await this.audit.write({
        actorUserId: userId,
        action: "auth.logout",
        entityType: "session",
        entityId: sessionId,
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch {
      // Already-invalid token → nothing to revoke.
    }
  }

  async sessionUser(rawRefreshToken: string | undefined): Promise<AuthUser> {
    if (!rawRefreshToken) throw new UnauthorizedException({ code: "UNAUTHENTICATED" });
    const { userId } = await this.tokens.verifyRefresh(rawRefreshToken);
    return this.userContext.buildAuthUser(userId);
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { userType_username: { userType: input.loginType, username: input.username } },
    });
    // Always succeed (no user enumeration).
    if (!user || user.status !== "active") return;
    const token = await this.passwords.issueResetToken(user.id);
    await this.notifications.sendPasswordReset(user.email ?? user.username, token);
    await this.audit.write({
      actorUserId: user.id,
      action: "auth.password.reset_requested",
      entityType: "user",
      entityId: user.id,
    });
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const userId = await this.passwords.consumeResetToken(input.token);
    if (!userId) throw new UnauthorizedException({ code: "INVALID_RESET_TOKEN" });
    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    await this.tokens.revokeAllUserSessions(userId);
    await this.audit.write({
      actorUserId: userId,
      action: "auth.password.reset",
      entityType: "user",
      entityId: userId,
    });
  }

  async sendOtp(input: SendOtpInput): Promise<void> {
    await this.otp.send(input.purpose, input.key);
  }

  async verifyOtp(input: VerifyOtpInput): Promise<{ verified: boolean }> {
    return { verified: await this.otp.verify(input.purpose, input.key, input.otpCode) };
  }
}
