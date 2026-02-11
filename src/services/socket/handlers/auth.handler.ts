import { Logger } from "../../../utils/logger";
import { verifyToken } from "../../../utils/jwt";
import { AuthenticatedSocket } from "../types";
import { AUTH_EVENTS } from "../constants/events";

/**
 * Authentication handler for socket connections
 * Handles JWT token verification and user authentication
 */
export class AuthHandler {
  private logger: typeof Logger;

  constructor() {
    this.logger = Logger;
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware(io: any): void {
    io.use(async (socket: AuthenticatedSocket, next: any) => {
      try {
        const token = this.extractToken(socket);
        
        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = await this.verifyToken(token);
        socket.userId = decoded.userId;
        socket.user = decoded;

        this.logger.info(`Socket authenticated for user ${decoded.userId}`);
        next();
      } catch (error: any) {
        this.logger.error(`Socket authentication failed: ${error?.message || 'Unknown error'}`);
        next(new Error("Authentication failed"));
      }
    });
  }

  /**
   * Extract token from socket handshake
   */
  private extractToken(socket: AuthenticatedSocket): string | null {
    return (
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "")
    );
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<{ userId: number; [key: string]: any }> {
    return await verifyToken<{
      userId: number;
      [key: string]: any;
    }>(token);
  }

  /**
   * Validate socket authentication
   */
  validateSocket(socket: AuthenticatedSocket): boolean {
    if (!socket.userId) {
      this.logger.warn(`Socket ${socket.id} attempted to connect without authentication`);
      return false;
    }
    return true;
  }

  /**
   * Handle authentication error
   */
  handleAuthError(socket: AuthenticatedSocket, error: string): void {
    socket.emit(AUTH_EVENTS.AUTH_ERROR, {
      error,
      timestamp: new Date(),
    });
  }

  /**
   * Get user ID from socket
   */
  getUserId(socket: AuthenticatedSocket): number | null {
    return socket.userId || null;
  }

  /**
   * Get user data from socket
   */
  getUser(socket: AuthenticatedSocket): any {
    return socket.user || null;
  }
}
