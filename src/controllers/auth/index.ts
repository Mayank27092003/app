import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/auth";
import {
  ChangePasswordInput,
  DeleteAccountInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from "../../validators/auth.schema";
import { UserService } from "../../services/user";
import { OtpPurpose } from "../../constants/otp";
import { HttpException } from "../../utils/httpException";
import { AuthenticatedRequest } from "../../types";

const authService = new AuthService();
export class AuthController {
  async signup(
    req: Request<{}, {}, SignupInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userName, email, password, callbackUrl, companyTypeId, companyName, profileImage,phoneNumber,phoneCountryCode } = req.body as any;
      const result = await authService.signup(
        userName,
        email,
        password,
        callbackUrl,
        companyTypeId,
        companyName,
        profileImage,
        phoneNumber,
        phoneCountryCode,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async verifyEmailByToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = (req.query?.token as string) || (req.body as any)?.token;
      if (!token) {
        throw new HttpException("Token is required", 400);
      }
      const result = await authService.verifyEmailToken(token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password, callbackUrl } = req.body;
      const result = await authService.login(email, password, callbackUrl);
      res.json({ success: true, token: result.token, user: result.user });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { otp, purpose, email } = req.body;
      const user = await UserService.requireByEmail(email);
      const result = await authService.verifyOtp(user.id, otp, purpose);
      res.json({ ...result });
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, purpose } = req.body;

      // Get user by email
      const user = await UserService.requireByEmail(email);

      // Optional: prevent resending if already verified
      if (purpose === OtpPurpose.EMAIL_VERIFICATION && user.isEmailVerified) {
        throw new HttpException("Email is already verified.", 404);
      }
      await authService.sendOtp(user.id, email, purpose);
      res.json({ success: true, message: "OTP resent." });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(
    req: Request<{}, {}, ForgotPasswordInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, callbackUrl } = req.body;
      const result = await authService.forgotPassword(email, callbackUrl);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(
    req: Request<{}, {}, ResetPasswordInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(
    req: AuthenticatedRequest<{}, {}, ChangePasswordInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const result = await authService.changePassword(
        userId,
        oldPassword,
        newPassword
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(
    req: AuthenticatedRequest<{}, {}, DeleteAccountInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { password } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpException("Unauthorized", 401);
      }

      const result = await authService.deleteAccount(userId, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
