import { CompanyUser } from "../../models/companyUser";
import { Company } from "../../models/companies";
import { User } from "../../models/users";
import { Role } from "../../models/roles";
import { HttpException } from "../../utils/httpException";

export class CompanyUserService {
  /**
   * Add a user to a company with a specific role
   */
  async addUserToCompany(
    companyId: number,
    userId: number,
    roleId: number | null,
    isPrimary: boolean = false
  ): Promise<CompanyUser> {
    // Verify company exists
    const company = await Company.query().findById(companyId);
    if (!company) {
      throw new HttpException("Company not found", 404);
    }

    // Verify user exists
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    // Verify role exists if roleId is provided
    if (roleId !== null) {
      const role = await Role.query().findById(roleId);
      if (!role) {
        throw new HttpException("Role not found", 404);
      }
    }

    // Check if user is already in the company
    const existingCompanyUser = await CompanyUser.query()
      .where({ companyId, userId })
      .first();

    if (existingCompanyUser) {
      throw new HttpException("User is already a member of this company", 400);
    }

    // If setting as primary, unset other primary users
    if (isPrimary) {
      await CompanyUser.query()
        .where({ companyId, isPrimary: true })
        .patch({ isPrimary: false });
    }

    // Create the company user relationship
    const companyUser = await CompanyUser.query().insert({
      companyId,
      userId,
      roleId,
      isPrimary,
    });

    return companyUser;
  }

  /**
   * Remove a user from a company
   */
  async removeUserFromCompany(
    companyId: number,
    userId: number
  ): Promise<void> {
    // Verify company exists
    const company = await Company.query().findById(companyId);
    if (!company) {
      throw new HttpException("Company not found", 404);
    }

    // Find the company user relationship
    const companyUser = await CompanyUser.query()
      .where({ companyId, userId })
      .first();

    if (!companyUser) {
      throw new HttpException("User is not a member of this company", 404);
    }

    // Delete the relationship
    await CompanyUser.query().deleteById(companyUser.id);
  }

  /**
   * Update a user's role in a company
   */
  async updateUserRole(
    companyId: number,
    userId: number,
    roleId: number | null
  ): Promise<CompanyUser> {
    // Verify company exists
    const company = await Company.query().findById(companyId);
    if (!company) {
      throw new HttpException("Company not found", 404);
    }

    // Verify role exists if roleId is provided
    if (roleId !== null) {
      const role = await Role.query().findById(roleId);
      if (!role) {
        throw new HttpException("Role not found", 404);
      }
    }

    // Find the company user relationship
    const companyUser = await CompanyUser.query()
      .where({ companyId, userId })
      .first();

    if (!companyUser) {
      throw new HttpException("User is not a member of this company", 404);
    }

    // Update the role
    const updatedCompanyUser = await CompanyUser.query()
      .patchAndFetchById(companyUser.id, { roleId });

    return updatedCompanyUser;
  }

  /**
   * Get all users in a company
   */
  async getCompanyUsers(companyId: number): Promise<CompanyUser[]> {
    const company = await Company.query().findById(companyId);
    if (!company) {
      throw new HttpException("Company not found", 404);
    }

    const companyUsers = await CompanyUser.query()
      .where({ companyId })
      .withGraphFetched("[user, role]")
      .orderBy("isPrimary", "desc")
      .orderBy("id", "asc");

    return companyUsers;
  }

  /**
   * Get all companies a user belongs to
   */
  async getUserCompanies(userId: number): Promise<CompanyUser[]> {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const companyUsers = await CompanyUser.query()
      .where({ userId })
      .withGraphFetched("[company, role]")
      .orderBy("isPrimary", "desc")
      .orderBy("id", "asc");

    return companyUsers;
  }
}

export default new CompanyUserService();

