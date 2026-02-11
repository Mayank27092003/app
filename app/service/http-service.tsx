/**
 * Axios API
 * Middleware of api request and response
 * @format
 */

import * as Config from "@app/configs";
import { AuthToken } from "@app/helpers";
import axios, { AxiosError } from "axios";
import { logoutUser } from "@app/module/auth";

/**
 * Creating custom instance for config
 * server configurations.
 * baseUrl, timeout, api-token etc.
 */

const httpRequest = axios.create({
  baseURL: Config.BASE_URL,
  timeout: Config.API_TIMEOUT || 3500,
  headers: {
    
    "Content-Type": "application/json",
  },
});
/**
 * axios request interceptors for debugging
 * and modify request data
 */

httpRequest.interceptors.request.use(
  async (reqConfig) => {
    const token = await AuthToken.get();

    if (token) reqConfig.headers.Authorization = `Bearer ${token}`;
console.log("httpRequesthttpRequest", reqConfig ,token);

    return reqConfig;
  },
  (error) => {
    console.log("error interceptor", error);
    return Promise.reject(error);
  }
);

/**
 * Customizing axios success and error
* data to easily handle them in app
 */
httpRequest.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("response", response.data);
    }
    return response.data;
  },
  async (error) => {
    console.log("errorccccc", error);
    // Handle 401 Unauthorized errors globally
    if (error?.response?.status === 401) {
      // Get the request URL to check if it's a login/signup endpoint
      // Check both the full URL and just the path
      const requestPath = error?.config?.url || '';
      const fullUrl = error?.request?.responseURL || '';
      const baseUrl = error?.config?.baseURL || '';
      const combinedUrl = fullUrl || (baseUrl + requestPath) || requestPath;
      
      console.log('🔍 401 Error - URL check:', { requestPath, fullUrl, baseUrl, combinedUrl });
      
      const isAuthEndpoint = combinedUrl.includes('/auth/login') || 
                            combinedUrl.includes('/auth/signup') ||
                            combinedUrl.includes('/auth/forgot-password') ||
                            combinedUrl.includes('/auth/reset-password') ||
                            combinedUrl.includes('/auth/verify-otp') ||
                            combinedUrl.includes('/auth/resend-otp') ||
                            combinedUrl.includes('/auth/delete-account') ||
                            requestPath.includes('/auth/login') ||
                            requestPath.includes('/auth/signup') ||
                            requestPath.includes('/auth/forgot-password') ||
                            requestPath.includes('/auth/reset-password') ||
                            requestPath.includes('/auth/verify-otp') ||
                            requestPath.includes('/auth/resend-otp') ||
                            requestPath.includes('/auth/delete-account');
      
      console.log('🔍 401 Error - isAuthEndpoint:', isAuthEndpoint);

      
      // Only log out if it's NOT an authentication endpoint (login/signup)
      // For login/signup, wrong credentials should just return the error
      if (!isAuthEndpoint) {
        console.log("🚨 401 Unauthorized error detected - logging out user");
        
        try {
          // Use the global logout function
          await logoutUser();
          console.log("✅ User logged out due to 401 error");
        } catch (logoutError) {
          console.error("❌ Error during logout:", logoutError);
        }
        
        // Return a specific 401 error that can be handled by components
        return Promise.reject({
          message: "Session expired. Please login again.",
          status: 401,
          isUnauthorized: true,
        });
      } else {
        // For auth endpoints (login/signup/delete-account), just return the error without logging out
        // For delete-account, the saga will handle the logout and navigation
        console.log("🚨 401 error on auth endpoint - returning error without logout");
        
        // For delete-account, suppress session expired message - let the saga handle it
        if (combinedUrl.includes('/auth/delete-account') || requestPath.includes('/auth/delete-account')) {
          // Return error without session expired message - saga will handle it
          const handledError: any = handleApiError(error);
          handledError.isDeleteAccount = true;
          handledError.suppressSessionExpired = true;
          return Promise.reject(handledError);
        }
        
        // Return the original error so login saga can handle it properly
        return Promise.reject(handleApiError(error));
      }
    }
    
    // Check if it's a Google token refresh error
    if (
      console.log("errorccccc", error),
      
      error?.response?.data?.error?.status === "UNAUTHENTICATED" 
    ) {
      // Import the new Google token service
      // const { refreshGoogleTokenIfNeeded } = await import(
      //   "./google-token-service"
      // );
      // const googleAuth = await getGoogleAuth();
      // console.log("googleAuth", googleAuth);
      // if (googleAuth) {
      //   try {
      //     // await refreshGoogleTokenIfNeeded(googleAuth);
      //     // Retry the original request with the new token
      //     return httpRequest.request(error.config);
      //   } catch (refreshError) {
      //     console.error("Failed to refresh Google token:", refreshError);
      //     // If refresh fails, reject with the original error
      //     return Promise.reject(handleApiError(error));
      //   }
      // }
    }
    return Promise.reject(handleApiError(error));
  }
);

/**
 * Handling error
 * @param {*} error
 * @returns
 */
const handleApiError = (error: AxiosError | any) => {
  if (__DEV__) {
    console.error("error in api", error?.response || error?.message || error);
    
    // Log detailed validation errors if available
    if (error?.response?.data?.errors) {
      console.error("📤 API Validation Errors:", error.response.data.errors);
    }
    
    if (error?.response?.data?.message) {
      console.error("📤 API Error Message:", error.response.data.message);
    }
  }

  if (error?.response?.data) {
    return {
      message:
        error?.response?.data?.message ||
        "Something went wrong. Please try again.",
      status: error?.response?.status || null,
      errors: error?.response?.data?.errors || null, // Include validation errors
    };
  } else if (error?.request) {
    return {
      message: "No response from server. Check your internet or server.",
    };
  } else {
    return {
      message: error?.message || "Unknown error occurred.",
    };
  }
};

/**
 * Helper function to check if an error is a 401 Unauthorized error
 * @param error - The error object to check
 * @returns boolean indicating if it's a 401 error
 */
export const isUnauthorizedError = (error: any): boolean => {
  return error?.status === 401 || error?.isUnauthorized === true;
};

/**
 * Helper function to check if an error is a session expired error
 * @param error - The error object to check
 * @returns boolean indicating if it's a session expired error
 */
export const isSessionExpiredError = (error: any): boolean => {
  return isUnauthorizedError(error) && 
         (error?.message?.includes("Session expired") || 
          error?.message?.includes("Please login again"));
};

export { httpRequest };
