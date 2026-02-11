import { EmailService } from "./index";
import { Logger } from "../../utils/logger";

export interface JobInviteEmailData {
  inviteId: number;
  jobId: number;
  jobTitle: string;
  jobDescription: string;
  payAmount: number;
  pickupLocation?: any;
  dropoffLocation?: any;
  invitedUser: {
    name: string;
    email: string;
  };
  invitedByUser: {
    name: string;
    email: string;
  };
  message?: string;
}

export class JobInviteEmailService {
  /**
   * Send job invitation email to the invited user
   */
  static async sendJobInviteEmail(data: JobInviteEmailData): Promise<void> {
    try {
      const emailService = EmailService.getInstance();

      const subject = `Job Invitation: ${data.jobTitle}`;

      const pickupLocationText = data.pickupLocation
        ? `${data.pickupLocation.address || ""}, ${data.pickupLocation.city || ""}, ${data.pickupLocation.state || ""} ${data.pickupLocation.zipCode || ""}`
        : "Not specified";

      const dropoffLocationText = data.dropoffLocation
        ? `${data.dropoffLocation.address || ""}, ${data.dropoffLocation.city || ""}, ${data.dropoffLocation.state || ""} ${data.dropoffLocation.zipCode || ""}`
        : "Not specified";

      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(data.payAmount);

      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 0;
              background-color: #f5f5f5;
            }
            .email-container {
              background-color: #ffffff;
              margin: 20px auto;
              border: 1px solid #ddd;
            }
            .header {
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
              color: white;
              padding: 30px 40px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .header .subtitle {
              margin-top: 10px;
              font-size: 14px;
              opacity: 0.95;
            }
            .content {
              padding: 40px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
              color: #1e3a8a;
            }
            .info-section {
              background-color: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 4px;
              padding: 25px;
              margin: 25px 0;
            }
            .info-section h2 {
              margin: 0 0 20px 0;
              font-size: 18px;
              color: #1e3a8a;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #495057;
              width: 40%;
            }
            .info-value {
              color: #212529;
              width: 60%;
              text-align: right;
            }
            .highlight-box {
              background-color: #e7f3ff;
              border-left: 4px solid #3b82f6;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .cta-button {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .cta-button:hover {
              background-color: #2563eb;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 30px 40px;
              text-align: center;
              border-top: 2px solid #e9ecef;
              font-size: 12px;
              color: #6c757d;
            }
            .footer p {
              margin: 5px 0;
            }
            .footer .company-name {
              font-weight: bold;
              color: #1e3a8a;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>GOFRTS</h1>
              <div class="subtitle">Job Invitation</div>
            </div>
            
            <div class="content">
              <div class="greeting">
                <p>Hello ${data.invitedUser.name},</p>
              </div>
              
              <p><strong>${data.invitedByUser.name}</strong> has invited you to apply for a job on Gofrts!</p>
              
              ${data.message ? `
              <div class="highlight-box">
                <strong>Message from ${data.invitedByUser.name}:</strong><br>
                ${data.message}
              </div>
              ` : ''}
              
              <div class="info-section">
                <h2>Job Details</h2>
                <div class="info-row">
                  <span class="info-label">Job Title:</span>
                  <span class="info-value">${data.jobTitle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Pay Amount:</span>
                  <span class="info-value">${formattedAmount}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Pickup Location:</span>
                  <span class="info-value">${pickupLocationText}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Delivery Location:</span>
                  <span class="info-value">${dropoffLocationText}</span>
                </div>
              </div>
              
              ${data.jobDescription ? `
              <div class="highlight-box">
                <strong>Job Description:</strong><br>
                ${data.jobDescription}
              </div>
              ` : ''}
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://gofrts.com'}/jobs/${data.jobId}" class="cta-button">
                  View Job & Apply
                </a>
              </p>
              
              <p>Log in to your Gofrts account to view the full job details and submit your application.</p>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Thank you for using <strong>Gofrts</strong>!</p>
            </div>
            
            <div class="footer">
              <p class="company-name">Gofrts</p>
              <p>This is an automated invitation email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Gofrts. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await emailService.send({
        to: data.invitedUser.email,
        subject,
        html: htmlTemplate,
      });

      if (result.success) {
        Logger.info(`📧 Job invitation email sent to ${data.invitedUser.email} for job ${data.jobId}`);
      } else {
        Logger.error(`Failed to send job invitation email to ${data.invitedUser.email}`);
      }
    } catch (error: any) {
      Logger.error(`Error sending job invitation email: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }
}

