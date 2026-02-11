import { User } from "../../models/users";
import { UserVerificationStatus, UserVerificationStatusType, DocumentStatus, NotificationType } from "../../constants/enum";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import documentService from "../document";
import { notificationService } from "../notification";
import { getSocketService } from "../socket/instance";

export class UserVerificationService {
  /**
   * Check if all required documents are verified
   */
  private async areAllDocumentsVerified(userId: number): Promise<{ allVerified: boolean; unverifiedDocuments: string[] }> {
    try {
      const requiredDocuments = await documentService.getRequiredDocuments(userId);
      
      const unverifiedDocuments: string[] = [];
      
      for (const doc of requiredDocuments) {
        // Check if document is uploaded
        if (!doc.isUploaded) {
          unverifiedDocuments.push(`${doc.displayName || doc.name} - Not uploaded`);
          continue;
        }
        
        // Check if document is verified
        if (doc.status !== DocumentStatus.VERIFIED) {
          if (doc.status === DocumentStatus.REJECTED) {
            unverifiedDocuments.push(`${doc.displayName || doc.name} - Rejected${doc.rejectionReason ? `: ${doc.rejectionReason}` : ''}`);
          } else if (doc.status === DocumentStatus.EXPIRED) {
            unverifiedDocuments.push(`${doc.displayName || doc.name} - Expired`);
          } else {
            unverifiedDocuments.push(`${doc.displayName || doc.name} - Pending verification`);
          }
        }
      }
      
      return {
        allVerified: unverifiedDocuments.length === 0,
        unverifiedDocuments
      };
    } catch (error: any) {
      // If user has no roles, they can't have required documents
      if (error.message?.includes("no roles assigned")) {
        return { allVerified: false, unverifiedDocuments: ["User has no roles assigned"] };
      }
      Logger.error(`Error checking document verification: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Update user verification status
   */
  async updateVerificationStatus(
    userId: number,
    status: UserVerificationStatusType,
    verifiedByUserId?: number,
    notes?: string
  ) {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    // Check if trying to set admin_verified or fully_verified status
    if (
      status === UserVerificationStatus.ADMIN_VERIFIED ||
      status === UserVerificationStatus.FULLY_VERIFIED
    ) {
      // Verify that all required documents are verified
      const documentCheck = await this.areAllDocumentsVerified(userId);
      
      if (!documentCheck.allVerified) {
        throw new HttpException(
          `Cannot approve account. The following documents are not verified: ${documentCheck.unverifiedDocuments.join(", ")}`,
          400
        );
      }
    }

    const updateData: any = {
      verificationStatus: status,
      verificationStatusUpdatedAt: new Date().toISOString(),
      lastVerificationAttemptAt: new Date().toISOString(),
    };

    if (verifiedByUserId) {
      updateData.verifiedByUserId = verifiedByUserId;
    }

    if (notes) {
      updateData.verificationNotes = notes;
    }

    await User.query().patchAndFetchById(userId, updateData);

    // Create notification and emit socket event for account verification/rejection
    try {
      const socketService = getSocketService();
      
      if (status === UserVerificationStatus.ADMIN_VERIFIED || status === UserVerificationStatus.FULLY_VERIFIED) {
        await notificationService.createNotification({
          userId,
          type: NotificationType.USER_VERIFIED,
          title: "Account Verified",
          message: "Your account has been verified successfully",
          entityType: "user",
          entityId: userId,
        });

        // Emit socket event
        if (socketService) {
          socketService.getSocketInstance().to(`user:${userId}`).emit("account_verified", {
            userId,
            status,
            verifiedAt: updateData.verificationStatusUpdatedAt,
            timestamp: new Date(),
          });
        }
      } else if (status === UserVerificationStatus.REJECTED) {
        await notificationService.createNotification({
          userId,
          type: NotificationType.USER_REJECTED,
          title: "Account Rejected",
          message: notes ? `Your account verification was rejected: ${notes}` : "Your account verification was rejected",
          entityType: "user",
          entityId: userId,
        });

        // Emit socket event
        if (socketService) {
          socketService.getSocketInstance().to(`user:${userId}`).emit("account_rejected", {
            userId,
            status,
            rejectionReason: notes || null,
            rejectedAt: updateData.verificationStatusUpdatedAt,
            timestamp: new Date(),
          });
        }
      }
    } catch (notifError: any) {
      Logger.error(`Failed to create notification: ${notifError?.message || "Unknown error"}`);
      // Don't throw - notification failure shouldn't break verification
    }

    Logger.info(`✅ User ${userId} verification status updated to: ${status}`);
    return { success: true, status };
  }

  /**
   * Check if user meets verification requirements for a specific action
   */
  async checkVerificationRequirements(
    userId: number,
    requiredStatus: UserVerificationStatusType
  ) {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const currentStatus = user.verificationStatus as UserVerificationStatusType;
    
    // Define status hierarchy (higher = more verified)
    const statusHierarchy = {
      [UserVerificationStatus.PENDING]: 0,
      [UserVerificationStatus.PROFILE_COMPLETE]: 1,
      [UserVerificationStatus.DOCUMENTS_VERIFIED]: 2,
      [UserVerificationStatus.ADMIN_VERIFIED]: 3,
      [UserVerificationStatus.FULLY_VERIFIED]: 4,
      [UserVerificationStatus.SUSPENDED]: -1,
      [UserVerificationStatus.REJECTED]: -1,
    };

    const currentLevel = statusHierarchy[currentStatus] || 0;
    const requiredLevel = statusHierarchy[requiredStatus] || 0;

    if (currentLevel < requiredLevel) {
      throw new HttpException(
        `Verification required. Current status: ${currentStatus}, Required: ${requiredStatus}`,
        403
      );
    }

    return { 
      isVerified: currentLevel >= requiredLevel,
      currentStatus,
      requiredStatus 
    };
  }

  /**
   * Get user verification summary
   */
  async getVerificationSummary(userId: number) {
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('verifiedByUser');

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const verificationSteps = [
      {
        step: "Email Verification",
        status: user.isEmailVerified ? "completed" : "pending",
        completedAt: user.emailVerifiedAt,
      },
      {
        step: "Profile Completion",
        status: this.isProfileComplete(user) ? "completed" : "pending",
        completedAt: null, // Could be tracked separately
      },
      {
        step: "Document Verification",
        status: user.verificationStatus === UserVerificationStatus.DOCUMENTS_VERIFIED || 
                user.verificationStatus === UserVerificationStatus.ADMIN_VERIFIED ||
                user.verificationStatus === UserVerificationStatus.FULLY_VERIFIED 
                ? "completed" : "pending",
        completedAt: user.verificationStatusUpdatedAt,
      },
      {
        step: "Account Verification",
        status: user.verificationStatus === UserVerificationStatus.ADMIN_VERIFIED ||
                user.verificationStatus === UserVerificationStatus.FULLY_VERIFIED
                ? "completed" : "pending",
        completedAt: user.verificationStatusUpdatedAt,
        verifiedBy: user.verifiedByUser ? {
          id: user.verifiedByUser.id,
          name: user.verifiedByUser.fullName,
        } : null,
      },
    ];

    return {
      userId: user.id,
      currentStatus: user.verificationStatus,
      lastUpdated: user.verificationStatusUpdatedAt,
      verificationNotes: user.verificationNotes,
      steps: verificationSteps,
      isFullyVerified: !![UserVerificationStatus.FULLY_VERIFIED, UserVerificationStatus.ADMIN_VERIFIED].includes(user.verificationStatus as any)
    };
  }

  /**
   * Check if user profile is complete
   */
  private isProfileComplete(user: User): boolean {
    // Basic profile completion check
    const hasBasicInfo = user.userName && user.email;
    const hasProfileImage = !!user.profileImage;
    
    // You can add more profile completion criteria here
    return !!hasBasicInfo && hasProfileImage;
  }

  /**
   * Auto-update verification status based on user actions
   */
  async autoUpdateVerificationStatus(userId: number) {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const currentStatus = user.verificationStatus as UserVerificationStatusType;
    
    // Auto-update to profile_complete if basic profile is complete
    if (currentStatus === UserVerificationStatus.PENDING && this.isProfileComplete(user)) {
      await this.updateVerificationStatus(userId, UserVerificationStatus.PROFILE_COMPLETE);
      return { updated: true, newStatus: UserVerificationStatus.PROFILE_COMPLETE };
    }

    return { updated: false, currentStatus };
  }

  /**
   * Get users pending verification (for admin dashboard)
   */
  async getPendingVerifications(limit = 50, offset = 0) {
    const users = await User.query()
      .whereIn('verificationStatus', [
        UserVerificationStatus.PROFILE_COMPLETE,
        UserVerificationStatus.DOCUMENTS_VERIFIED
      ])
      .orderBy('verificationStatusUpdatedAt', 'desc')
      .limit(limit)
      .offset(offset);

    return users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      verificationStatus: user.verificationStatus,
      lastUpdated: user.verificationStatusUpdatedAt,
      verificationNotes: user.verificationNotes,
    }));
  }
}
