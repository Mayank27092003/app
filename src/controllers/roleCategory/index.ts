import { Request, Response, NextFunction } from "express";
import { RoleCategoryService } from "../../services/roleCatgoryService";

export class RoleCategoryController {
  static async getRoleCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categories = await RoleCategoryService.getAllRoleCategories();
      res.status(200).json({ roleCategories: categories, success: true });
    } catch (error: any) {
      next(error);
    }
  }

  static async getCompanyTypes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { roleCategoryId } = req.params;
      const companyTypes =
        await RoleCategoryService.getCompanyTypesByRoleCategory(
          Number(roleCategoryId)
        );
        res.status(200).json({ companyTypes: companyTypes, success: true });
    } catch (error: any) {
      next(error);
    }
  }
}
