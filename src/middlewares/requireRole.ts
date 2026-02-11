import { Response, NextFunction } from "express";
import { HttpException } from "../utils/httpException";
import { AuthenticatedRequest } from "../types";

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next(new HttpException("Unauthorized: User not authenticated", 401));
    }

    // Check if user has any of the required roles
    const userRoles = user.roles || [];
    const userRoleNames = userRoles
      .map((userRole) => userRole?.role?.name?.toLowerCase())
      .filter((name): name is string => !!name);

    const hasRequiredRole = roles.find((requiredRole) =>
      userRoleNames.includes(requiredRole.toLowerCase())
    );

    if (!hasRequiredRole) {
      return next(
        new HttpException(
          `Forbidden: insufficient permissions. Required roles: ${roles.join(", ")}`,
          403
        )
      );
    }

    next();
  };
}
