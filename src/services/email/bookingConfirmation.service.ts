import emailService from "./index";
import { Logger } from "../../utils/logger";
import { generateLoadBookingConfirmationPDF, LoadBookingConfirmationData } from "../pdf/loadBookingConfirmation";

/**
 * Service for sending load booking confirmation emails with PDF attachments
 */
export class BookingConfirmationEmailService {
  /**
   * Send booking confirmation email with PDF to both parties
   * @param data - Load booking confirmation data
   * @returns Promise resolving to success status for both emails
   */
  static async sendBookingConfirmationEmails(
    data: LoadBookingConfirmationData
  ): Promise<{ postedBySent: boolean; acceptedBySent: boolean }> {
    try {
      // Generate PDF once
      const pdfBuffer = await generateLoadBookingConfirmationPDF(data);
      
      const pdfFilename = `Load-Booking-Confirmation-${data.bookingId}.pdf`;
      
      // Email subject
      const subject = `Load Booking Confirmation - ${data.bookingId}`;
      
      // Email HTML template - Professional style matching PDF
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
            .company-info {
              background-color: #f8f9fa;
              padding: 20px 40px;
              border-bottom: 2px solid #e9ecef;
              font-size: 12px;
              color: #666;
            }
            .company-info strong {
              color: #1e3a8a;
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
            .parties-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 25px 0;
            }
            .party-box {
              background-color: #ffffff;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              padding: 20px;
            }
            .party-box h3 {
              margin: 0 0 15px 0;
              font-size: 16px;
              color: #1e3a8a;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 8px;
            }
            .party-box p {
              margin: 8px 0;
              font-size: 14px;
            }
            .party-box strong {
              color: #495057;
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
            .attachment-notice {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 4px;
              padding: 15px;
              margin: 25px 0;
              text-align: center;
            }
            .attachment-notice strong {
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>GOFRTS</h1>
              <div class="subtitle">Load Booking Confirmation</div>
            </div>
            
            <div class="company-info">
              <strong>Gofrts</strong> - Your Trusted Partner<br>
              Order #: ${data.bookingId} | Load #: ${data.loadId}<br>
              Date: ${data.bookingDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
            
            <div class="content">
              <div class="greeting">
                Dear ${data.postedBy.name || "Valued Customer"},
              </div>
              
              <p>Your load booking has been confirmed! Please find the detailed confirmation document attached to this email.</p>
              
              <div class="attachment-notice">
                <strong>📎 Confirmation Document Attached</strong><br>
                Please review the attached PDF for complete booking details and keep it for your records.
              </div>
              
              <div class="info-section">
                <h2>Booking Information</h2>
                <div class="info-row">
                  <span class="info-label">Booking ID:</span>
                  <span class="info-value"><strong>${data.bookingId}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Load ID:</span>
                  <span class="info-value"><strong>${data.loadId}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Agreed Rate:</span>
                  <span class="info-value"><strong style="color: #1e3a8a; font-size: 16px;">${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: data.payment.currency || "USD",
                  }).format(data.payment.amount)}</strong></span>
                </div>
              </div>
              
              <div class="info-section">
                <h2>Pickup Details</h2>
                <div class="info-row">
                  <span class="info-label">Location:</span>
                  <span class="info-value">${data.pickup.address}, ${data.pickup.city}, ${data.pickup.state} ${data.pickup.zipCode}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date & Time:</span>
                  <span class="info-value">${data.pickup.date} at ${data.pickup.time}</span>
                </div>
              </div>
              
              <div class="info-section">
                <h2>Delivery Details</h2>
                <div class="info-row">
                  <span class="info-label">Location:</span>
                  <span class="info-value">${data.delivery.address}, ${data.delivery.city}, ${data.delivery.state} ${data.delivery.zipCode}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date & Time:</span>
                  <span class="info-value">${data.delivery.date} at ${data.delivery.time}</span>
                </div>
              </div>
              
              ${data.commodity ? `
              <div class="info-section">
                <h2>Commodity Information</h2>
                <div class="info-row">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${data.commodity.type}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Weight:</span>
                  <span class="info-value">${data.commodity.weight} ${data.commodity.weightUnit}</span>
                </div>
                ${data.commodity.pieces ? `
                <div class="info-row">
                  <span class="info-label">Pieces:</span>
                  <span class="info-value">${data.commodity.pieces}</span>
                </div>
                ` : ''}
                ${data.commodity.distance ? `
                <div class="info-row">
                  <span class="info-label">Distance:</span>
                  <span class="info-value">${data.commodity.distance} miles</span>
                </div>
                ` : ''}
              </div>
              ` : ''}
              
              <div class="parties-section">
                <div class="party-box">
                  <h3>Posted By</h3>
                  <p><strong>Name:</strong> ${data.postedBy.name}</p>
                  <p><strong>Role:</strong> ${data.postedBy.role}</p>
                  <p><strong>Email:</strong> ${data.postedBy.email}</p>
                  ${data.postedBy.phone ? `<p><strong>Phone:</strong> ${data.postedBy.phone}</p>` : ''}
                </div>
                <div class="party-box">
                  <h3>Accepted By</h3>
                  <p><strong>Name:</strong> ${data.acceptedBy.name}</p>
                  <p><strong>Role:</strong> ${data.acceptedBy.role}</p>
                  <p><strong>Email:</strong> ${data.acceptedBy.email}</p>
                  ${data.acceptedBy.phone ? `<p><strong>Phone:</strong> ${data.acceptedBy.phone}</p>` : ''}
                </div>
              </div>
              
              ${data.specialRequirements ? `
              <div class="highlight-box">
                <strong>Special Requirements:</strong><br>
                ${data.specialRequirements}
              </div>
              ` : ''}
              
              <p style="margin-top: 30px;">If you have any questions or concerns, please contact our support team.</p>
              
              <p>Thank you for using <strong>Gofrts</strong>!</p>
            </div>
            
            <div class="footer">
              <p class="company-name">Gofrts</p>
              <p>This is an automated confirmation email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Gofrts. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Send email to Posted By user
      const postedByResult = await emailService.send({
        to: data.postedBy.email,
        subject,
        html: htmlTemplate,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      
      // Send email to Accepted By user
      const acceptedByResult = await emailService.send({
        to: data.acceptedBy.email,
        subject,
        html: htmlTemplate,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      
      Logger.info(
        `📧 Booking confirmation emails sent - Posted By: ${data.postedBy.email} (${postedByResult.success ? "✓" : "✗"}), Accepted By: ${data.acceptedBy.email} (${acceptedByResult.success ? "✓" : "✗"})`
      );
      
      return {
        postedBySent: postedByResult.success,
        acceptedBySent: acceptedByResult.success,
      };
    } catch (error: any) {
      Logger.error(
        `❌ Failed to send booking confirmation emails: ${error.message}`
      );
      throw error;
    }
  }
}

