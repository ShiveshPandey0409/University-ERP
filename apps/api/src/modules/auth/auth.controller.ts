import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  forgotPasswordSchema,
  loginRequestSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  type ForgotPasswordInput,
  type LoginRequest,
  type ResetPasswordInput,
  type SendOtpInput,
  type VerifyOtpInput,
} from "@erp/shared";
import { Public } from "../../common/decorators/public.decorator.js";
import { Authenticated } from "../../common/decorators/authenticated.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { AuthService, type RequestMeta } from "./auth.service.js";
import { UserContextService } from "./user-context.service.js";

const REFRESH_COOKIE = "rt";
const REFRESH_PATH = "/api/auth";

type ReqWithCookies = FastifyRequest & { cookies: Record<string, string | undefined> };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly userContext: UserContextService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.auth.login(body, this.meta(req));
    if (result.kind === "mfa_required") {
      return { mfaRequired: true, challengeId: result.challengeId };
    }
    this.setRefreshCookie(res, result.rawRefreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const raw = (req as ReqWithCookies).cookies[REFRESH_COOKIE];
    const result = await this.auth.refresh(raw ?? "", this.meta(req));
    this.setRefreshCookie(res, result.rawRefreshToken);
    return { accessToken: result.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const raw = (req as ReqWithCookies).cookies[REFRESH_COOKIE];
    await this.auth.logout(raw, this.meta(req));
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @Public()
  @Get("session")
  async session(@Req() req: FastifyRequest) {
    const raw = (req as ReqWithCookies).cookies[REFRESH_COOKIE];
    return { user: await this.auth.sessionUser(raw) };
  }

  @Authenticated()
  @Get("me")
  async me(@CurrentUser() principal: AuthenticatedPrincipal) {
    return { user: await this.userContext.buildAuthUser(principal.userId) };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput,
  ) {
    await this.auth.forgotPassword(body);
    return { ok: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput,
  ) {
    await this.auth.resetPassword(body);
    return { ok: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("send-otp")
  async sendOtp(@Body(new ZodValidationPipe(sendOtpSchema)) body: SendOtpInput) {
    await this.auth.sendOtp(body);
    return { ok: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("verify-otp")
  async verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) body: VerifyOtpInput) {
    return this.auth.verifyOtp(body);
  }

  private meta(req: FastifyRequest): RequestMeta {
    return { ip: req.ip, userAgent: req.headers["user-agent"] ?? null };
  }

  private setRefreshCookie(res: FastifyReply, value: string): void {
    res.setCookie(REFRESH_COOKIE, value, {
      httpOnly: true,
      secure: this.config.getOrThrow<boolean>("auth.cookieSecure"),
      sameSite: "strict",
      path: REFRESH_PATH,
      maxAge: this.config.getOrThrow<number>("auth.refreshTtlDays") * 24 * 60 * 60,
    });
  }

  private clearRefreshCookie(res: FastifyReply): void {
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
  }
}
