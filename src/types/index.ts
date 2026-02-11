import { Request } from "express";

export interface UserRole {
  id: number;
  role: {
    id: number;
    name: string;
    description?: string;
    isCompanyRole: boolean;
    jobPostFee?: number;
    sortOrder: number;
  } | null;
  sortOrder: number;
  assignedAt?: string;
}

export interface AuthPayload {
  userId: number;
  id: number;
  email: string;
  isEmailVerified: boolean;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  phoneCountryCode?: string | null;
  profileImage?: string | null;
  roles?: UserRole[];
  isAdmin?: boolean;
  verification?: any;
  documents?: any[];
  company?: any;
  driver?: any;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: AuthPayload;
}
