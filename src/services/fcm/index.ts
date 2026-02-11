import { UserFcmToken } from "../../models/userFcmToken";

export interface FcmTokenData {
  fcmToken: string;
  deviceId?: string;
  deviceType?: string;
  deviceName?: string;
}

export class FcmTokenService {
  /**
   * Register or update an FCM token for a user
   */
  async registerToken(userId: number, tokenData: FcmTokenData): Promise<UserFcmToken> {
    try {
      const { fcmToken, deviceId, deviceType, deviceName } = tokenData;

      // Check if token already exists for this user and device
      let existingToken = null;
      
      if (deviceId) {
        existingToken = await UserFcmToken.query()
          .where({ userId, deviceId })
          .first();
      } else {
        existingToken = await UserFcmToken.query()
          .where({ userId, fcmToken })
          .first();
      }

      if (existingToken) {
        // Update existing token
        return await UserFcmToken.query().patchAndFetchById(existingToken.id, {
          fcmToken,
          deviceType,
          deviceName,
          isActive: true,
          lastUsedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new token
        return await UserFcmToken.query().insertAndFetch({
          userId,
          fcmToken,
          deviceId,
          deviceType,
          deviceName,
          isActive: true,
          lastUsedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      throw new Error('Failed to register FCM token');
    }
  }

  /**
   * Get all active FCM tokens for a user
   */
  async getUserTokens(userId: number): Promise<UserFcmToken[]> {
    try {
      return await UserFcmToken.query()
        .where({ userId, isActive: true })
        .orderBy('lastUsedAt', 'desc');
    } catch (error) {
      console.error('Error fetching user FCM tokens:', error);
      throw new Error('Failed to fetch FCM tokens');
    }
  }

  /**
   * Get all active FCM tokens for multiple users
   */
  async getUsersTokens(userIds: number[]): Promise<UserFcmToken[]> {
    try {
      return await UserFcmToken.query()
        .whereIn('userId', userIds)
        .where('isActive', true)
        .orderBy('lastUsedAt', 'desc');
    } catch (error) {
      console.error('Error fetching users FCM tokens:', error);
      throw new Error('Failed to fetch FCM tokens');
    }
  }

  /**
   * Deactivate (delete) a specific FCM token
   */
  async deactivateToken(tokenId: number): Promise<void> {
    try {
      await UserFcmToken.query().deleteById(tokenId);
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      throw new Error('Failed to delete FCM token');
    }
  }

  /**
   * Deactivate (delete) all tokens for a specific device
   */
  async deactivateDeviceTokens(userId: number, deviceId: string): Promise<void> {
    try {
      await UserFcmToken.query()
        .delete()
        .where({ userId, deviceId });
    } catch (error) {
      console.error('Error deleting device FCM tokens:', error);
      throw new Error('Failed to delete device FCM tokens');
    }
  }

  /**
   * Deactivate (delete) all tokens for a user (logout from all devices)
   */
  async deactivateAllUserTokens(userId: number): Promise<void> {
    try {
      await UserFcmToken.query()
        .delete()
        .where('userId', userId);
    } catch (error) {
      console.error('Error deleting all user FCM tokens:', error);
      throw new Error('Failed to delete all user FCM tokens');
    }
  }

  /**
   * Update last used timestamp for a token
   */
  async updateTokenUsage(tokenId: number): Promise<void> {
    try {
      await UserFcmToken.query()
        .patch({ 
          lastUsedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where('id', tokenId);
    } catch (error) {
      console.error('Error updating FCM token usage:', error);
      throw new Error('Failed to update FCM token usage');
    }
  }

  /**
   * Get token statistics for a user
   */
  async getUserTokenStats(userId: number): Promise<{
    totalTokens: number;
    activeTokens: number;
    devices: string[];
  }> {
    try {
      const tokens = await UserFcmToken.query()
        .where('userId', userId)
        .where('isActive', true);

      const devices : any = [...new Set(tokens.map(token => token.deviceType).filter(Boolean))];

      return {
        totalTokens: tokens.length,
        activeTokens: tokens.filter(token => token.isActive).length,
        devices,
      };
    } catch (error) {
      console.error('Error fetching user token stats:', error);
      throw new Error('Failed to fetch user token stats');
    }
  }
}
