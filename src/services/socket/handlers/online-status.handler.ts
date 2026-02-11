import { Logger } from "../../../utils/logger";
import { User } from "../../../models";
import { AuthenticatedSocket, OnlineUserData, UserStatusUpdatePayload, OnlineUsersListPayload } from "../types";
import { USER_STATUS_EVENTS, ROOM_PREFIXES } from "../constants/events";
import { UserDetailsCacheService } from "../services/cache.service";

/**
 * Online status handler for socket events
 * Manages user online status, user lists, and status broadcasting
 */
export class OnlineStatusHandler {
  private logger: typeof Logger;
  private io: any;
  private cacheService: UserDetailsCacheService;
  private onlineUserIds: Set<number> = new Set();

  constructor(io: any, cacheService: UserDetailsCacheService) {
    this.logger = Logger;
    this.io = io;
    this.cacheService = cacheService;
  }

  /**
   * Add user to online list
   */
  addUserToOnlineList(userId: number): void {
    this.onlineUserIds.add(userId);
  }

  /**
   * Remove user from online list
   */
  removeUserFromOnlineList(userId: number): void {
    this.onlineUserIds.delete(userId);
  }

  /**
   * Emit user online status update
   */
  async emitUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    const payload: UserStatusUpdatePayload = {
      userId,
      isOnline,
      timestamp: new Date(),
    };

    // Emit to user's personal room for their own status updates
    this.io.to(`${ROOM_PREFIXES.USER}${userId}`).emit(USER_STATUS_EVENTS.USER_STATUS_UPDATE, payload);

    // Emit to all connected clients for global status updates
    this.io.emit(USER_STATUS_EVENTS.USER_ONLINE_STATUS, payload);

    // Broadcast updated online users list to all connected users
    await this.broadcastOnlineUsersList();
  }

  /**
   * Send online users list to a specific user
   */
  async sendOnlineUsersList(socket: AuthenticatedSocket): Promise<void> {
    try {
      const userId = socket.userId!;
      
      // Get online users with details using hybrid approach
      const onlineUsersList = await this.getOnlineUsersWithDetails(userId);

      const payload: OnlineUsersListPayload = {
        users: onlineUsersList,
        count: onlineUsersList.length,
        timestamp: new Date().toISOString()
      };

      // Send online users list to the user
      socket.emit(USER_STATUS_EVENTS.ONLINE_USERS_LIST, payload);

      this.logger.info(`Sent online users list to user ${userId}: ${onlineUsersList.length} users`);
    } catch (error: any) {
      this.logger.error(`Error sending online users list: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Broadcast online users list to all connected users
   */
  async broadcastOnlineUsersList(): Promise<void> {
    try {
      // Get online users with details using hybrid approach
      const onlineUsersList = await this.getOnlineUsersWithDetails();

      const payload: OnlineUsersListPayload = {
        users: onlineUsersList,
        count: onlineUsersList.length,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all connected users
      this.io.emit(USER_STATUS_EVENTS.ONLINE_USERS_UPDATED, payload);

      this.logger.info(`Broadcasted online users list: ${onlineUsersList.length} users`);
    } catch (error: any) {
      this.logger.error(`Error broadcasting online users list: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get online users with details (hybrid approach)
   */
  private async getOnlineUsersWithDetails(excludeUserId?: number): Promise<OnlineUserData[]> {
    const onlineIds = Array.from(this.onlineUserIds);
    const usersWithDetails: OnlineUserData[] = [];
    
    for (const userId of onlineIds) {
      // Skip excluded user
      if (excludeUserId && userId === excludeUserId) continue;
      
      const userDetails = await this.getUserDetails(userId);
      if (userDetails) {
        usersWithDetails.push({
          userId: userDetails.id,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          userName: userDetails.userName,
          email: userDetails.email,
          profileImage: userDetails.profileImage,
          lastOnline: new Date().toISOString(),
          isOnline: true
        });
      }
    }
    
    return usersWithDetails;
  }

  /**
   * Get user details (with caching)
   */
  public async getUserDetails(userId: number): Promise<any> {
    // Try to get from cache first
    let userDetails = this.cacheService.getUserDetails(userId);
    
    if (userDetails) {
      return userDetails;
    }
    
    // Fetch fresh data from database
    try {
      userDetails = await User.query()
        .findById(userId)
        .select('id', 'firstName', 'lastName', 'userName', 'email', 'profileImage');
      
      if (userDetails) {
        this.cacheService.setUserDetails(userId, userDetails);
      }
      
      return userDetails;
    } catch (error: any) {
      this.logger.error(`Error fetching user details for ${userId}: ${error?.message || 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Clear user cache
   */
  clearUserCache(userId: number): void {
    this.cacheService.clearUserCache(userId);
  }

  /**
   * Get online user count
   */
  getOnlineUserCount(): number {
    return this.onlineUserIds.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: number): boolean {
    return this.onlineUserIds.has(userId);
  }

  /**
   * Get online user IDs
   */
  getOnlineUserIds(): number[] {
    return Array.from(this.onlineUserIds);
  }

  /**
   * Get online users with basic info
   */
  getOnlineUsers(): number[] {
    return Array.from(this.onlineUserIds);
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache(): number {
    return this.cacheService.cleanExpired();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.cacheService.getStats();
  }
}
