import emailService from "./index";
import { getOtpEmailTemplate, getOtpEmailSubject, OtpEmailTemplateData } from "./templates";
import { Logger } from "../../utils/logger";
import { OtpPurposeType } from "../../constants/otp";

/**
 * Service for sending OTP emails with proper templates
 */
export class OtpEmailService {
  /**
   * Send OTP email with a well-designed template
   */
  static async sendOtpEmail(data: OtpEmailTemplateData): Promise<void> {
    try {
      const html = getOtpEmailTemplate(data);
      const subject = getOtpEmailSubject(data.purpose);

      await emailService.send({
        to: data.email || "",
        subject,
        html,
      });

      Logger.info(
        `📧 OTP email sent to ${data.email} for ${data.purpose} via ${emailService["provider"]?.constructor.name}`
      );
    } catch (error: any) {
      Logger.error(`❌ Failed to send OTP email to ${data.email}: ${error.message}`);
      throw error;
    }
  }
}

