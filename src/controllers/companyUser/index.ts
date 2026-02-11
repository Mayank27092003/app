import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { CompanyUserService } from "../../services/companyUser";
import { HttpException } from "../../utils/httpException";

export class CompanyUserController {
  private service = new CompanyUserService();

  /**
   * Add a user to a company
   * POST /company/:companyId/users
   */
  addUser = async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const { userId, roleId, isPrimary } = req.body;

      if (!userId) {
        throw new HttpException("userId is required", 400);
      }

      const companyUser = await this.service.addUserToCompany(
        Number(companyId),
        Number(userId),
        roleId ? Number(roleId) : null,
        isPrimary !== null && isPrimary !== undefined ? Boolean(isPrimary) : false
      );

      res.status(201).json({
        success: true,
        message: "User added to company successfully",
        data: companyUser,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: (error as Error).message,
        });
      }
    }
  };

  /**
   * Remove a user from a company
   * DELETE /company/:companyId/users/:userId
   */
  removeUser = async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = req.params;

      await this.service.removeUserFromCompany(
        Number(companyId),
        Number(userId)
      );

      res.json({
        success: true,
        message: "User removed from company successfully",
      });
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: (error as Error).message,
        });
      }
    }
  };

  /**
   * Update a user's role in a company
   * PUT /company/:companyId/users/:userId/role
   */
  updateUserRole = async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = req.params;
      const { roleId } = req.body;

      const companyUser = await this.service.updateUserRole(
        Number(companyId),
        Number(userId),
        roleId ? Number(roleId) : null
      );

      res.json({
        success: true,
        message: "User role updated successfully",
        data: companyUser,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: (error as Error).message,
        });
      }
    }
  };

  /**
   * Get all users in a company
   * GET /company/:companyId/users
   */
  getCompanyUsers = async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;

      const companyUsers = await this.service.getCompanyUsers(
        Number(companyId)
      );

      res.json({
        success: true,
        data: companyUsers,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: (error as Error).message,
        });
      }
    }
  };

  /**
   * Get all companies a user belongs to
   * GET /user/:userId/companies
   */
  getUserCompanies = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const companyUsers = await this.service.getUserCompanies(
        Number(userId)
      );

      res.json({
        success: true,
        data: companyUsers,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: (error as Error).message,
        });
      }
    }
  };
}

