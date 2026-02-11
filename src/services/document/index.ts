import {
  Document,
  DocumentType,
  DocumentTypeRoleRequirement,
  UserRole,
} from "../../models";
import { CommonDocumentTypes, DocumentStatus, NotificationType } from "../../constants/enum";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";
import { notificationService } from "../notification";
import { getSocketService } from "../socket/instance";

export interface DocumentUploadData {
  userId: number;
  documentTypeId: number;
  fileUrl?: string;
  textValue?: string;
  side?: "front" | "back" | null;
  expiryDate?: string;
}

export interface DocumentSide {
  side: "front" | "back";
  documentId?: number;
  fileUrl?: string | null;
  textValue?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  verifiedBy?: number | null;
  rejectedBy?: number | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  status: string;
}

export interface DocumentRequirement {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  requiresExpiry: boolean;
  requiresSides: boolean;
  acceptsTextInput: boolean;
  isOptional: boolean;
  isUploaded: boolean;
  documentId?: number;
  fileUrl?: string | null;
  textValue?: string | null;
  expiryDate?: string;
  verified: boolean;
  status: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  verifiedBy?: number | null;
  rejectedBy?: number | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  sides?: DocumentSide[];
}

export class DocumentService {
  /**
   * Upload a document for a user
   */
  async uploadDocument(data: DocumentUploadData): Promise<Document> {
    try {
      // Check if document type exists
      const documentType = await DocumentType.query().findById(
        data.documentTypeId
      );
      if (!documentType) {
        throw new HttpException("Invalid document type", 400);
      }

      // Validate that either fileUrl or textValue is provided based on document type
      if (documentType.acceptsTextInput) {
        // For text input documents, textValue is required, fileUrl is optional
        if (!data.textValue) {
          throw new HttpException(
            "This document type requires text input. Please provide 'textValue'",
            400
          );
        }
      } else {
        // For file upload documents, fileUrl is required, textValue is not allowed
        if (!data.fileUrl) {
          throw new HttpException(
            "This document type requires file upload. Please provide 'fileUrl'",
            400
          );
        }
        if (data.textValue) {
          throw new HttpException(
            "This document type does not accept text input. Please provide 'fileUrl'",
            400
          );
        }
      }

      // Validate side parameter if document type requires sides
      if (documentType.requiresSides && !data.side) {
        throw new HttpException(
          "This document type requires specifying 'side' (front or back)",
          400
        );
      }

      if (!documentType.requiresSides && data.side) {
        throw new HttpException(
          "This document type does not support sides",
          400
        );
      }

      // Build query to find existing document
      let query = Document.query()
        .where({ userId: data.userId, documentTypeId: data.documentTypeId });

      // If document type requires sides, also match by side
      if (documentType.requiresSides && data.side) {
        query = query.where({ side: data.side });
      } else {
        // For documents without sides, match where side is null
        query = query.whereNull("side");
      }

      const existingDocument = await query.first();

      if (existingDocument) {
        // Update existing document - reset to submitted status when file is updated
        return await Document.query().patchAndFetchById(existingDocument.id, {
          fileUrl: data.fileUrl || null,
          textValue: data.textValue || null,
          side: data.side || null,
          expiryDate: data.expiryDate,
          verified: false, // Reset verification status
          status: DocumentStatus.SUBMITTED, // Automatically submitted when uploaded
          verifiedAt: null,
          rejectedAt: null,
          verifiedBy: null,
          rejectedBy: null,
          rejectionReason: null,
          updatedAt: new Date().toISOString(),
        });
      }

      // Create new document - status starts as "submitted" (ready for verification)
      const insertData: any = {
        userId: data.userId,
        documentTypeId: data.documentTypeId,
        side: data.side || null,
        status: DocumentStatus.SUBMITTED,
        expiryDate: data.expiryDate,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (data.fileUrl) {
        insertData.fileUrl = data.fileUrl;
      }
      
      if (data.textValue) {
        insertData.textValue = data.textValue;
      }
      
      return await Document.query().insert(insertData);
    } catch (error: any) {
      Logger.error(
        `Error uploading document: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get required documents for a user based on their roles
   */
  async getRequiredDocuments(userId: number): Promise<DocumentRequirement[]> {
    try {
      // Get user's roles
      const userRoles = await UserRole.query()
        .where({ userId })
        .withGraphFetched("role");

      if (!userRoles.length) {
        throw new HttpException("User has no roles assigned", 400);
      }

      const roleIds = userRoles.map((ur) => ur.roleId);

      // Get required document types for user's roles
      const requirements = await DocumentTypeRoleRequirement.query()
        .whereIn("roleId", roleIds)
        .withGraphFetched("[documentType, role]")
        .orderBy("sortOrder");

      // Get user's existing documents
      const userDocuments = await Document.query()
        .where({ userId })
        .withGraphFetched("documentType");

      // Create document requirements map
      const requirementsMap = new Map<number, DocumentRequirement>();

      for (const req of requirements) {
        const docType = req.documentType!;
        
        if (docType.requiresSides) {
          // For documents that require sides, find both front and back
          const frontDoc = userDocuments.find(
            (doc) => doc.documentTypeId === docType.id && doc.side === "front"
          );
          const backDoc = userDocuments.find(
            (doc) => doc.documentTypeId === docType.id && doc.side === "back"
          );
          
          const isUploaded = !!(frontDoc && backDoc);
          // Use the expiry date from either document (they should be the same)
          const expiryDate = frontDoc?.expiryDate || backDoc?.expiryDate;
          // Both sides need to be verified
          const verified = (frontDoc?.verified && backDoc?.verified) || false;
          // Get status from the first unverified document, or use frontDoc if both verified
          const statusDoc = !frontDoc?.verified ? frontDoc : (!backDoc?.verified ? backDoc : frontDoc);
          
          // Build sides array
          const sides: DocumentSide[] = [];
          
          if (frontDoc) {
            sides.push({
              side: "front",
              documentId: frontDoc.id,
              fileUrl: frontDoc.fileUrl || undefined,
              textValue: frontDoc.textValue || null,
              verified: frontDoc.verified,
              verifiedAt: frontDoc.verifiedAt || null,
              rejectedAt: frontDoc.rejectedAt || null,
              verifiedBy: frontDoc.verifiedBy || null,
              rejectedBy: frontDoc.rejectedBy || null,
              rejectionReason: frontDoc.rejectionReason || null,
              createdAt: frontDoc.createdAt,
              updatedAt: frontDoc.updatedAt,
              status: frontDoc.status || this.getDocumentStatus(frontDoc),
            });
          } else {
            sides.push({
              side: "front",
              verified: false,
              status: DocumentStatus.PENDING,
            });
          }
          
          if (backDoc) {
            sides.push({
              side: "back",
              documentId: backDoc.id,
              fileUrl: backDoc.fileUrl || undefined,
              textValue: backDoc.textValue || null,
              verified: backDoc.verified,
              verifiedAt: backDoc.verifiedAt || null,
              rejectedAt: backDoc.rejectedAt || null,
              verifiedBy: backDoc.verifiedBy || null,
              rejectedBy: backDoc.rejectedBy || null,
              rejectionReason: backDoc.rejectionReason || null,
              createdAt: backDoc.createdAt,
              updatedAt: backDoc.updatedAt,
              status: backDoc.status || this.getDocumentStatus(backDoc),
            });
          } else {
            sides.push({
              side: "back",
              verified: false,
              status: DocumentStatus.PENDING,
            });
          }
          
          requirementsMap.set(docType.id, {
            id: docType.id,
            name: docType.name,
            displayName: docType?.displayName,
            description: docType.description || undefined,
            requiresExpiry: docType.requiresExpiry,
            requiresSides: true,
            acceptsTextInput: docType.acceptsTextInput || false,
            isOptional: req.isOptional || false,
            isUploaded,
            fileUrl: frontDoc?.fileUrl || backDoc?.fileUrl || undefined,
            textValue: frontDoc?.textValue || backDoc?.textValue || null,
            expiryDate,
            verified,
            status: statusDoc?.status || this.getDocumentStatus(statusDoc),
            verifiedAt: frontDoc?.verifiedAt || backDoc?.verifiedAt || null,
            rejectedAt: frontDoc?.rejectedAt || backDoc?.rejectedAt || null,
            verifiedBy: frontDoc?.verifiedBy || backDoc?.verifiedBy || null,
            rejectedBy: frontDoc?.rejectedBy || backDoc?.rejectedBy || null,
            rejectionReason: frontDoc?.rejectionReason || backDoc?.rejectionReason || null,
            createdAt: frontDoc?.createdAt || backDoc?.createdAt,
            updatedAt: frontDoc?.updatedAt || backDoc?.updatedAt,
            sides,
          });
        } else {
          // For documents without sides, use the original logic
          const userDoc = userDocuments.find(
            (doc) => doc.documentTypeId === docType.id && !doc.side
          );

          requirementsMap.set(docType.id, {
            id: docType.id,
            name: docType.name,
            displayName: docType?.displayName,
            description: docType.description || undefined,
            requiresExpiry: docType.requiresExpiry,
            requiresSides: false,
            acceptsTextInput: docType.acceptsTextInput || false,
            isOptional: req.isOptional || false,
            isUploaded: !!userDoc,
            documentId: userDoc?.id,
            fileUrl: userDoc?.fileUrl || undefined,
            textValue: userDoc?.textValue || null,
            expiryDate: userDoc?.expiryDate,
            verified: userDoc?.verified || false,
            status: userDoc?.status || this.getDocumentStatus(userDoc),
            verifiedAt: userDoc?.verifiedAt || null,
            rejectedAt: userDoc?.rejectedAt || null,
            verifiedBy: userDoc?.verifiedBy || null,
            rejectedBy: userDoc?.rejectedBy || null,
            rejectionReason: userDoc?.rejectionReason || null,
            createdAt: userDoc?.createdAt,
            updatedAt: userDoc?.updatedAt,
          });
        }
      }

      return Array.from(requirementsMap.values());
    } catch (error: any) {
      Logger.error(
        `Error getting required documents: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get user's uploaded documents
   */
  async getUserDocuments(userId: number): Promise<Document[]> {
    try {
      return await Document.query()
        .where({ userId })
        .withGraphFetched("documentType")
        .orderBy("createdAt", "desc");
    } catch (error: any) {
      Logger.error(
        `Error getting user documents: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Delete a document
   * If isAdmin is true, allows deleting any document regardless of userId
   */
  async deleteDocument(documentId: number, userId: number, isAdmin: boolean = false): Promise<void> {
    try {
      let document;
      
      if (isAdmin) {
        // Admin can delete any document
        document = await Document.query()
          .where({ id: documentId })
          .first();
      } else {
        // Regular users can only delete their own documents
        document = await Document.query()
          .where({ id: documentId, userId })
          .first();
      }

      if (!document) {
        throw new HttpException("Document not found", 404);
      }

      await Document.query().where({ id: documentId }).delete();
      // .patch({
      //   deletedAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      // });
    } catch (error: any) {
      Logger.error(
        `Error deleting document: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Verify a document (admin function)
   */
  async verifyDocument(
    documentId: number,
    verified: boolean,
    verifiedBy: number,
    rejectionReason?: string
  ): Promise<Document> {
    try {
      const document = await Document.query()
        .findById(documentId)
        .withGraphFetched("documentType");
      
      if (!document) {
        throw new HttpException("Document not found", 404);
      }

      const updateData: any = {
        verified,
        updatedAt: new Date().toISOString(),
      };

      if (verified) {
        updateData.verifiedAt = new Date().toISOString();
        updateData.verifiedBy = verifiedBy;
        updateData.rejectedAt = null;
        updateData.rejectedBy = null;
        updateData.rejectionReason = null; // Clear rejection reason when verifying
        updateData.status = DocumentStatus.VERIFIED;
      } else {
        // Rejecting the document
        updateData.verifiedAt = null;
        updateData.verifiedBy = null;
        updateData.rejectedAt = new Date().toISOString();
        updateData.rejectedBy = verifiedBy;
        updateData.rejectionReason = rejectionReason || null;
        updateData.status = DocumentStatus.REJECTED;
      }

      const updatedDocument = await Document.query().patchAndFetchById(documentId, updateData);

      // Create notification and emit socket event
      try {
        const documentTypeName = (document.documentType as DocumentType)?.displayName || "Document";
        
        if (verified) {
          await notificationService.createNotification({
            userId: document.userId,
            type: NotificationType.DOCUMENT_VERIFIED,
            title: "Document Verified",
            message: `Your ${documentTypeName} has been verified successfully`,
            entityType: "document",
            entityId: documentId,
          });

          // Emit socket event
          const socketService = getSocketService();
          if (socketService) {
            socketService.getSocketInstance().to(`user:${document.userId}`).emit("document_verified", {
              documentId,
              documentType: documentTypeName,
              verifiedAt: updatedDocument.verifiedAt,
              timestamp: new Date(),
            });
          }
        } else {
          await notificationService.createNotification({
            userId: document.userId,
            type: NotificationType.DOCUMENT_REJECTED,
            title: "Document Rejected",
            message: `Your ${documentTypeName} has been rejected${rejectionReason ? `: ${rejectionReason}` : ""}`,
            entityType: "document",
            entityId: documentId,
          });

          // Emit socket event
          const socketService = getSocketService();
          if (socketService) {
            socketService.getSocketInstance().to(`user:${document.userId}`).emit("document_rejected", {
              documentId,
              documentType: documentTypeName,
              rejectionReason: rejectionReason || null,
              rejectedAt: updatedDocument.rejectedAt,
              timestamp: new Date(),
            });
          }
        }
      } catch (notifError: any) {
        Logger.error(`Failed to create notification: ${notifError?.message || "Unknown error"}`);
        // Don't throw - notification failure shouldn't break document verification
      }

      return updatedDocument;
    } catch (error: any) {
      Logger.error(
        `Error verifying document: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Mark document as pending review (admin function - when admin starts reviewing)
   */
  async markDocumentAsPending(documentId: number): Promise<Document> {
    try {
      const document = await Document.query().findById(documentId);
      if (!document) {
        throw new HttpException("Document not found", 404);
      }

      // Can only mark as pending if it's submitted
      if (document.status !== DocumentStatus.SUBMITTED) {
        throw new HttpException(
          `Document cannot be marked as pending. Current status: ${document.status}`,
          400
        );
      }

      return await Document.query().patchAndFetchById(documentId, {
        status: DocumentStatus.PENDING,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      Logger.error(
        `Error marking document as pending: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Reject a document (admin function)
   */
  async rejectDocument(
    documentId: number,
    rejectedBy: number,
    rejectionReason?: string
  ): Promise<Document> {
    try {
      const document = await Document.query()
        .findById(documentId)
        .withGraphFetched("documentType");
      
      if (!document) {
        throw new HttpException("Document not found", 404);
      }

      const updatedDocument = await Document.query().patchAndFetchById(documentId, {
        verified: false,
        status: DocumentStatus.REJECTED,
        rejectedAt: new Date().toISOString(),
        rejectedBy,
        rejectionReason: rejectionReason || null,
        verifiedAt: null,
        verifiedBy: null,
        updatedAt: new Date().toISOString(),
      });

      // Create notification and emit socket event
      try {
        const documentTypeName = (document.documentType as DocumentType)?.displayName || "Document";
        
        await notificationService.createNotification({
          userId: document.userId,
          type: NotificationType.DOCUMENT_REJECTED,
          title: "Document Rejected",
          message: `Your ${documentTypeName} has been rejected${rejectionReason ? `: ${rejectionReason}` : ""}`,
          entityType: "document",
          entityId: documentId,
        });

        // Emit socket event
        const socketService = getSocketService();
        if (socketService) {
          socketService.getSocketInstance().to(`user:${document.userId}`).emit("document_rejected", {
            documentId,
            documentType: documentTypeName,
            rejectionReason: rejectionReason || null,
            rejectedAt: updatedDocument.rejectedAt,
            timestamp: new Date(),
          });
        }
      } catch (notifError: any) {
        Logger.error(`Failed to create notification: ${notifError?.message || "Unknown error"}`);
        // Don't throw - notification failure shouldn't break document rejection
      }

      return updatedDocument;
    } catch (error: any) {
      Logger.error(
        `Error rejecting document: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get document status based on verification and expiry
   */
  private getDocumentStatus(document?: Document): string {
    if (!document) {
      return DocumentStatus.PENDING;
    }

    // If document has a status field, use it (but check for expired)
    if (document.status) {
      // Check if document is expired (overrides other statuses except rejected)
      if (document.status !== DocumentStatus.REJECTED && 
          document.expiryDate && 
          new Date(document.expiryDate) < new Date()) {
        return DocumentStatus.EXPIRED;
      }
      return document.status;
    }

    // Fallback: compute status from other fields (for backward compatibility)
    // Check if document is rejected
    if (document.rejectedAt) {
      return DocumentStatus.REJECTED;
    }

    // Check if expired
    if (document.expiryDate && new Date(document.expiryDate) < new Date()) {
      return DocumentStatus.EXPIRED;
    }

    if (document.verified) {
      return DocumentStatus.VERIFIED;
    }

    // If not verified and not rejected, it's pending verification
    return DocumentStatus.PENDING;
  }

  /**
   * Get all documents with full details (admin only)
   */
  async getAllDocuments(options?: {
    page?: number;
    limit?: number;
    userId?: number;
    documentTypeId?: number;
    verified?: boolean;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts: {
      total: number;
      verified: number;
      rejected: number;
      pending: number;
      expired: number;
    };
  }> {
    try {
      const { page = 1, limit = 50, userId, documentTypeId, verified, status, search } = options || {};
      const pageNum = Number(page);
      const limitNum = Number(limit);

      // Base query for filtering (used for both main query and counts)
      const buildBaseQuery = () => {
        let baseQuery = Document.query()
          .whereNull("documents.deletedAt")
          .leftJoinRelated("[user, documentType]");

        // Apply filters
        if (userId) {
          baseQuery = baseQuery.where("documents.userId", userId);
        }

        if (documentTypeId) {
          baseQuery = baseQuery.where("documents.documentTypeId", documentTypeId);
        }

        // Apply fuzzy search
        if (search) {
          const searchTerm = `%${search.toLowerCase()}%`;
          // Note: leftJoinRelated creates aliases "user" and "documentType" (singular)
          baseQuery = baseQuery.where((qb) => {
            qb.whereRaw("LOWER(\"user\".\"userName\") LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(\"user\".email) LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(\"documentType\".name) LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(\"documentType\".\"displayName\") LIKE ?", [searchTerm]);
          });
        }

        return baseQuery;
      };

      // Build main query with graph fetched relations
      let query = Document.query()
        .whereNull("documents.deletedAt");

      // Apply filters to main query
      if (userId) {
        query = query.where("documents.userId", userId);
      }

      if (documentTypeId) {
        query = query.where("documents.documentTypeId", documentTypeId);
      }

      // Apply fuzzy search to main query using subquery
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        // Use subquery to find matching document IDs
        // Note: leftJoinRelated creates aliases "user" and "documentType" (singular)
        const matchingDocIds = await Document.query()
          .leftJoinRelated("[user, documentType]")
          .where((qb) => {
            qb.whereRaw("LOWER(\"user\".\"userName\") LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(\"user\".email) LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(\"documentType\".name) LIKE ?", [searchTerm])
              .orWhereRaw("LOWER(\"documentType\".\"displayName\") LIKE ?", [searchTerm]);
          })
          .select("documents.id")
          .groupBy("documents.id");

        const docIds = matchingDocIds.map((doc: any) => doc.id);
        if (docIds.length > 0) {
          query = query.whereIn("documents.id", docIds);
        } else {
          // If no matches, return empty result
          query = query.where("documents.id", -1);
        }
      }

      // Add graph fetched relations and ordering
      query = query.withGraphFetched(
        "[user, documentType, verifiedByUser, rejectedByUser]"
      );

      // Apply sorting
      const sortBy = options?.sortBy || "createdAt";
      const sortOrder = options?.sortOrder || "desc";
      const validSortFields = ["createdAt", "updatedAt", "verifiedAt", "rejectedAt"];
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      query = query.orderBy(`documents.${sortField}`, sortOrder);

      // Apply status filters to main query
      if (verified !== undefined) {
        query = query.where("documents.verified", verified);
      }

      if (status) {
        if (status === "verified") {
          query = query.where("documents.verified", true).whereNull("documents.rejectedAt");
        } else if (status === "rejected") {
          query = query.whereNotNull("documents.rejectedAt");
        } else if (status === "pending") {
          query = query.where("documents.verified", false).whereNull("documents.rejectedAt");
        } else if (status === "expired") {
          query = query
            .whereNotNull("documents.expiryDate")
            .where("documents.expiryDate", "<", new Date().toISOString());
        }
      }

      // Get total count for filtered results
      const total = await query.resultSize();

      // Apply pagination
      const documents = await query
        .offset((pageNum - 1) * limitNum)
        .limit(limitNum);

      const totalPages = Math.ceil(total / limitNum);

      // Get counts for all statuses (using base query without status filters)
      const baseCountQuery = buildBaseQuery();

      const totalCount = await baseCountQuery.resultSize();
      
      const verifiedCount = await baseCountQuery
        .clone()
        .where("documents.verified", true)
        .whereNull("documents.rejectedAt")
        .resultSize();

      const rejectedCount = await baseCountQuery
        .clone()
        .whereNotNull("documents.rejectedAt")
        .resultSize();

      const pendingCount = await baseCountQuery
        .clone()
        .where("documents.verified", false)
        .whereNull("documents.rejectedAt")
        .resultSize();

      const expiredCount = await baseCountQuery
        .clone()
        .whereNotNull("documents.expiryDate")
        .where("documents.expiryDate", "<", new Date().toISOString())
        .resultSize();

      return {
        documents,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        counts: {
          total: totalCount,
          verified: verifiedCount,
          rejected: rejectedCount,
          pending: pendingCount,
          expired: expiredCount,
        },
      };
    } catch (error: any) {
      Logger.error(
        `Error getting all documents: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get all document types
   * Optionally include role requirements with isOptional information
   * If roleId is provided, includes isOptional for that specific role
   * If filterByRoleId is true, only returns document types assigned to that role
   * If search is provided, filters by name or displayName (case-insensitive)
   */
  async getAllDocumentTypes(
    includeRoleRequirements: boolean = true, 
    roleId?: number,
    filterByRoleId?: boolean,
    search?: string
  ): Promise<any[]> {
    try {
      let documentTypesQuery = DocumentType.query();

      // If filtering by role, only get document types that have this role assigned
      if (filterByRoleId && roleId) {
        // Get document type IDs that are assigned to this role
        const assignedDocumentTypeIds = await DocumentTypeRoleRequirement.query()
          .where("roleId", roleId)
          .select("documentTypeId")
          .distinct("documentTypeId");
        
        const docTypeIds = assignedDocumentTypeIds.map((req: any) => req.documentTypeId);
        
        if (docTypeIds.length > 0) {
          documentTypesQuery = documentTypesQuery.whereIn("documentTypes.id", docTypeIds);
        } else {
          // No document types assigned to this role, return empty array
          return [];
        }
      }

      // If search is provided, filter by name or displayName
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        documentTypesQuery = documentTypesQuery.where((qb) => {
          qb.whereRaw("LOWER(name) LIKE ?", [`%${searchTerm}%`])
            .orWhereRaw("LOWER(\"displayName\") LIKE ?", [`%${searchTerm}%`]);
        });
      }

      const documentTypes = await documentTypesQuery
        .orderBy("name")
        .modify((query) => {
          if (includeRoleRequirements) {
            query.withGraphFetched("roleRequirements.role");
          }
        });

      // Transform the response to include isOptional
      if (includeRoleRequirements) {
        return documentTypes.map((docType: any) => {
          const result: any = {
            id: docType.id,
            name: docType.name,
            displayName: docType.displayName,
            description: docType.description,
            requiresExpiry: docType.requiresExpiry,
            requiresSides: docType.requiresSides,
            acceptsTextInput: docType.acceptsTextInput || false,
            createdAt: docType.createdAt,
          };

          // If roleId is provided, include isOptional for that specific role
          if (roleId && docType.roleRequirements) {
            const roleReq = docType.roleRequirements.find((req: any) => req.roleId === roleId);
            if (roleReq) {
              result.isOptional = roleReq.isOptional;
            }
          }

          // Include all role requirements with isOptional and role name
          if (docType.roleRequirements && docType.roleRequirements.length > 0) {
            result.roleRequirements = docType.roleRequirements.map((req: any) => ({
              roleId: req.roleId,
              roleName: req.role?.name || null,
              sortOrder: req.sortOrder,
              isOptional: req.isOptional,
            }));
          }

          return result;
        });
      }

      return documentTypes;
    } catch (error: any) {
      Logger.error(
        `Error getting document types: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Create a new document type
   */
  async createDocumentType(data: {
    name: string;
    displayName?: string;
    description?: string;
    requiresExpiry?: boolean;
    requiresSides?: boolean;
    acceptsTextInput?: boolean;
  }): Promise<DocumentType> {
    try {
      // Check if name already exists
      const existing = await DocumentType.query().where("name", data.name).first();
      if (existing) {
        throw new HttpException("Document type with this name already exists", 400);
      }

      const insertData: any = {
        name: data.name,
        displayName: data.displayName || data.name,
        description: data.description || null,
        requiresExpiry: data.requiresExpiry ?? true,
        requiresSides: data.requiresSides ?? false,
        acceptsTextInput: data.acceptsTextInput ?? false,
        createdAt: new Date().toISOString(),
      };

      return await DocumentType.query().insert(insertData);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(
        `Error creating document type: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Update a document type (name cannot be changed)
   */
  async updateDocumentType(
    id: number,
    data: {
      displayName?: string;
      description?: string;
      requiresExpiry?: boolean;
      requiresSides?: boolean;
      acceptsTextInput?: boolean;
    }
  ): Promise<DocumentType> {
    try {
      const documentType = await DocumentType.query().findById(id);
      if (!documentType) {
        throw new HttpException("Document type not found", 404);
      }

      const updateData: any = {};
      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.requiresExpiry !== undefined) {
        updateData.requiresExpiry = data.requiresExpiry;
      }
      if (data.requiresSides !== undefined) {
        updateData.requiresSides = data.requiresSides;
      }
      if (data.acceptsTextInput !== undefined) {
        updateData.acceptsTextInput = data.acceptsTextInput;
      }

      return await DocumentType.query().patchAndFetchById(id, updateData);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(
        `Error updating document type: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Delete a document type
   */
  async deleteDocumentType(id: number): Promise<void> {
    try {
      const documentType = await DocumentType.query().findById(id);
      if (!documentType) {
        throw new HttpException("Document type not found", 404);
      }

      // Check if there are any documents using this type
      const documentCount = await Document.query()
        .where("documentTypeId", id)
        .whereNull("deletedAt")
        .resultSize();

      if (documentCount > 0) {
        throw new HttpException(
          `Cannot delete document type. There are ${documentCount} document(s) using this type.`,
          400
        );
      }

      // Delete the document type (this will cascade delete role requirements)
      await DocumentType.query().deleteById(id);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(
        `Error deleting document type: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get role requirements for a document type
   */
  async getDocumentTypeRoleRequirements(documentTypeId: number): Promise<any[]> {
    try {
      const documentType = await DocumentType.query().findById(documentTypeId);
      if (!documentType) {
        throw new HttpException("Document type not found", 404);
      }

      const requirements = await DocumentTypeRoleRequirement.query()
        .where("documentTypeId", documentTypeId)
        .withGraphFetched("role")
        .orderBy("sortOrder", "asc");

      return requirements.map((req: any) => ({
        id: req.id,
        documentTypeId: req.documentTypeId,
        roleId: req.roleId,
        roleName: req.role?.name,
        roleDescription: req.role?.description,
        sortOrder: req.sortOrder,
        isOptional: req.isOptional,
      }));
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(
        `Error getting document type role requirements: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Assign document type requirement to a role
   */
  async assignDocumentTypeToRole(
    documentTypeId: number,
    roleId: number,
    sortOrder: number = 0,
    isOptional: boolean = false
  ): Promise<DocumentTypeRoleRequirement> {
    try {
      // Check if document type exists
      const documentType = await DocumentType.query().findById(documentTypeId);
      if (!documentType) {
        throw new HttpException("Document type not found", 404);
      }

      // Check if already assigned
      const existing = await DocumentTypeRoleRequirement.query()
        .where({ documentTypeId, roleId })
        .first();

      if (existing) {
        // Update existing assignment
        return await DocumentTypeRoleRequirement.query().patchAndFetchById(existing.id, {
          sortOrder,
          isOptional,
        });
      }

      // Create new assignment
      return await DocumentTypeRoleRequirement.query().insert({
        documentTypeId,
        roleId,
        sortOrder,
        isOptional,
      });
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(
        `Error assigning document type to role: ${
          error?.message || "Unknown error"
        }`
      );
      throw error;
    }
  }

  /**
   * Update document type requirement (sortOrder, isOptional)
   */
  async updateDocumentTypeRoleRequirement(
    documentTypeId: number,
    roleId: number,
    updates: { sortOrder?: number; isOptional?: boolean }
  ): Promise<DocumentTypeRoleRequirement> {
    try {
      const requirement = await DocumentTypeRoleRequirement.query()
        .where({ documentTypeId, roleId })
        .first();

      if (!requirement) {
        throw new HttpException("Document type requirement not found", 404);
      }

      const updateData: any = {};
      if (updates.sortOrder !== undefined) {
        updateData.sortOrder = updates.sortOrder;
      }
      if (updates.isOptional !== undefined) {
        updateData.isOptional = updates.isOptional;
      }

      return await DocumentTypeRoleRequirement.query().patchAndFetchById(requirement.id, updateData);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(
        `Error updating document type requirement: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Remove document type requirement from a role
   */
  async removeDocumentTypeFromRole(
    documentTypeId: number,
    roleId: number
  ): Promise<void> {
    try {
      const requirement = await DocumentTypeRoleRequirement.query()
        .where({ documentTypeId, roleId })
        .first();

      if (!requirement) {
        throw new HttpException("Document type requirement not found", 404);
      }

      await DocumentTypeRoleRequirement.query().deleteById(requirement.id);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      Logger.error(
        `Error removing document type from role: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get all document requirements for a specific role
   */
  async getRoleDocumentRequirements(roleId: number): Promise<any[]> {
    try {
      const requirements = await DocumentTypeRoleRequirement.query()
        .where("roleId", roleId)
        .withGraphFetched("documentType")
        .orderBy("sortOrder", "asc");

      return requirements.map((req: any) => ({
        id: req.id,
        documentTypeId: req.documentTypeId,
        roleId: req.roleId,
        documentTypeName: req.documentType?.name || null,
        documentTypeDisplayName: req.documentType?.displayName || null,
        documentTypeDescription: req.documentType?.description || null,
        requiresExpiry: req.documentType?.requiresExpiry || false,
        requiresSides: req.documentType?.requiresSides || false,
        acceptsTextInput: req.documentType?.acceptsTextInput || false,
        sortOrder: req.sortOrder,
        isOptional: req.isOptional,
      }));
    } catch (error: any) {
      Logger.error(
        `Error getting role document requirements: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }
}

export default new DocumentService();
