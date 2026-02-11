import { Logger } from "../../../utils/logger";
import { UserSession, UserOnlineStatus } from "../../../models";
import { AuthenticatedSocket, UserSessionData } from "../types";
import { CONNECTION_EVENTS, ROOM_PREFIXES } from "../constants/events";
import { ChatService } from "../../chat";

/**
 * Connection handler for socket connections and disconnections
 * Manages user sessions, online status, and room management
 */
export class ConnectionHandler {
  private logger: typeof Logger;
  private userSessions: Map<string, UserSessionData> = new Map();
  private onlineUserIds: Set<number> = new Set();
  private chatService: ChatService;

  constructor() {
    this.logger = Logger;
    this.chatService = new ChatService();
  }

  /**
   * Handle user connection
   */
  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const userId = socket.userId!;
      const sessionId = this.generateSessionId();

      // Create or update user session
      await this.createOrUpdateUserSession(socket, sessionId);

      // Update online status
      await this.updateUserOnlineStatus(userId, true);

      // Store session info
      this.userSessions.set(socket.id, { userId, socketId: socket.id });

      // Add to online users set
      this.onlineUserIds.add(userId);

      // Join user to personal room
      this.joinUserToPersonalRoom(socket);

      // Confirm delivery of pending messages
      await this.confirmPendingDeliveries(userId);

      this.logger.info(`User ${userId} connected with socket ${socket.id}`);
    } catch (error: any) {
      this.logger.error(`Error handling user connection: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Handle user disconnection
   */
  async handleDisconnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const userId = socket.userId!;

      // Remove session
      await this.removeUserSession(socket.id);

      // Check if user has other active sessions
      const hasOtherSessions = await this.hasOtherActiveSessions(userId);

      if (!hasOtherSessions) {
        // Update online status to offline
        await this.updateUserOnlineStatus(userId, false);
      }

      // Remove from online users set
      this.onlineUserIds.delete(userId);

      // Remove from local map
      this.userSessions.delete(socket.id);

      this.logger.info(
        `User ${userId} disconnected, active sessions: ${hasOtherSessions}`
      );
    } catch (error: any) {
      this.logger.error(`Error handling user disconnection: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Create or update user session in database
   */
  private async createOrUpdateUserSession(
    socket: AuthenticatedSocket,
    sessionId: string
  ): Promise<void> {
    const userId = socket.userId!;

    try {
      await UserSession.query().insert({
        userId,
        sessionId,
        socketId: socket.id,
        userAgent: socket.handshake.headers["user-agent"],
        ipAddress: socket.handshake.address,
      });
    } catch (error: any) {
      // If insert fails due to duplicate userId, update instead
      await UserSession.query().where({ userId }).patch({
        sessionId,
        socketId: socket.id,
        userAgent: socket.handshake.headers["user-agent"],
        ipAddress: socket.handshake.address,
        lastSeen: new Date().toISOString(),
      });
    }
  }

  /**
   * Update user online status in database
   */
  private async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    try {
      await UserOnlineStatus.query().insert({
        userId,
        isOnline,
        lastOnline: new Date().toISOString(),
      });
    } catch (error: any) {
      // If insert fails due to duplicate userId, update instead
      await UserOnlineStatus.query().where({ userId }).patch({
        isOnline,
        lastOnline: new Date().toISOString(),
      });
    }
  }

  /**
   * Remove user session from database
   */
  private async removeUserSession(socketId: string): Promise<void> {
    await UserSession.query().where({ socketId }).delete();
  }

  /**
   * Check if user has other active sessions
   */
  private async hasOtherActiveSessions(userId: number): Promise<boolean> {
    const activeSessions = await UserSession.query()
      .where({ userId })
      .count("id");

    return Number(activeSessions) > 0;
  }

  /**
   * Join user to their personal room
   */
  private joinUserToPersonalRoom(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const personalRoom = `${ROOM_PREFIXES.USER}${userId}`;
    socket.join(personalRoom);
    this.logger.info(`User ${userId} joined personal room: ${personalRoom}`);
  }

  /**
   * Confirm delivery of pending messages for user
   */
  private async confirmPendingDeliveries(userId: number): Promise<void> {
    try {
      await this.chatService.confirmPendingDeliveries(userId);
    } catch (error: any) {
      this.logger.error(`Error confirming pending deliveries: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get online users
   */
  getOnlineUsers(): number[] {
    return Array.from(this.userSessions.values()).map(
      (session) => session.userId
    );
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
   * Get user session data
   */
  getUserSession(socketId: string): UserSessionData | undefined {
    return this.userSessions.get(socketId);
  }

  /**
   * Get all user sessions
   */
  getAllUserSessions(): Map<string, UserSessionData> {
    return new Map(this.userSessions);
  }
}
