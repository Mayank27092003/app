import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { generateLoadBookingConfirmationPDF, LoadBookingConfirmationData } from "../../services/pdf/loadBookingConfirmation";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";

export class PDFController {
  /**
   * Generate and return load booking confirmation PDF
   * POST /api/v1/pdf/load-confirmation
   */
  async generateLoadConfirmationPDF(req: AuthenticatedRequest, res: Response) {
    try {
      const data: LoadBookingConfirmationData = req.body;

      // Validate required fields
      if (!data.bookingId || !data.loadId) {
        throw new HttpException("bookingId and loadId are required", 400);
      }

      if (!data.pickup || !data.delivery) {
        throw new HttpException("pickup and delivery information are required", 400);
      }

      if (!data.postedBy || !data.acceptedBy) {
        throw new HttpException("postedBy and acceptedBy user information are required", 400);
      }

      // Generate PDF
      const pdfBuffer = await generateLoadBookingConfirmationPDF(data);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Load-Booking-Confirmation-${data.bookingId}.pdf"`
      );

      // Send PDF
      res.send(pdfBuffer);

      Logger.info(`PDF generated for booking ${data.bookingId}`);
    } catch (error: any) {
      Logger.error(`Error generating PDF: ${error.message}`);
      throw new HttpException(
        error.message || "Failed to generate PDF",
        error.statusCode || 500
      );
    }
  }
}

