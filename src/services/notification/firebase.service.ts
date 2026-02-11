import * as admin from "firebase-admin";
import { env } from "../../config/env";
import { Logger } from "../../utils/logger";
import path from "path";

class FirebaseService {
  private app: admin.app.App | null = null;

  /**
   * Initialize Firebase Admin SDK
   */
  initialize(): void {
    if (this.app) {
      Logger.info("Firebase already initialized");
      return;
    }

    try {
      const credPath = path.resolve(process.cwd(), "./src/config/firebase_credentials.json");

      if (!require('fs').existsSync(credPath)) {
        Logger.warn("⚠️ Firebase credentials not found. Push notifications disabled.");
        return; // Don't crash - continue without Firebase
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert(credPath),
      });

      Logger.info("✅ Firebase Admin SDK initialized successfully");
    } catch (error: any) {
      Logger.error(`Firebase init failed: ${error?.message}`);
      Logger.warn("⚠️ Continuing without push notifications");
      // Don't throw - allow app to continue
    }
  }

  /**
   * Send push notification to a single user
   */
  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    if (!this.app) {
      Logger.warn("Firebase not initialized. Skipping push notification.");
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data
          ? Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
          }, {} as Record<string, string>)
          : undefined,
        android: {
          priority: "high" as const,
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      Logger.info(`📤 Sending push notification to token: ${fcmToken.substring(0, 20)}...`);
      const response = await admin.messaging().send(message);
      Logger.info(`✅ Push notification sent successfully. Message ID: ${response}, Token: ${fcmToken.substring(0, 20)}...`);
      return true;
    } catch (error: any) {
      const reason = error?.message || error?.code || "Unknown error";
      Logger.error(`❌ Failed to send push notification. Token: ${fcmToken.substring(0, 20)}..., Reason: ${reason}`);

      // Handle invalid token errors
      if (error?.code === "messaging/invalid-registration-token" ||
        error?.code === "messaging/registration-token-not-registered") {
        Logger.warn(`⚠️ Invalid FCM token: ${fcmToken}, Reason: ${reason}`);
      }

      return false;
    }
  }

  /**
   * Send push notifications to multiple users
   */
  async sendBulkPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: number; failed: number }> {
    if (!this.app || tokens.length === 0) {
      return { success: 0, failed: tokens.length };
    }

    try {
      const messages: admin.messaging.Message[] = tokens.map((token) => ({
        token,
        notification: {
          title,
          body,
        },
        data: data
          ? Object.keys(data).reduce((acc, key) => {
            acc[key] = String(data[key]);
            return acc;
          }, {} as Record<string, string>)
          : undefined,
        android: {
          priority: "high" as const,
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      }));

      Logger.info(`📤 Sending bulk push notifications to ${tokens.length} tokens`);

      const response = await admin.messaging().sendEach(messages);

      const success = response.responses.filter((r) => r.success).length;
      const failed = response.responses.filter((r) => !r.success).length;

      // Log successful tokens
      response.responses.forEach((resp, index) => {
        if (resp.success) {
          Logger.info(`✅ Push notification sent. Token: ${tokens[index].substring(0, 20)}..., Message ID: ${resp.messageId}`);
        } else {
          const reason = resp.error?.message || resp.error?.code || "Unknown error";
          Logger.error(`❌ Failed to send push notification. Token: ${tokens[index]}, Reason: ${reason}`);
        }
      });

      Logger.info(`✅ Bulk push notifications completed: ${success} success, ${failed} failed`);

      return { success, failed };
    } catch (error: any) {
      Logger.error(`Failed to send bulk push notifications: ${error?.message || "Unknown error"}`);
      return { success: 0, failed: tokens.length };
    }
  }
}

export const firebaseService = new FirebaseService();

