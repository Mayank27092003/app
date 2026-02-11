import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { notificationService } from "../../services/notification";
import { HttpException } from "../../utils/httpException";

export class NotificationController {
  private service = notificationService;

  /**
   * Get user notifications
   */
  getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === "true";

      const result = await this.service.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
      });

      res.json({
        success: true,
        data: result.notifications,
        total: result.total,
      });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch notifications",
      });
    }
  };

  /**
   * Get unread notification count
   */
  getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const count = await this.service.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch unread count",
      });
    }
  };

  /**
   * Mark notification as read
   */
  markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const notificationId = parseInt(req.params.id);

      if (!notificationId || isNaN(notificationId)) {
        throw new HttpException("Invalid notification ID", 400);
      }

      const notification = await this.service.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || "Failed to mark notification as read",
        });
      }
    }
  };

  /**
   * Mark all notifications as read
   */
  markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const count = await this.service.markAllAsRead(userId);

      res.json({
        success: true,
        data: { updatedCount: count },
        message: `${count} notifications marked as read`,
      });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to mark all notifications as read",
      });
    }
  };

  /**
   * Delete notification
   */
  deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const notificationId = parseInt(req.params.id);

      if (!notificationId || isNaN(notificationId)) {
        throw new HttpException("Invalid notification ID", 400);
      }

      await this.service.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || "Failed to delete notification",
        });
      }
    }
  };
}

