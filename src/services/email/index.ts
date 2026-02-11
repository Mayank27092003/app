import { Logger } from "../../utils/logger";
import { EmailPayload, EmailProvider } from "./email.interface";
import { NodemailerService } from "./nodemailer.service";

export class EmailService {
  private static instance: EmailService;
  private provider: EmailProvider;

  private constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  static init(provider: EmailProvider = new NodemailerService()): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService(provider);
    }
    return EmailService.instance;
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      Logger.warn(
        "[EmailService] getInstance() called before init(). Initializing with default provider."
      );
      EmailService.instance = new EmailService(new NodemailerService());
    }
    return EmailService.instance;
  }

  setProvider(provider: EmailProvider) {
    Logger.info(
      "[EmailService] Switching email provider to:" + provider.constructor.name
    );
    this.provider = provider;
  }

  async send(payload: EmailPayload): Promise<{ success: boolean }> {
    const providerName = this.provider.constructor.name;
    try {
      await this.provider.sendEmail(payload);
      return { success: true };
    } catch (err: any) {
      Logger.error(
        `[EmailService] Failed to send email via ${providerName}` + err?.message
      );
      return { success: false };
    }
  }
}

// ✅ Default export: ready-to-use instance with Nodemailer
const emailService = EmailService.init();
export default emailService;
