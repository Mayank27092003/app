import { OtpPurposeType } from "../../constants/otp";

export interface OtpEmailTemplateData {
  email: string;
  otp: string;
  purpose: OtpPurposeType;
  userName?: string;
  callbackUrl?: string;
  verificationToken?: string;
  expiresInMinutes?: number;
}

/**
 * Base email template wrapper with gofrts branding
 */
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>gofrts</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 5px !important;
        border-radius: 12px !important;
      }
      .email-content {
        padding: 25px 20px !important;
      }
      .email-header {
        padding: 20px 20px 18px 20px !important;
      }
      .email-footer {
        padding: 20px 15px !important;
      }
      .logo-container {
        width: 50px !important;
        height: 50px !important;
        margin-bottom: 8px !important;
      }
      .logo-img {
        width: 42px !important;
        height: 42px !important;
        border-width: 2px !important;
      }
      .header-title {
        font-size: 22px !important;
        margin-bottom: 4px !important;
      }
      .header-subtitle {
        font-size: 11px !important;
        margin-top: 4px !important;
      }
    }
    @media only screen and (max-width: 480px) {
      .email-content {
        padding: 20px 15px !important;
      }
      .email-header {
        padding: 18px 15px 16px 15px !important;
      }
      .email-footer {
        padding: 15px 12px !important;
      }
      .header-title {
        font-size: 20px !important;
      }
      .logo-container {
        width: 50px !important;
        height: 50px !important;
      }
      .logo-img {
        width: 42px !important;
        height: 42px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%); line-height: 1.6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%); padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 10px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); overflow: hidden; border: 1px solid #e9ecef; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td class="email-header" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ff974c 100%); padding: 25px 20px 20px 20px; text-align: center; position: relative; width: 100%;">
              <div class="logo-container" style="background: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 15px rgba(0, 0, 0, 0.2);">
                <img src="https://www.gofrts.com/images/profile.jpeg" alt="gofrts Logo" class="logo-img" style="width: 50px; height: 50px; border-radius: 50%; margin-top: 20px; object-fit: cover; border: 2px solid rgba(255, 255, 255, 0.3); display: block; max-width: 100%;" />
              </div>
              <h1 class="header-title" style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                gofrts
              </h1>
              <p class="header-subtitle" style="margin: 3px 0 0 0; font-size: 11px; font-weight: 500; letter-spacing: 0.5px;">
                Your Trusted Partner
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 30px 40px; background-color: #ffffff; width: 100%;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%); padding: 25px 20px; text-align: center; border-top: 2px solid #f1f3f5; width: 100%;">
              <p style="margin: 0 0 6px 0; color: #495057; font-size: 13px; font-weight: 600;">
                © ${new Date().getFullYear()} gofrts. All rights reserved.
              </p>
              <p style="margin: 0 0 12px 0; color: #6c757d; font-size: 12px;">
                If you didn't request this email, please ignore it.
              </p>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #adb5bd; font-size: 11px; line-height: 1.6;">
                  This is an automated email. Please do not reply to this message.<br>
                  For support, contact us at <a href="mailto:support@gofrts.com" style="color: #ff974c; text-decoration: none; font-weight: 500;">support@gofrts.com</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate OTP email template based on purpose
 */
