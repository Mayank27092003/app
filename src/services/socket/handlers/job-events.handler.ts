import { Logger } from "../../../utils/logger";
import { JOB_EVENTS, ROOM_PREFIXES } from "../constants/events";
import { JobAssignedPayload } from "../types";

/**
 * Job events handler for socket events
 * Manages job-related event emissions
 */
export class JobEventsHandler {
  private logger: typeof Logger;
  private io: any;

  constructor(io: any) {
    this.logger = Logger;
    this.io = io;
  }

  /**
   * Emit job created event
   */
  emitJobCreated(jobData: any): void {
    const payload = {
      ...jobData,
      timestamp: new Date(),
    };

    this.io.emit(JOB_EVENTS.JOB_NEW, payload);
    this.logger.info(`Job created event emitted: ${jobData.id || 'unknown'}`);
  }

  /**
   * Emit job assigned event
   */
  emitJobAssigned(jobId: number, driverId: number, companyId: number): void {
    const payload: JobAssignedPayload = {
      jobId,
      driverId,
      companyId,
      timestamp: new Date(),
    };

    // Emit to specific users involved
    this.io.to(`${ROOM_PREFIXES.USER}${driverId}`).emit(JOB_EVENTS.JOB_ASSIGNED, payload);
    this.io.to(`${ROOM_PREFIXES.USER}${companyId}`).emit(JOB_EVENTS.JOB_ASSIGNED, payload);

    // Also emit globally for other interested parties
    this.io.emit(JOB_EVENTS.JOB_ASSIGNED, payload);

    this.logger.info(`Job assigned event emitted: job ${jobId} to driver ${driverId} by company ${companyId}`);
  }

  /**
   * Emit job completed event
   */
  emitJobCompleted(contractId: number, escrowAmount: number): void {
    const payload = {
      contractId,
      escrowAmount,
      timestamp: new Date(),
    };

    this.io.emit(JOB_EVENTS.JOB_COMPLETED, payload);
    this.logger.info(`Job completed event emitted: contract ${contractId} with escrow ${escrowAmount}`);
  }

  /**
   * Emit job status update
   */
  emitJobStatusUpdate(jobId: number, status: string, details?: any): void {
    const payload = {
      jobId,
      status,
      details,
      timestamp: new Date(),
    };

    this.io.emit('job_status_update', payload);
    this.logger.info(`Job status update emitted: job ${jobId} status ${status}`);
  }

  /**
   * Emit job cancellation
   */
  emitJobCancelled(jobId: number, reason?: string, cancelledBy?: number): void {
    const payload = {
      jobId,
      reason,
      cancelledBy,
      timestamp: new Date(),
    };

    this.io.emit('job_cancelled', payload);
    this.logger.info(`Job cancelled event emitted: job ${jobId} by user ${cancelledBy}`);
  }

  /**
   * Emit job update
   */
  emitJobUpdate(jobId: number, updates: any, updatedBy?: number): void {
    const payload = {
      jobId,
      updates,
      updatedBy,
      timestamp: new Date(),
    };

    this.io.emit('job_updated', payload);
    this.logger.info(`Job update event emitted: job ${jobId} by user ${updatedBy}`);
  }

  /**
   * Emit job application received
   */
  emitJobApplicationReceived(jobId: number, applicantId: number, companyId: number): void {
    const payload = {
      jobId,
      applicantId,
      companyId,
      timestamp: new Date(),
    };

    // Emit to company
    this.io.to(`${ROOM_PREFIXES.USER}${companyId}`).emit('job_application_received', payload);
    // Emit to applicant
    this.io.to(`${ROOM_PREFIXES.USER}${applicantId}`).emit('job_application_received', payload);

    this.logger.info(`Job application received event emitted: job ${jobId} from applicant ${applicantId} to company ${companyId}`);
  }

  /**
   * Emit job application status update
   */
  emitJobApplicationStatusUpdate(applicationId: number, jobId: number, applicantId: number, status: string, companyId?: number): void {
    const payload = {
      applicationId,
      jobId,
      applicantId,
      status,
      companyId,
      timestamp: new Date(),
    };

    // Emit to applicant
    this.io.to(`${ROOM_PREFIXES.USER}${applicantId}`).emit('job_application_status_update', payload);
    
    // Emit to company if provided
    if (companyId) {
      this.io.to(`${ROOM_PREFIXES.USER}${companyId}`).emit('job_application_status_update', payload);
    }

    this.logger.info(`Job application status update emitted: application ${applicationId} status ${status}`);
  }

  /**
   * Emit job deadline reminder
   */
  emitJobDeadlineReminder(jobId: number, deadline: string, userIds: number[]): void {
    const payload = {
      jobId,
      deadline,
      timestamp: new Date(),
    };

    // Emit to specific users
    userIds.forEach(userId => {
      this.io.to(`${ROOM_PREFIXES.USER}${userId}`).emit('job_deadline_reminder', payload);
    });

    this.logger.info(`Job deadline reminder emitted: job ${jobId} to ${userIds.length} users`);
  }

  /**
   * Emit job location update
   */
  emitJobLocationUpdate(jobId: number, location: any, updatedBy: number): void {
    const payload = {
      jobId,
      location,
      updatedBy,
      timestamp: new Date(),
    };

    this.io.emit('job_location_update', payload);
    this.logger.info(`Job location update emitted: job ${jobId} by user ${updatedBy}`);
  }
}
