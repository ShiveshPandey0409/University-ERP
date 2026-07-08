import { Injectable, Logger } from "@nestjs/common";

/** Dev-stub notification provider. OTPs and reset tokens are logged to the
 * console; a real SMS/email adapter (MSG91/Twilio/SES, MailHog in dev) drops in
 * behind this same interface without touching callers. */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger("Notification");

  async sendOtp(to: string, code: string): Promise<void> {
    this.logger.log(`[DEV OTP] to=${to} code=${code}`);
  }

  async sendPasswordReset(to: string, rawToken: string): Promise<void> {
    this.logger.log(`[DEV PASSWORD RESET] to=${to} token=${rawToken}`);
  }
}
