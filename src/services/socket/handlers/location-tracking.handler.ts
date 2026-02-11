import { Server as SocketIOServer } from "socket.io";
import { Logger } from "../../../utils/logger";
import { AuthenticatedSocket } from "../types";
import { LOCATION_EVENTS } from "../constants/events";
import { UserLiveLocationService } from "../../location";

/**
 * Simple Location Tracking Handler
 * Only handles location updates - rooms are managed generically
 */
export class LocationTrackingHandler {
  private io: SocketIOServer;
  private locationService: UserLiveLocationService;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.locationService = new UserLiveLocationService();
  }

  /**
   * Handle location updates - emit to user-specific rooms
   */
  public async handleLocationUpdate(socket: AuthenticatedSocket, data: {
    userId: number;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    battery?: number;
    accuracy?: number;
    provider?: string;
  }): Promise<void> {
    try {
      const { userId, lat, lng, speed, heading, battery, accuracy, provider } = data;

      // Basic validation
      if (!userId || typeof lat !== 'number' || typeof lng !== 'number') {
        socket.emit(LOCATION_EVENTS.LOCATION_ERROR, { error: "Missing required fields: userId, lat, lng" });
        return;
      }

      // Save location to database with transaction (upsert - one location per user)
      const locationData = await this.locationService.upsert(userId, {
        lat, lng, speed, heading, battery, accuracy, provider
      });

      // Prepare location update
      const locationUpdate = {
        userId, lat, lng, speed, heading, battery, accuracy, provider,
        timestamp: locationData.createdAt || new Date().toISOString()
      };

      // Emit to user-specific room (much simpler!)
      this.io.to(`user_location_${userId}`).emit(LOCATION_EVENTS.LOCATION_UPDATE, {
        userId,
        location: locationUpdate
      });

      // Send confirmation
      socket.emit(LOCATION_EVENTS.UPDATE_LOCATION, { success: true, location: locationUpdate });

      Logger.info(`Location updated for user ${userId} and emitted to user:${userId} room`);

    } catch (error: any) {
      Logger.error(`Error updating location: ${error?.message}`);
      socket.emit(LOCATION_EVENTS.LOCATION_ERROR, { error: error?.message || 'Failed to update location' });
    }
  }

}
