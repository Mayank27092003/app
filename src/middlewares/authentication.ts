import { Response, NextFunction } from "express";
import { HttpException } from "../utils/httpException";
import { verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types";
import { UserService } from "../services/user";

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = (req.headers as Record<string, string | undefined>)
    .authorization;
  console.log(authHeader, "auth");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpException("Unauthorized: Token missing", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken<{
      id:number,
      userId: number;
      email: string;
      isEmailVerified: boolean;
    }>(token);
    req.user = decoded;
    req.user.id = decoded.userId;
    const userInfo = await UserService.getProfileById(decoded.userId);
    if (!userInfo) {
      throw new HttpException("Unauthorized: unknown user found", 401);
    }
    req.user = userInfo;
    req.user.isAdmin = !!userInfo.roles.find((role) => role?.role?.name?.toLowerCase() === "admin"),

    next();
  } catch (err) {
    console.log(err, "err");
    return next(
      new HttpException("Unauthorized: Invalid or expired token", 401)
    );
  }
}