export function getOtpEmailTemplate(data: OtpEmailTemplateData): string {
  const {
    otp,
    purpose,
    userName,
    callbackUrl,
    verificationToken,
    expiresInMinutes = 10,
  } = data;

  let title = "";
  let message = "";
  let icon = "🔐";
  let buttonText = "";
  let buttonUrl = "";

  switch (purpose) {
    case "email_verification":
      title = "Verify Your Email Address";
      message = userName
        ? `Hi ${userName}, welcome to gofrts! Please verify your email address to complete your registration.`
        : "Welcome to gofrts! Please verify your email address to complete your registration.";
      icon = "✉️";
      buttonText = "Verify Email";
      if (callbackUrl && verificationToken) {
        buttonUrl = `${callbackUrl}?verificationToken=${verificationToken}`;
      }
      break;

    case "password_reset":
      title = "Reset Your Password";
      message = userName
        ? `Hi ${userName}, you requested to reset your password. Use the OTP below to proceed.`
        : "You requested to reset your password. Use the OTP below to proceed.";
      icon = "🔑";
      buttonText = "Reset Password";
      if (callbackUrl && verificationToken) {
        buttonUrl = `${callbackUrl}?resetToken=${verificationToken}`;
      }
      break;

    case "phone_verification":
      title = "Verify Your Phone Number";
      message = userName
        ? `Hi ${userName}, please verify your phone number with the OTP below.`
        : "Please verify your phone number with the OTP below.";
      icon = "📱";
      break;

    case "payment_verification":
      title = "Payment Verification";
      message = userName
        ? `Hi ${userName}, please verify your payment with the OTP below.`
        : "Please verify your payment with the OTP below.";
      icon = "💳";
      break;

    default:
      title = "Your Verification Code";
      message = "Please use the OTP below to complete your request.";
      icon = "🔐";
  }

  const otpSection = `
    <div style="text-align: center; margin: 25px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ff974c 100%); padding: 25px 40px; border-radius: 16px; box-shadow: 0 8px 24px rgba(255, 151, 76, 0.4); position: relative; overflow: hidden; max-width: 100%; box-sizing: border-box;">
        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%); pointer-events: none;"></div>
        <p style="margin: 0 0 12px 0; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; position: relative; z-index: 1;">
          Your Verification Code
        </p>
        <div style="font-size: 38px; font-weight: 800; color: #ffffff; letter-spacing: 10px; font-family: 'Courier New', monospace; position: relative; z-index: 1; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); word-break: break-all; line-height: 1.2;">
          ${otp}
        </div>
        <div style="margin-top: 12px; position: relative; z-index: 1;">
          <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 11px; font-weight: 500;">
            Valid for ${expiresInMinutes} minutes
          </p>
        </div>
      </div>
    </div>
    <style>
      @media only screen and (max-width: 600px) {
        .otp-container {
          padding: 20px 30px !important;
          margin: 20px 0 !important;
        }
        .otp-code {
          font-size: 30px !important;
          letter-spacing: 8px !important;
        }
        .otp-label {
          font-size: 11px !important;
          letter-spacing: 1px !important;
          margin-bottom: 10px !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .otp-container {
          padding: 18px 25px !important;
          margin: 18px 0 !important;
        }
        .otp-code {
          font-size: 26px !important;
          letter-spacing: 6px !important;
        }
      }
    </style>
  `;

  const buttonSection = buttonUrl
    ? `
    <div style="text-align: center; margin: 25px 0;">
      <a href="${buttonUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ff974c 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 6px 20px rgba(255, 151, 76, 0.4); transition: all 0.3s ease; letter-spacing: 0.5px; max-width: 100%; box-sizing: border-box;">
        ${buttonText}
      </a>
    </div>
    <p style="text-align: center; color: #6c757d; font-size: 13px; margin-top: 18px; font-weight: 500;">
      Or use the verification code above
    </p>
    <style>
      @media only screen and (max-width: 600px) {
        .email-button {
          padding: 12px 28px !important;
          font-size: 14px !important;
          display: block !important;
          width: 90% !important;
          margin: 0 auto !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .email-button {
          padding: 11px 24px !important;
          font-size: 13px !important;
        }
      }
    </style>
  `
    : "";

  const content = `
    <div style="text-align: center; margin-bottom: 20px; width: 100%;">
      <div class="content-icon" style="width: 20px; height: 20px; margin: 0 auto 12px; display: inline-block; font-size: 20px; line-height: 20px; vertical-align: middle;">
        ${icon}
      </div>
      <h2 class="content-title" style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; width: 100%;">
        ${title}
      </h2>
      <p class="content-message" style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto; width: 100%; box-sizing: border-box; padding: 0 10px;">
        ${message}
      </p>
    </div>
    
    ${otpSection}
    
    ${buttonSection}
    
    <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #f1f3f5; width: 100%;">
      <div class="security-box" style="background-color: #fef3c7; padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b; width: 100%; box-sizing: border-box;">
        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6; font-weight: 500;">
          <span style="font-size: 14px; margin-right: 6px;">🔒</span>
          <strong>Security Tip:</strong> Never share this code with anyone. gofrts will never ask for your verification code via phone or email.
        </p>
      </div>
    </div>
    <style>
      @media only screen and (max-width: 600px) {
        .content-icon {
          width: 18px !important;
          height: 18px !important;
          font-size: 18px !important;
          line-height: 18px !important;
          margin-bottom: 10px !important;
        }
        .content-title {
          font-size: 20px !important;
          margin-bottom: 10px !important;
        }
        .content-message {
          font-size: 14px !important;
        }
        .security-box {
          padding: 14px !important;
          font-size: 12px !important;
          margin-top: 20px !important;
          padding-top: 15px !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .content-icon {
          width: 16px !important;
          height: 16px !important;
          font-size: 16px !important;
          line-height: 16px !important;
          margin-bottom: 8px !important;
        }
        .content-title {
          font-size: 18px !important;
          margin-bottom: 8px !important;
        }
        .content-message {
          font-size: 13px !important;
        }
        .security-box {
          padding: 12px !important;
          font-size: 11px !important;
          margin-top: 18px !important;
          padding-top: 12px !important;
        }
      }
    </style>
  `;

  return getBaseTemplate(content);
}

