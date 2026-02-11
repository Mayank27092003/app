import { Request, Response } from "express";
import QRCode from "qrcode";
import { API_PREFIX } from "../../constants";

const appStoreUrl =  `https://apps.apple.com/in/app/gofrts/id6754777503`
const playStoreUrl =  `https://play.google.com/store/apps/details?id=com.coinbase`

export class QRController {
  /**
   * QR Code route - redirects to App Store or Play Store based on device type
   * GET /qr or GET /qr/:type
   */
  redirectToAppStore = async (req: Request, res: Response) => {
    try {
      // Get user agent from request
      const userAgent = req.headers["user-agent"] || "";
      
      // App Store URLs (replace with your actual app IDs)
      const IOS_APP_STORE_URL = process.env.IOS_APP_STORE_URL || appStoreUrl;
      const ANDROID_PLAY_STORE_URL = process.env.ANDROID_PLAY_STORE_URL || playStoreUrl ;
      
      // Check if type is specified in query or params
      const type = req.params.type || req.query.type as string;
      
      // If type is explicitly specified, use it
      if (type === "ios" || type === "apple") {
        return res.redirect(301, IOS_APP_STORE_URL);
      }
      
      if (type === "android" || type === "google") {
        return res.redirect(301, ANDROID_PLAY_STORE_URL);
      }
      
      // Detect device from user agent
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
      const isAndroid = /Android/i.test(userAgent);
      
      // Redirect based on device detection
      if (isIOS) {
        return res.redirect(301, IOS_APP_STORE_URL);
      } else if (isAndroid) {
        return res.redirect(301, ANDROID_PLAY_STORE_URL);
      } else {
        // Default to a fallback page or show both options
        // You can customize this to show a page with both links
        return res.redirect(301, ANDROID_PLAY_STORE_URL); // Default to Android
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error redirecting to app store",
      });
    }
  };

  /**
   * Generate QR Code for the redirect route
   * GET /qr/generate
   * Returns QR code as PNG image or base64 data URL
   */
  generateQRCode = async (req: Request, res: Response) => {
    try {
      // Get base URL from request
      const protocol = req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host}`;
      
      // Build the redirect URL
      const redirectUrl = `${baseUrl}${API_PREFIX}/v1/qr`;
      
      // Get format from query (image or dataUrl)
      const format = (req.query.format as string) || "image";
      const size = parseInt(req.query.size as string) || 300;
      const margin = parseInt(req.query.margin as string) || 1;
      
      // Generate QR code
      if (format === "dataUrl" || format === "base64") {
        // Return as base64 data URL
        const dataUrl = await QRCode.toDataURL(redirectUrl, {
          width: size,
          margin: margin,
          errorCorrectionLevel: "M",
        });
        
        return res.json({
          success: true,
          data: {
            qrCode: dataUrl,
            url: redirectUrl,
            format: "dataUrl",
          },
        });
      } else {
        // Return as PNG image
        const qrCodeBuffer = await QRCode.toBuffer(redirectUrl, {
          width: size,
          margin: margin,
          errorCorrectionLevel: "M",
          type: "png",
        });
        
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Length", qrCodeBuffer.length);
        return res.send(qrCodeBuffer);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error generating QR code",
        error: error?.message,
      });
    }
  };
}



