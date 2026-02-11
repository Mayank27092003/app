import { Logger } from "../../../utils/logger";
import { CONTRACT_EVENTS, ROOM_PREFIXES } from "../constants/events";
import { 
  ContractDriverPayload, 
  ContractDriverChangedPayload, 
  ContractDriverRemovedPayload, 
  ContractDriverVisibilityPayload 
} from "../types";

/**
 * Contract events handler for socket events
 * Manages contract-related event emissions
 */
export class ContractEventsHandler {
  private logger: typeof Logger;
  private io: any;

  constructor(io: any) {
    this.logger = Logger;
    this.io = io;
  }

  /**
   * Emit contract created event
   */
  emitContractCreated(contractId: number, contractData: any): void {
    const payload = {
      contractId,
      ...contractData,
      timestamp: new Date(),
    };

    this.io.emit(CONTRACT_EVENTS.CONTRACT_CREATED, payload);
    this.logger.info(`Contract created event emitted: ${contractId}`);
  }

  /**
   * Emit contract started event
   */
  emitContractStarted(contractId: number, escrowAmount: number): void {
    const payload = {
      contractId,
      escrowAmount,
      timestamp: new Date(),
    };

    this.io.emit(CONTRACT_EVENTS.CONTRACT_STARTED, payload);
    this.logger.info(`Contract started event emitted: ${contractId} with escrow ${escrowAmount}`);
  }

  /**
   * Emit contract driver added event
   */
  emitContractDriverAdded(contractId: number, driverUserId: number, conversationId?: number): void {
    const payload: ContractDriverPayload = {
      contractId,
      driverUserId,
      timestamp: new Date(),
    };

    if (conversationId) {
      this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_ADDED, payload);
    }
    this.io.to(`${ROOM_PREFIXES.USER}${driverUserId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_ADDED, payload);
    this.io.emit(CONTRACT_EVENTS.CONTRACT_DRIVER_ADDED, payload);

    this.logger.info(`Contract driver added event emitted: contract ${contractId} driver ${driverUserId}`);
  }

  /**
   * Emit contract driver removed event
   */
  emitContractDriverRemoved(contractId: number, driverUserId: number, reason?: string, conversationId?: number): void {
    const payload: ContractDriverRemovedPayload = {
      contractId,
      driverUserId,
      reason,
      timestamp: new Date(),
    };

    if (conversationId) {
      this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_REMOVED, payload);
    }
    this.io.to(`${ROOM_PREFIXES.USER}${driverUserId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_REMOVED, payload);
    this.io.emit(CONTRACT_EVENTS.CONTRACT_DRIVER_REMOVED, payload);

    this.logger.info(`Contract driver removed event emitted: contract ${contractId} driver ${driverUserId}`);
  }

  /**
   * Emit contract driver changed event
   */
  emitContractDriverChanged(
    contractId: number,
    newDriverUserId: number,
    oldDriverUserId?: number | null,
    reason?: string,
    conversationId?: number
  ): void {
    const payload: ContractDriverChangedPayload = {
      contractId,
      newDriverUserId,
      oldDriverUserId,
      reason,
      timestamp: new Date(),
    };

    if (conversationId) {
      this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_CHANGED, payload);
    }
    this.io.to(`${ROOM_PREFIXES.USER}${newDriverUserId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_CHANGED, payload);
    if (oldDriverUserId) {
      this.io.to(`${ROOM_PREFIXES.USER}${oldDriverUserId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_CHANGED, payload);
    }
    this.io.emit(CONTRACT_EVENTS.CONTRACT_DRIVER_CHANGED, payload);

