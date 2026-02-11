import { Notification } from "../../models/notification";
import { UserFcmToken } from "../../models/userFcmToken";
import { NotificationType } from "../../constants/enum";
import { firebaseService } from "./firebase.service";
import { Logger } from "../../utils/logger";

export interface CreateNotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
}

export class NotificationService {
  /**
   * Create a notification and send push notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      // Create notification in database
      const notification = await Notification.query().insertAndFetch({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send push notification asynchronously (don't wait for it)
      this.sendPushNotificationAsync(data.userId, data.title, data.message, {
        notificationId: notification.id.toString(),
        type: data.type,
        entityType: data.entityType || "",
        entityId: data.entityId?.toString() || "",
      }).catch((error) => {
        Logger.error(`Failed to send push notification: ${error?.message || "Unknown error"}`);
      });

      return notification;
    } catch (error: any) {
      Logger.error(`Error creating notification: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Send push notification asynchronously
   */
  private async sendPushNotificationAsync(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      // Get user's active FCM tokens
      const tokens = await UserFcmToken.query()
        .where({ userId, isActive: true })
        .select("fcmToken");

      if (tokens.length === 0) {
        Logger.info(`No active FCM tokens found for user ${userId}`);
        return;
      }

      const fcmTokens = tokens.map((t) => t.fcmToken);

      // Send push notifications
      await firebaseService.sendBulkPushNotifications(fcmTokens, title, body, data);
    } catch (error: any) {
      Logger.error(`Error sending push notification: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: number,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;

      let query = Notification.query()
        .where({ userId })
        .whereNull("deletedAt")
        .orderBy("createdAt", "desc");

      if (unreadOnly) {
        query = query.where({ read: false });
      }

      const [notifications, total] = await Promise.all([
        query.limit(limit).offset(offset),
        query.resultSize(),
      ]);

      return { notifications, total };
    } catch (error: any) {
      Logger.error(`Error fetching user notifications: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    try {
      const notification = await Notification.query()
        .where({ id: notificationId, userId })
        .first();

      if (!notification) {
        throw new Error("Notification not found");
      }

      return await Notification.query().patchAndFetchById(notificationId, {
        read: true,
        readAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      Logger.error(`Error marking notification as read: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<number> {
    try {
      const updated = await Notification.query()
        .patch({
          read: true,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where({ userId, read: false })
        .whereNull("deletedAt");

      return updated;
    } catch (error: any) {
      Logger.error(`Error marking all notifications as read: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const count = await Notification.query()
        .where({ userId, read: false })
        .whereNull("deletedAt")
        .resultSize();

      return count;
    } catch (error: any) {
      Logger.error(`Error getting unread count: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Delete notification (soft delete)
   */
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    try {
      const notification = await Notification.query()
        .where({ id: notificationId, userId })
        .first();

      if (!notification) {
        throw new Error("Notification not found");
      }

      await Notification.query().patchAndFetchById(notificationId, {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      Logger.error(`Error deleting notification: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

