import { Server as SocketIOServer } from "socket.io";
import { Logger } from "../../../utils/logger";
import { AuthenticatedSocket } from "../types";
import { LOCATION_EVENTS } from "../constants/events";

/**
 * Generic Room Handler
 * Handles joining and leaving any rooms - not specific to location
 */
export class RoomHandler {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Handle joining rooms - generic version
   */
  public async handleJoinRoom(socket: AuthenticatedSocket, data: { rooms: string | string[] }): Promise<void> {
    try {
      const { rooms } = data;
      
      if (!rooms) {
        socket.emit(LOCATION_EVENTS.LOCATION_ERROR, { error: "Rooms are required" });
        return;
      }

      const roomList = Array.isArray(rooms) ? rooms : [rooms];
      
      for (const room of roomList) {
        if (typeof room === 'string' && room.trim()) {
          await socket.join(room.trim());
          Logger.info(`User ${socket.userId} joined room: ${room}`);
        }
      }

      socket.emit(LOCATION_EVENTS.JOIN_ROOM, { success: true, rooms: roomList });

    } catch (error: any) {
      Logger.error(`Error joining room: ${error?.message}`);
      socket.emit(LOCATION_EVENTS.LOCATION_ERROR, { error: error?.message || 'Failed to join room' });
    }
  }

  /**
   * Handle leaving rooms - generic version
   */
  public async handleLeaveRoom(socket: AuthenticatedSocket, data: { rooms: string | string[] }): Promise<void> {
    try {
      const { rooms } = data;
      
      if (!rooms) {
        socket.emit(LOCATION_EVENTS.LOCATION_ERROR, { error: "Rooms are required" });
        return;
      }

      const roomList = Array.isArray(rooms) ? rooms : [rooms];
      
      for (const room of roomList) {
        if (typeof room === 'string' && room.trim()) {
          await socket.leave(room.trim());
          Logger.info(`User ${socket.userId} left room: ${room}`);
        }
      }

      socket.emit(LOCATION_EVENTS.LEAVE_ROOM, { success: true, rooms: roomList });

    } catch (error: any) {
      Logger.error(`Error leaving room: ${error?.message}`);
      socket.emit(LOCATION_EVENTS.LOCATION_ERROR, { error: error?.message || 'Failed to leave room' });
    }
  }
}
