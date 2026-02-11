import { Server as HTTPServer } from "http";
import { SocketService } from "./socket.service";
import { Server as SocketIOServer } from "socket.io";

let socketService: SocketService | null = null;

/**
 * Initialize Socket.IO service
 */
export function initializeSocket(httpServer: HTTPServer): SocketService {
  if (!socketService) {
    socketService = new SocketService(httpServer);
  }
  return socketService;
}

/**
 * Get Socket.IO service instance
 */
export function getSocketService(): SocketService {
  if (!socketService) {
    throw new Error("Socket.IO service not initialized. Call initializeSocket() first.");
  }
  return socketService;
}

/**
 * Get Socket.IO server instance
 */
export function getSocketInstance(): SocketIOServer {
  if (!socketService) {
    throw new Error("Socket.IO service not initialized. Call initializeSocket() first.");
  }
  return socketService.getSocketInstance();
}

/**
 * Check if Socket.IO service is initialized
 */
export function isSocketInitialized(): boolean {
  return socketService !== null;
}

// Job Events
export function emitJobCreated(jobData: any): void {
  if (socketService) {
    socketService.emitJobCreated(jobData);
  }
}

export function emitJobAssigned(jobId: number, driverId: number, companyId: number): void {
  if (socketService) {
    socketService.emitJobAssigned(jobId, driverId, companyId);
  }
}

export function emitJobCompleted(contractId: number, escrowAmount: number): void {
  if (socketService) {
    socketService.emitJobCompleted(contractId, escrowAmount);
  }
}

// Contract Events
export function emitContractCreated(contractId: number, contractData: any): void {
  if (socketService) {
    socketService.emitContractCreated(contractId, contractData);
  }
}

export function emitContractStarted(contractId: number, escrowAmount: number): void {
  if (socketService) {
    socketService.emitContractStarted(contractId, escrowAmount);
  }
}

export function emitContractDriverAdded(contractId: number, driverUserId: number, conversationId?: number): void {
  if (socketService) {
    socketService.emitContractDriverAdded(contractId, driverUserId, conversationId);
  }
}

export function emitContractDriverRemoved(contractId: number, driverUserId: number, reason?: string, conversationId?: number): void {
  if (socketService) {
    socketService.emitContractDriverRemoved(contractId, driverUserId, reason, conversationId);
  }
}

export function emitContractDriverChanged(contractId: number, newDriverUserId: number, oldDriverUserId?: number | null, reason?: string, conversationId?: number): void {
  if (socketService) {
    socketService.emitContractDriverChanged(contractId, newDriverUserId, oldDriverUserId, reason, conversationId);
  }
}

export function emitContractDriverInvited(contractId: number, driverUserId: number): void {
  if (socketService) {
    socketService.emitContractDriverInvited(contractId, driverUserId);
  }
}

export function emitContractDriverAccepted(contractId: number, driverUserId: number, conversationId?: number): void {
  if (socketService) {
    socketService.emitContractDriverAccepted(contractId, driverUserId, conversationId);
  }
}

export function emitContractDriverDeclined(contractId: number, driverUserId: number, reason?: string): void {
  if (socketService) {
    socketService.emitContractDriverDeclined(contractId, driverUserId, reason);
  }
}

export function emitContractDriverVisibilityChanged(contractId: number, driverUserId: number, isLocationVisible: boolean): void {
  if (socketService) {
    socketService.emitContractDriverVisibilityChanged(contractId, driverUserId, isLocationVisible);
  }
}

export function emitContractCarrierInvited(contractId: number, carrierUserId: number): void {
  if (socketService) {
    socketService.emitContractCarrierInvited(contractId, carrierUserId);
  }
}

export function emitContractCarrierAccepted(contractId: number, carrierUserId: number): void {
  if (socketService) {
    socketService.emitContractCarrierAccepted(contractId, carrierUserId);
  }
}

export function emitContractCarrierDeclined(contractId: number, carrierUserId: number, reason?: string): void {
  if (socketService) {
    socketService.emitContractCarrierDeclined(contractId, carrierUserId, reason);
  }
}

// Message Events
export function emitSystemMessage(conversationId: number, message: string, metadata?: any): void {
  if (socketService) {
    socketService.emitSystemMessage(conversationId, message, metadata);
  }
}

export function emitNewMessage(conversationId: number, messageData: any): void {
  if (socketService) {
    socketService.emitNewMessage(conversationId, messageData);
  }
}

export function emitMessageRead(conversationId: number, readByUserId: number, readAt: string): void {
  if (socketService) {
    socketService.emitMessageRead(conversationId, readByUserId, readAt);
  }
}

export function emitMessageDelivered(conversationId: number, messageId: number, deliveredToUserId: number, senderUserId: number): void {
  if (socketService) {
    socketService.emitMessageDelivered(conversationId, messageId, deliveredToUserId, senderUserId);
  }
}

export function emitMessageReceived(messageId: number, conversationId: number, receivedByUserId: number, senderUserId: number): void {
  if (socketService) {
    socketService.emitMessageReceived(messageId, conversationId, receivedByUserId, senderUserId);
  }
}

// Error Events
export function emitError(userId: number, error: string, details?: any): void {
  if (socketService) {
    socketService.emitError(userId, error, details);
  }
}

export function emitErrorToRoom(room: string, error: string, details?: any): void {
  if (socketService) {
    socketService.emitErrorToRoom(room, error, details);
  }
}

export function emitErrorToAll(error: string, details?: any): void {
  if (socketService) {
    socketService.emitErrorToAll(error, details);
  }
}

// Utility Functions
export function isUserOnline(userId: number): boolean {
  if (socketService) {
    return socketService.isUserOnline(userId);
  }
  return false;
}

export function getOnlineUsers(): number[] {
  if (socketService) {
    return socketService.getOnlineUsers();
  }
  return [];
}

export function getOnlineUserCount(): number {
  if (socketService) {
    return socketService.getOnlineUserCount();
  }
  return 0;
}

export function getOnlineUserIds(): number[] {
  if (socketService) {
    return socketService.getOnlineUserIds();
  }
  return [];
}

export function clearUserCache(userId: number): void {
  if (socketService) {
    socketService.clearUserCache(userId);
  }
}

export async function broadcastOnlineUsersList(): Promise<void> {
  if (socketService) {
    await socketService.broadcastOnlineUsersList();
  }
}