    this.logger.info(`Contract driver changed event emitted: contract ${contractId} from ${oldDriverUserId} to ${newDriverUserId}`);
  }

  /**
   * Emit contract driver invited event
   */
  emitContractDriverInvited(contractId: number, driverUserId: number): void {
    const payload: ContractDriverPayload = {
      contractId,
      driverUserId,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.USER}${driverUserId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_INVITED, payload);
    this.logger.info(`Contract driver invited event emitted: contract ${contractId} driver ${driverUserId}`);
  }

  /**
   * Emit contract driver accepted event
   */
  emitContractDriverAccepted(contractId: number, driverUserId: number, conversationId?: number): void {
    const payload: ContractDriverPayload = {
      contractId,
      driverUserId,
      timestamp: new Date(),
    };

    if (conversationId) {
      this.io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_ACCEPTED, payload);
    }
    this.io.to(`${ROOM_PREFIXES.USER}${driverUserId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_ACCEPTED, payload);
    this.io.emit(CONTRACT_EVENTS.CONTRACT_DRIVER_ACCEPTED, payload);

    this.logger.info(`Contract driver accepted event emitted: contract ${contractId} driver ${driverUserId}`);
  }

  /**
   * Emit contract driver declined event
   */
  emitContractDriverDeclined(contractId: number, driverUserId: number, reason?: string): void {
    const payload: ContractDriverRemovedPayload = {
      contractId,
      driverUserId,
      reason,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.USER}${driverUserId}`).emit(CONTRACT_EVENTS.CONTRACT_DRIVER_DECLINED, payload);
    this.io.emit(CONTRACT_EVENTS.CONTRACT_DRIVER_DECLINED, payload);

    this.logger.info(`Contract driver declined event emitted: contract ${contractId} driver ${driverUserId}`);
  }

  /**
   * Emit contract driver visibility changed event
   */
  emitContractDriverVisibilityChanged(contractId: number, driverUserId: number, isLocationVisible: boolean): void {
    const payload: ContractDriverVisibilityPayload = {
      contractId,
      driverUserId,
      isLocationVisible,
      timestamp: new Date(),
    };

    this.io.emit(CONTRACT_EVENTS.CONTRACT_DRIVER_VISIBILITY_CHANGED, payload);
    this.logger.info(`Contract driver visibility changed event emitted: contract ${contractId} driver ${driverUserId} visible ${isLocationVisible}`);
  }

  /**
   * Emit contract carrier invited event
   */
  emitContractCarrierInvited(contractId: number, carrierUserId: number): void {
    const payload: ContractDriverPayload = {
      contractId,
      driverUserId: carrierUserId, // Reusing the same interface
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.USER}${carrierUserId}`).emit(CONTRACT_EVENTS.CONTRACT_CARRIER_INVITED, payload);
    this.logger.info(`Contract carrier invited event emitted: contract ${contractId} carrier ${carrierUserId}`);
  }

  /**
   * Emit contract carrier accepted event
   */
  emitContractCarrierAccepted(contractId: number, carrierUserId: number): void {
    const payload: ContractDriverPayload = {
      contractId,
      driverUserId: carrierUserId, // Reusing the same interface
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.USER}${carrierUserId}`).emit(CONTRACT_EVENTS.CONTRACT_CARRIER_ACCEPTED, payload);
    this.io.emit(CONTRACT_EVENTS.CONTRACT_CARRIER_ACCEPTED, payload);

    this.logger.info(`Contract carrier accepted event emitted: contract ${contractId} carrier ${carrierUserId}`);
  }

  /**
   * Emit contract carrier declined event
   */
  emitContractCarrierDeclined(contractId: number, carrierUserId: number, reason?: string): void {
    const payload: ContractDriverRemovedPayload = {
      contractId,
      driverUserId: carrierUserId, // Reusing the same interface
      reason,
      timestamp: new Date(),
    };

    this.io.to(`${ROOM_PREFIXES.USER}${carrierUserId}`).emit(CONTRACT_EVENTS.CONTRACT_CARRIER_DECLINED, payload);
    this.io.emit(CONTRACT_EVENTS.CONTRACT_CARRIER_DECLINED, payload);

    this.logger.info(`Contract carrier declined event emitted: contract ${contractId} carrier ${carrierUserId}`);
  }

  /**
   * Emit contract status update
   */
  emitContractStatusUpdate(contractId: number, status: string, details?: any): void {
    const payload = {
      contractId,
      status,
      details,
      timestamp: new Date(),
    };

    this.io.emit('contract_status_update', payload);
    this.logger.info(`Contract status update event emitted: contract ${contractId} status ${status}`);
  }

  /**
   * Emit contract payment update
   */
  emitContractPaymentUpdate(contractId: number, paymentData: any): void {
    const payload = {
      contractId,
      paymentData,
      timestamp: new Date(),
    };

    this.io.emit('contract_payment_update', payload);
    this.logger.info(`Contract payment update event emitted: contract ${contractId}`);
  }

  /**
   * Emit contract completion
   */
  emitContractCompleted(contractId: number, escrowAmount: number): void {
    const payload = {
      contractId,
      escrowAmount,
      timestamp: new Date(),
    };

    this.io.emit('contract_completed', payload);
    this.logger.info(`Contract completed event emitted: contract ${contractId} with escrow ${escrowAmount}`);
  }
}
