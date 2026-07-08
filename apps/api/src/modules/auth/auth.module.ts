import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PasswordService } from "./password.service.js";
import { TokenService } from "./token.service.js";
import { OtpService } from "./otp.service.js";
import { LoginAttemptService } from "./login-attempt.service.js";
import { UserContextService } from "./user-context.service.js";

@Module({
  imports: [JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    OtpService,
    LoginAttemptService,
    UserContextService,
  ],
  exports: [TokenService, PasswordService, UserContextService],
})
export class AuthModule {}
