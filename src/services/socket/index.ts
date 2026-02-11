import { Server as HTTPServer } from "http";
import { SocketService } from "./socket.service";
import { getSocketInstance } from "./instance";

// Re-export the new modular SocketService
export { SocketService } from "./socket.service";

// Re-export types and constants for external use
export * from "./types";
export * from "./constants/events";

// Export Socket.IO instance for direct access
export const socketIO = getSocketInstance();

