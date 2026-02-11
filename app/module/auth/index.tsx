/**
 * @format
 * Auth Module
 */

import { LoginScreen } from './view/login';
import { OTPScreen } from './view/otp';
import { RegisterScreen } from './view/register';
import { RoleSelectScreen } from './view/role-select';
import { ForgetPassword } from './view/forgetPassword';
import ResetPasswordScreen from './view/resetPassword';

/**
 * Global logout function for handling 401 errors
 * Clears auth token and dispatches logout action
 */
export const logoutUser = async () => {
  try {
    // Clear auth token
    const { AuthToken } = await import("@app/helpers");
    await AuthToken.clear();
    
    // Import and dispatch logout action
    const { logoutApp } = await import("@app/module/common");
    const { store } = await import("@app/redux/store");
    
    store.dispatch(logoutApp());
    
    console.log("✅ User logged out successfully");
  } catch (error) {
    console.error("❌ Error during logout:", error);
    throw error;
  }
};

export { LoginScreen, OTPScreen, RegisterScreen, RoleSelectScreen, ForgetPassword, ResetPasswordScreen };
