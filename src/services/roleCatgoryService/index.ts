import { CompanyType, RoleCategory } from "../../models";
import { HttpException } from "../../utils/httpException";

export class RoleCategoryService {
  static async getAllRoleCategories() {
    return await RoleCategory.query();
  }

  static async getCompanyTypesByRoleCategory(roleCategoryId: number) {
    const roleCategory = await RoleCategory.query().findById(roleCategoryId);
    if (!roleCategory) {
      throw new HttpException("Role category not found", 404);
    }

    return await CompanyType.query().where({ roleCategoryId });
  }
}

export default new RoleCategoryService();