/**
 * Get email subject based on OTP purpose
 */
export function getOtpEmailSubject(purpose: OtpPurposeType): string {
  const subjects: Record<OtpPurposeType, string> = {
    email_verification: "gofrts – Verify Your Email Address",
    phone_verification: "gofrts – Verify Your Phone Number",
    password_reset: "gofrts – Reset Your Password",
    payment_verification: "gofrts – Payment Verification",
  };

  return subjects[purpose] || "gofrts – Verification Code";
}

/**
 * Password change notification email template
 */
export function getPasswordChangeEmailTemplate(userName?: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 20px; width: 100%;">
      <div class="password-icon" style="width: 20px; height: 20px; margin: 0 auto 12px; display: inline-block; font-size: 20px; line-height: 20px; vertical-align: middle;">
        🔐
      </div>
      <h2 class="password-title" style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; width: 100%;">
        Your Password Has Been Changed
      </h2>
      <p class="password-message" style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto; width: 100%; box-sizing: border-box; padding: 0 10px;">
        ${userName ? `Hi ${userName},` : "Hi,"} this is a confirmation that your password was successfully updated.
      </p>
    </div>
    
    <div class="alert-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 18px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2); width: 100%; box-sizing: border-box;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6; font-weight: 500;">
        <span style="font-size: 16px; margin-right: 6px;">⚠️</span>
        <strong>Security Alert:</strong> If you didn't perform this action, please 
        <a href="mailto:support@gofrts.com" style="color: #b45309; text-decoration: underline; font-weight: 600;">contact our support team</a> immediately.
      </p>
    </div>
    
    <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #f1f3f5; width: 100%;">
      <div class="recommendation-box" style="background: linear-gradient(135deg, #fff4e6 0%, #ffe8cc 100%); padding: 18px; border-radius: 12px; border-left: 4px solid #ff974c; width: 100%; box-sizing: border-box;">
        <p style="margin: 0; color: #b45309; font-size: 14px; line-height: 1.6; font-weight: 500;">
          <span style="font-size: 14px; margin-right: 6px;">💡</span>
          <strong>Security Recommendation:</strong> For your security, we recommend using a strong, unique password and enabling two-factor authentication if available.
        </p>
      </div>
    </div>
    <style>
      @media only screen and (max-width: 600px) {
        .password-icon {
          width: 18px !important;
          height: 18px !important;
          font-size: 18px !important;
          line-height: 18px !important;
          margin-bottom: 10px !important;
        }
        .password-title {
          font-size: 20px !important;
          margin-bottom: 10px !important;
        }
        .password-message {
          font-size: 14px !important;
        }
        .alert-box {
          padding: 16px !important;
          font-size: 13px !important;
          margin: 20px 0 !important;
        }
        .recommendation-box {
          padding: 16px !important;
          font-size: 13px !important;
          margin-top: 20px !important;
          padding-top: 15px !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .password-icon {
          width: 16px !important;
          height: 16px !important;
          font-size: 16px !important;
          line-height: 16px !important;
          margin-bottom: 8px !important;
        }
        .password-title {
          font-size: 18px !important;
          margin-bottom: 8px !important;
        }
        .password-message {
          font-size: 13px !important;
        }
        .alert-box {
          padding: 14px !important;
          font-size: 12px !important;
          margin: 18px 0 !important;
        }
        .recommendation-box {
          padding: 14px !important;
          font-size: 12px !important;
          margin-top: 18px !important;
          padding-top: 12px !important;
        }
      }
    </style>
  `;

  return getBaseTemplate(content);
}

