import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { FcmTokenService, FcmTokenData } from "../../services/fcm";
import { HttpException } from "../../utils/httpException";

export class FcmTokenController {
  private fcmTokenService = new FcmTokenService();

  /**
   * Register or update FCM token for the authenticated user
   */
  registerToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { fcmToken, deviceId, deviceType, deviceName } = req.body;

      if (!fcmToken) {
        throw new HttpException("FCM token is required", 400);
      }

      const tokenData: FcmTokenData = {
        fcmToken,
        deviceId,
        deviceType,
        deviceName,
      };

      const registeredToken = await this.fcmTokenService.registerToken(
        userId,
        tokenData
      );

      res.json({
        success: true,
        data: registeredToken,
      });
    } catch (error) {
      console.error("Error registering FCM token:", error);
      res.status(500).json({
        success: false,
        error: "Failed to register FCM token",
      });
    }
  };

  /**
   * Get all active FCM tokens for the authenticated user
   */
  getUserTokens = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const tokens = await this.fcmTokenService.getUserTokens(userId);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      console.error("Error fetching user FCM tokens:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch FCM tokens",
      });
    }
  };

  /**
   * Deactivate a specific FCM token
   */
  deactivateToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { tokenId }: any = req.params;

      if (!tokenId) {
        throw new HttpException("Token ID is required", 400);
      }

      // Verify the token belongs to the user
      const token = await this.fcmTokenService.getUserTokens(userId);
      const userToken = token.find((t) => t.id === parseInt(tokenId));

      if (!userToken) {
        throw new HttpException("Token not found", 404);
      }

      await this.fcmTokenService.deactivateToken(parseInt(tokenId));

      res.json({
        success: true,
        message: "FCM token deactivated successfully",
      });
    } catch (error) {
      console.error("Error deactivating FCM token:", error);
      res.status(500).json({
        success: false,
        error: "Failed to deactivate FCM token",
      });
    }
  };

  /**
   * Deactivate all FCM tokens for a specific device
   */
  deactivateDeviceTokens = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { deviceId }: any = req.params;

      if (!deviceId) {
        throw new HttpException("Device ID is required", 400);
      }

      await this.fcmTokenService.deactivateDeviceTokens(userId, deviceId);

      res.json({
        success: true,
        message: "Device FCM tokens deactivated successfully",
      });
    } catch (error) {
      console.error("Error deactivating device FCM tokens:", error);
      res.status(500).json({
        success: false,
        error: "Failed to deactivate device FCM tokens",
      });
    }
  };

  /**
   * Deactivate all FCM tokens for the user (logout from all devices)
   */
  deactivateAllTokens = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;

      await this.fcmTokenService.deactivateAllUserTokens(userId);

      res.json({
        success: true,
        message: "All FCM tokens deactivated successfully",
      });
    } catch (error) {
      console.error("Error deactivating all FCM tokens:", error);
      res.status(500).json({
        success: false,
        error: "Failed to deactivate all FCM tokens",
      });
    }
  };

  /**
   * Get FCM token statistics for the authenticated user
   */
  getTokenStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const stats = await this.fcmTokenService.getUserTokenStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching FCM token stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch FCM token stats",
      });
    }
  };

}
