/**
 * Auth slice
 * @format
 */

import { createAction } from '@reduxjs/toolkit';

export const login = createAction<{}>('AUTH/LOGIN');
export const signUp = createAction<any>("AUTH/SIGN_UP");
export const roles = createAction<any>("AUTH/ROLES");
export const forgotPassword = createAction<any>("AUTH/FORGOT_PASSWORD");
export const verifyOTP = createAction<any>("AUTH/VERIFY_OTP");
export const resendOTP = createAction<any>("AUTH/RESEND_OTP");
export const resetPassword = createAction<any>("AUTH/RESET_PASSWORD");
export const deleteAccount = createAction<{ password: string; onSuccess?: () => void; onError?: (error: any) => void }>("AUTH/DELETE_ACCOUNT");