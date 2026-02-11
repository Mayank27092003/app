import { Request, Response } from "express";
import { DocumentService } from "../../services/document";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Upload a document
   * POST /documents/upload
   */
  uploadDocument = async (req: Request, res: Response) => {
    try {
      const { documentTypeId, fileUrl, textValue, side, expiryDate } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!documentTypeId) {
        throw new HttpException("documentTypeId is required", 400);
      }

      const document = await this.documentService.uploadDocument({
        userId,
        documentTypeId,
        fileUrl,
        textValue,
        side: side || null,
        expiryDate,
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error: any) {
      Logger.error(`Error in uploadDocument controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get required documents for the authenticated user
   * GET /documents/required
   */
  getRequiredDocuments = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      const requirements = await this.documentService.getRequiredDocuments(userId);

      res.json({
        success: true,
        data: requirements,
      });
    } catch (error: any) {
      Logger.error(`Error in getRequiredDocuments controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get user's uploaded documents
   * GET /documents/my
   */
  getUserDocuments = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      const documents = await this.documentService.getUserDocuments(userId);

      res.json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      Logger.error(`Error in getUserDocuments controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Delete a document
   * DELETE /documents/:id
   */
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id as string);
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const isAdmin = (req as any).user?.isAdmin;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!documentId || isNaN(documentId)) {
        throw new HttpException("Valid document ID is required", 400);
      }

      await this.documentService.deleteDocument(documentId, userId, isAdmin);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error: any) {
      Logger.error(`Error in deleteDocument controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Verify a document (admin function)
   * PATCH /documents/:id/verify
   */
  verifyDocument = async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id as string);
      const { verified } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!documentId || isNaN(documentId)) {
        throw new HttpException("Valid document ID is required", 400);
      }

      if (typeof verified !== "boolean") {
        throw new HttpException("verified field must be a boolean", 400);
      }

      const document = await this.documentService.verifyDocument(
        documentId,
        verified,
        userId,
        req.body.rejectionReason
      );

      res.json({
        success: true,
        message: `Document ${verified ? "verified" : "unverified"} successfully`,
        data: document,
      });
    } catch (error: any) {
      Logger.error(`Error in verifyDocument controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Reject a document (admin function)
   * PATCH /documents/:id/reject
   */
  rejectDocument = async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id as string);
      const userId = (req as any).user?.id;
      const { rejectionReason } = req.body;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!documentId || isNaN(documentId)) {
        throw new HttpException("Valid document ID is required", 400);
      }

      const document = await this.documentService.rejectDocument(
        documentId,
        userId,
        rejectionReason
      );

      res.json({
        success: true,
        message: "Document rejected successfully",
        data: document,
      });
    } catch (error: any) {
      Logger.error(`Error in rejectDocument controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get all documents with full details (admin only)
   * GET /documents/all
   */
  getAllDocuments = async (req: Request, res: Response) => {
    try {
      const { page, limit, userId, documentTypeId, verified, status, search, sortBy, sortOrder } = req.query;

      const result = await this.documentService.getAllDocuments({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        documentTypeId: documentTypeId ? parseInt(documentTypeId as string) : undefined,
        verified: verified === "true" ? true : verified === "false" ? false : undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: (sortOrder === "asc" || sortOrder === "desc") ? sortOrder as "asc" | "desc" : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      Logger.error(`Error in getAllDocuments controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get all document types
   * GET /documents/types
   * Optional query params: 
   *   - roleId: to get isOptional for specific role or filter by role
   *   - filterByRole: if true, only returns document types assigned to the roleId
   *   - search: search term to filter by name or displayName (case-insensitive)
   */
  getDocumentTypes = async (req: Request, res: Response) => {
    try {
      const roleId = req.query.roleId ? parseInt(req.query.roleId as string) : undefined;
      const filterByRole = req.query.filterByRole === "true";
      const search = req.query.search as string | undefined;
      const documentTypes = await this.documentService.getAllDocumentTypes(true, roleId, filterByRole, search);

      res.json({
        success: true,
        data: documentTypes,
      });
    } catch (error: any) {
      Logger.error(`Error in getDocumentTypes controller:: ${error?.message || 'Unknown error'}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  /**
   * Create a new document type (admin function)
   * POST /documents/types
   */
  createDocumentType = async (req: Request, res: Response) => {
    try {
      const { name, displayName, description, requiresExpiry, requiresSides, acceptsTextInput } = req.body;

      if (!name) {
        throw new HttpException("Document type name is required", 400);
      }

      const documentType = await this.documentService.createDocumentType({
        name,
        displayName,
        description,
        requiresExpiry: requiresExpiry ?? true,
        requiresSides: requiresSides ?? false,
        acceptsTextInput: acceptsTextInput ?? false,
      });

      res.status(201).json({
        success: true,
        message: "Document type created successfully",
        data: documentType,
      });
    } catch (error: any) {
      Logger.error(`Error in createDocumentType controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Update a document type (admin function)
   * PATCH /documents/types/:id
   */
  updateDocumentType = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const { displayName, description, requiresExpiry, requiresSides, acceptsTextInput } = req.body;

      if (!id || isNaN(id)) {
        throw new HttpException("Valid document type ID is required", 400);
      }

      const documentType = await this.documentService.updateDocumentType(id, {
        displayName,
        description,
        requiresExpiry,
        requiresSides,
        acceptsTextInput,
      });

      res.json({
        success: true,
        message: "Document type updated successfully",
        data: documentType,
      });
    } catch (error: any) {
      Logger.error(`Error in updateDocumentType controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Delete a document type (admin function)
   * DELETE /documents/types/:id
   */
  deleteDocumentType = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);

      if (!id || isNaN(id)) {
        throw new HttpException("Valid document type ID is required", 400);
      }

      await this.documentService.deleteDocumentType(id);

      res.json({
        success: true,
        message: "Document type deleted successfully",
      });
    } catch (error: any) {
      Logger.error(`Error in deleteDocumentType controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get role requirements for a document type (admin function)
   * GET /documents/types/:id/roles
   */
  getDocumentTypeRoleRequirements = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);

      if (!id || isNaN(id)) {
        throw new HttpException("Valid document type ID is required", 400);
      }

      const requirements = await this.documentService.getDocumentTypeRoleRequirements(id);

      res.json({
        success: true,
        data: requirements,
      });
    } catch (error: any) {
      Logger.error(`Error in getDocumentTypeRoleRequirements controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Update document type requirement (admin function)
   * PATCH /documents/types/:documentTypeId/roles/:roleId
   */
  updateDocumentTypeRoleRequirement = async (req: Request, res: Response) => {
    try {
      const documentTypeId = parseInt(req.params.documentTypeId as string);
      const roleId = parseInt(req.params.roleId as string);
      const { sortOrder, isOptional } = req.body;

      if (!documentTypeId || isNaN(documentTypeId)) {
        throw new HttpException("Valid document type ID is required", 400);
      }

      if (!roleId || isNaN(roleId)) {
        throw new HttpException("Valid role ID is required", 400);
      }

      const updates: any = {};
      if (sortOrder !== undefined) {
        updates.sortOrder = parseInt(sortOrder);
      }
      if (isOptional !== undefined) {
        updates.isOptional = Boolean(isOptional);
      }

      if (Object.keys(updates).length === 0) {
        throw new HttpException("At least one field (sortOrder or isOptional) must be provided", 400);
      }

      const result = await this.documentService.updateDocumentTypeRoleRequirement(
        documentTypeId,
        roleId,
        updates
      );

      res.json({
        success: true,
        message: "Document type requirement updated successfully",
        data: result,
      });
    } catch (error: any) {
      Logger.error(`Error in updateDocumentTypeRoleRequirement controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Remove document type requirement from a role (admin function)
   * DELETE /documents/types/:documentTypeId/roles/:roleId
   */
  removeDocumentTypeFromRole = async (req: Request, res: Response) => {
    try {
      const documentTypeId = parseInt(req.params.documentTypeId as string);
      const roleId = parseInt(req.params.roleId as string);

      if (!documentTypeId || isNaN(documentTypeId)) {
        throw new HttpException("Valid document type ID is required", 400);
      }

      if (!roleId || isNaN(roleId)) {
        throw new HttpException("Valid role ID is required", 400);
      }

      await this.documentService.removeDocumentTypeFromRole(documentTypeId, roleId);

      res.json({
        success: true,
        message: "Document type requirement removed from role successfully",
      });
    } catch (error: any) {
      Logger.error(`Error in removeDocumentTypeFromRole controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Assign document type requirement to a role (admin function)
   * POST /documents/types/:documentTypeId/roles/:roleId
   */
  assignDocumentTypeToRole = async (req: Request, res: Response) => {
    try {
      const documentTypeId = parseInt(req.params.documentTypeId as string);
      const roleId = parseInt(req.params.roleId as string);
      const { sortOrder = 0, isOptional = false } = req.body;

      if (!documentTypeId || isNaN(documentTypeId)) {
        throw new HttpException("Valid document type ID is required", 400);
      }

      if (!roleId || isNaN(roleId)) {
        throw new HttpException("Valid role ID is required", 400);
      }

      const requirement = await this.documentService.assignDocumentTypeToRole(
        documentTypeId,
        roleId,
        sortOrder,
        isOptional
      );

      res.status(201).json({
        success: true,
        message: "Document type requirement assigned to role successfully",
        data: requirement,
      });
    } catch (error: any) {
      Logger.error(`Error in assignDocumentTypeToRole controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get all document requirements for a specific role (admin function)
   * GET /documents/roles/:roleId/requirements
   */
  getRoleDocumentRequirements = async (req: Request, res: Response) => {
    try {
      const roleId = parseInt(req.params.roleId as string);

      if (!roleId || isNaN(roleId)) {
        throw new HttpException("Valid role ID is required", 400);
      }

      const requirements = await this.documentService.getRoleDocumentRequirements(roleId);

      res.json({
        success: true,
        data: requirements,
      });
    } catch (error: any) {
      Logger.error(`Error in getRoleDocumentRequirements controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };
}
