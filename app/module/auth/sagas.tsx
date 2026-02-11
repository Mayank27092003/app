/**
 * Auth sagas
 * @format
 */

import { call, put, takeLatest } from "redux-saga/effects";

//Screens
import {
  changeAppSection,
  dismissLoader,
  presentLoader,
  setAuthToken,
  setRoles,
  setUser,
  setProfile,
} from "@app/module/common";
import { AppSection, Routes } from "@app/navigator";
import { forgotPassword, login, resetPassword, roles, signUp, verifyOTP, resendOTP, deleteAccount } from "./slice";
import { showMessage } from "react-native-flash-message";
import { reconnectSocket } from "@app/service";
import { endPoints, httpRequest } from "@app/service";
import i18n from "@app/language/i18n";
import { AuthToken, NavigationService } from "@app/helpers";
import { profile } from "../profile/slice";
import notificationService from "@app/service/notification-service";

/**
 * Login action saga
 * @param {*} action - Login action with email and password
 */
function* loginSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email, password } = action.payload;

    console.log('🔐 Login attempt for:', email);
    console.log('📡 API endpoint:', endPoints.login);

    // Make API call
    const response = yield call(httpRequest.post, endPoints.login, {
      email,
      password,
    });

    console.log('✅ Login API response received');

    if (response?.success && response?.token) {
      // Store auth data
      yield put(setAuthToken(response.token));
      yield put(
        setUser({
          id: response?.user?.id,
          username: response?.user?.userName,
          email: response?.user?.email,
        })
      );

      // Save token
      try {
        yield call(AuthToken.set, response.token);
        console.log('✅ Auth token saved');
      } catch (tokenError) {
        console.error('❌ Error saving token:', tokenError);
      }

      // Initialize socket - WITH PROPER ERROR HANDLING
      try {
        console.log('🔌 Attempting socket reconnection...');
        yield call(reconnectSocket, response.token);
        console.log('✅ Socket reconnected');
      } catch (socketError) {
        console.error('⚠️ Socket reconnection failed (non-critical):', socketError);
        // Don't block login on socket error
      }

      // Register FCM token - WITH PROPER ERROR HANDLING
      try {
        console.log('📱 Attempting FCM registration...');
        yield call([notificationService, 'registerFcmToken']);
        console.log('✅ FCM registered');
      } catch (fcmError) {
        console.error('⚠️ FCM registration failed (non-critical):', fcmError);
        // Don't block login on FCM error
      }

      // Small delay to ensure everything is initialized
      yield call(delay, 500);

      // Check verification and navigate
      if (response?.user?.isEmailVerified === false) {
        console.log('📧 Email not verified, navigating to OTP');

        showMessage({
          message: String(i18n.t("common.verificationRequired") || "Verification Required"),
          description: String(i18n.t("common.verificationRequiredDesc") || "Please verify your email"),
          type: "info",
          duration: 4000,
        });

        // Wait a bit more before navigation
        yield call(delay, 300);

        // Navigate to OTP screen
        try {
          NavigationService.navigate(Routes.OTPScreen, {
            email: email,
            phone: email,
            purpose: 'email_verification',
            source: 'login'
          });
        } catch (navError) {
          console.error('❌ Navigation to OTP failed:', navError);
        }
      } else {
        console.log('✅ Email verified, navigating to main app');

        showMessage({
          message: String(`${i18n.t("auth.login.title") || "Welcome back"} ${response?.user?.userName || ""}!`),
          type: "success",
          duration: 3000,
        });

        // Wait before changing section
        yield call(delay, 300);

        // Navigate to main app
        try {
          yield put(changeAppSection(AppSection.MainSection));
        } catch (sectionError) {
          console.error('❌ Error changing app section:', sectionError);
        }
      }
    } else {
      console.error('❌ Login failed - invalid response');
      showMessage({
        message: String(i18n.t("auth.login.failed") || "Login Failed"),
        description: String(response?.message || "Invalid credentials"),
        type: "danger",
        duration: 4000,
      });
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);

    const errorMessage = error?.response?.data?.message ||
      error?.message ||
      i18n.t("auth.login.error") ||
      "Login failed. Please try again.";

    showMessage({
      message: String(i18n.t("auth.login.failed") || "Login Failed"),
      description: String(errorMessage),
      type: "danger",
      duration: 4000,
    });
  } finally {
    yield put(dismissLoader());
  }
}

// Helper delay function
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function* rolesSaga(): any {
  try {
    // yield put(presentLoader());

    const response = yield call(httpRequest.get, endPoints.roles);
    console.log("roles cat:", response);

    if (response?.success) {
      // yield put(setAuthToken(response.token));
      yield put(setRoles(response?.roleCategories));
      // AuthToken.set(response.token);

      // showMessage({
      //   message: `Welcome back ${response?.user?.userName}!`,
      //   type: "success",
      // });
    } else {
      showMessage({
        message: "Login failed. Please try again.",
        type: "danger",
      });
    }
  } catch (error: any) {
    console.log(error, "erorrr login");
    showMessage({
      message: error?.message || "Login failed. Please try again.",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}
function* loginActionSaga({ payload }: any) {
  try {
    yield put(setUser({ email: payload.email }));
    yield put(changeAppSection(AppSection.MainSection));
  } catch (error) { }
}
function* signUpSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { userName, email, password, callbackUrl, companyName, companyTypeId, phoneNumber, profileImage } = action.payload;

    const response = yield call(httpRequest.post, endPoints.signup, {
      email,
      password,
      userName,
      callbackUrl,
      companyName,
      companyTypeId,
      phoneNumber,
      profileImage
    });

    console.log("Signup response:", response);

    if (response?.success) {
      showMessage({
        message: response?.message || i18n.t("auth.register.success") || "Signup successful! Please verify your email.",
        type: "success",
      });

      try {
        NavigationService.navigate(Routes.OTPScreen, {
          email: email,
          purpose: 'email_verification',
          source: 'signup'
        });
      } catch (navError) {
        console.error("Navigation error in signup saga:", navError);
      }
    } else {
      console.log(response, 'response signuperrr');
      let errorMessage = i18n.t("common.errorOccurred") || "Something went wrong. Please try again.";

      if (response?.errors && Array.isArray(response.errors) && response.errors.length > 0) {
        const errorMessages = response.errors
          .map((err: any) => err?.message)
          .filter((msg: string) => msg && msg.trim() !== '');

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        } else if (response?.message) {
          errorMessage = response.message;
        }
      } else if (response?.message) {
        errorMessage = response.message;
      }

      showMessage({
        message: errorMessage,
        type: "danger",
      });
    }
  } catch (error: any) {
    console.log(error, "error signup");

    let errorMessage = "Signup failed. Please try again.";

    // Priority: errors[] array > response.data.message > error.message > default
    const responseData = error;

    if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      // Extract messages from errors array
      const errorMessages = responseData.errors
        .map((err: any) => err?.message)
        .filter((msg: string) => msg && msg.trim() !== '');

      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join('\n');
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      }
    } else if (responseData?.message) {
      const dbMessage = responseData.message;
      // Handle specific database constraint errors
      if (dbMessage.includes("duplicate key value violates unique constraint")) {
        if (dbMessage.includes("users_username_unique")) {
          errorMessage = "Username already exists. Please choose a different username.";
        } else if (dbMessage.includes("users_email_unique")) {
          errorMessage = "Email already exists. Please use a different email or try logging in.";
        } else {
          errorMessage = "This information is already registered. Please use different details.";
        }
      } else {
        errorMessage = dbMessage;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    showMessage({
      message: errorMessage,
      type: "danger",
    });

    // Return error response to UI
    return { success: false, error: errorMessage };
  } finally {
    yield put(dismissLoader());
  }
}
/**
 * Verify OTP saga
 * @param {*} action - Verify OTP action with email and otp
 */
function* forgotPasswordSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email } = action.payload;

    const response = yield call(httpRequest.post, endPoints.forgotPassword, {
      email,
      callbackUrl: "https://www.google.com/"
    });
    console.log(response, 'forget response')
    showMessage({
      message: response?.message || "Reset link sent to your email",
      type: "success",
    });

    // Call the onSuccess callback to show OTP input
    action.payload.onSuccess?.();
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || "Failed to send reset link. Please try again.";

    showMessage({
      message: errorMessage,
      type: "danger",
    });

    // Call the onError callback
    action.payload.onError?.(error);
  } finally {
    yield put(dismissLoader());
  }
}
function* profileSaga(): any {
  try {
    const response = yield call(httpRequest.get, endPoints.profile, {});

    if (response) {
      console.log(response, "profile response");
      yield put(setProfile({ ...response?.data }));
    } else {
      showMessage({
        message: "Unable to fetch profile. Please try again.",
        type: "danger",
      });
    }
  } catch (error: any) {
    showMessage({
      message: "Unable to fetch profile. Please try again.",

      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Verify OTP saga
 * @param {*} action - Verify OTP action with email, otp, and purpose
 */
function* verifyOTPSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email, otp, purpose, source, onSuccess, onError } = action.payload;
    console.log("Verify OTP payload:", { email, otp, purpose, source });

    const response = yield call(httpRequest.post, endPoints.verifyOTP, {
      email,
      otp,
      purpose: purpose || "email_verification",
    });

    console.log("Verify OTP response:", response);

    if (response?.success) {
      // Handle different purposes
      if (purpose === "password_reset") {
        // For password reset, just show success message and call callback
        showMessage({
          message: "OTP Verified",
          description: "Your OTP has been verified successfully!",
          type: "success",
        });

        // Call the onSuccess callback with response data
        onSuccess?.(response);
      } else if (purpose === "email_verification") {
        if (source === "signup") {
          // For email verification during signup, don't auto-login
          showMessage({
            message: "Email Verified Successfully",
            description: "Your email has been verified. Please login to continue.",
            type: "success",
          });

          // Call the onSuccess callback to let the UI handle navigation
          onSuccess?.(response);
        } else {
          // For email verification during login, auto-login
          // Store auth token if provided
          if (response?.token) {
            yield put(setAuthToken(response.token));
          }

          // Store user data if provided
          if (response?.user) {
            yield put(setUser(response.user));
          } else {
            // Create a basic user object if not provided in response
            yield put(setUser({
              id: null,
              username: null,
              email: email,
            }));
          }

          showMessage({
            message: "Email Verified Successfully",
            description: "Your email has been verified. Welcome back!",
            type: "success",
          });

          // Register FCM token after email verification
          try {
            const registerFcm = async () => {
              return await notificationService.registerFcmToken();
            };
            yield call(registerFcm);
            console.log('FCM token registration initiated after email verification');
          } catch (fcmError) {
            console.error('Error registering FCM token after email verification:', fcmError);
            // Don't block navigation if FCM registration fails
          }

          // Navigate to home screen after setting user data
          yield put(changeAppSection(AppSection.MainSection));
        }
      } else {
        // For other purposes (like login flow)
        // Store auth token if provided
        if (response?.token) {
          yield put(setAuthToken(response.token));
        }

        // Store user data if provided
        if (response?.user) {
          yield put(setUser(response.user));
        } else {
          // Create a basic user object if not provided in response
          yield put(setUser({
            id: null,
            username: null,
            email: email,
          }));
        }

        showMessage({
          message: "OTP Verified",
          description: "Your account has been verified successfully!",
          type: "success",
        });

        // Navigate to home screen after setting user data
        yield put(changeAppSection(AppSection.MainSection));
      }
    } else {
      const errorMessage = response?.message || "Invalid OTP. Please try again.";
      showMessage({
        message: "Verification Failed",
        description: errorMessage,
        type: "danger",
      });

      // Call the onError callback
      onError?.({ message: errorMessage });
    }
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    const errorMessage = error?.response?.data?.message || error?.message || "An error occurred during verification";

    showMessage({
      message: "Verification Error",
      description: errorMessage,
      type: "danger",
    });

    // Call the onError callback
    action.payload.onError?.({ message: errorMessage });
  } finally {
    yield put(dismissLoader());
  }
}

/**
 * Resend OTP saga
 * @param {*} action - Resend OTP action with email and purpose
 */
function* resendOTPSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { email, purpose } = action.payload;
    console.log("Resend OTP payload:", { email, purpose });

    const response = yield call(httpRequest.post, endPoints.resendOTP, {
      email,
      purpose: purpose || "email_verification",
    });

    console.log("Resend OTP response:", response);

    if (response?.success) {
      showMessage({
        message: "OTP Resent",
        description: "A new verification code has been sent to your email",
        type: "success",
      });
    } else {
      showMessage({
        message: "Resend Failed",
        description: response?.message || "Failed to resend OTP. Please try again.",
        type: "danger",
      });
    }
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    showMessage({
      message: "Resend Error",
      description: error?.response?.data?.message || error?.message || "An error occurred while resending OTP",
      type: "danger",
    });
  } finally {
    yield put(dismissLoader());
  }
}

function* resetPasswordSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { token, newPassword, onSuccess, onError } = action.payload;
    console.log("Reset password payload:", { token, newPassword });

    const response = yield call(httpRequest.post, endPoints.resetPassword, {
      token,
      newPassword,
    });

    console.log("Reset password response:", response);

    if (response?.success) {
      showMessage({
        message: "Password Reset Successful",
        description: "Your password has been reset successfully!",
        type: "success",
      });
      onSuccess?.(response);
    } else {
      const errorMessage = response?.message || "Failed to reset password. Please try again.";
      showMessage({
        message: "Reset Failed",
        description: errorMessage,
        type: "danger",
      });
      onError?.({ message: errorMessage });
    }
  } catch (error: any) {
    console.error("Reset password error:", error);
    const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while resetting password";
    showMessage({
      message: "Reset Error",
      description: errorMessage,
      type: "danger",
    });
    action.payload.onError?.({ message: errorMessage });
  } finally {
    yield put(dismissLoader());
  }
}

function* deleteAccountSaga(action: any): any {
  try {
    yield put(presentLoader());
    const { password, onSuccess, onError } = action.payload;
    console.log("Delete account payload:", { password: "***" });

    // Call DELETE endpoint with password in body
    const response = yield call(httpRequest.delete, endPoints.deleteAccount, {
      data: {
        password: password,
      },
    });

    console.log("Delete account response:", response);

    // Check if the response indicates success
    // A successful deletion should have success: true or no error message
    // A wrong password would have an error message
    if (response?.success === true || (response?.success === undefined && !response?.message)) {

      // Clear Zustand auth store
      const { useAuthStore } = yield import("@app/store/authStore");
      useAuthStore.getState().logout();

      // Clear auth token
      const { AuthToken } = yield import("@app/helpers");
      yield call(AuthToken.clear.bind(AuthToken));


      // Disconnect socket
      const { disconnectSocket } = yield import("@app/service");
      disconnectSocket();

      // Clear user data from Redux
      yield put(setAuthToken(null));
      yield put(setUser(null));
      yield put(setProfile(null));

      // Dispatch logout to clear all state
      const { logoutApp } = yield import("@app/module/common");
      yield put(logoutApp());

      showMessage({
        message: i18n.t("common.accountDeleted") || "Account Deleted",
        description: i18n.t("common.accountDeletedDesc") || "Your account has been successfully deleted.",
        type: "success",
        duration: 3000,
      });

      // Navigate to login screen
      NavigationService.navigate(Routes.LoginScreen, {});

      onSuccess?.();
    } else {
      const errorMessage = response?.message || "Failed to delete account. Please try again.";
      showMessage({
        message: i18n.t("common.error"),
        description: errorMessage,
        type: "danger",
      });
      onError?.({ message: errorMessage });
    }
  } catch (error: any) {
    console.error("Delete account error:", error);

    // Check if it's a 401 error
    const is401 = error?.status === 401 || error?.response?.status === 401;
    const errorMessage = error?.response?.data?.message || error?.message;

    // If it's a 401 with an error message (not "Session expired"), it's wrong password
    // The suppressSessionExpired flag is just to prevent showing "Session expired" message,
    // but we still need to handle wrong password errors
    if (is401 && errorMessage && !errorMessage.includes("Session expired")) {
      // Wrong password - show error and don't navigate
      const wrongPasswordMessage = errorMessage || i18n.t("common.invalidPassword") || "Invalid password. Please try again.";
      showMessage({
        message: i18n.t("common.error"),
        description: wrongPasswordMessage,
        type: "danger",
        duration: 4000,
      });
      action.payload.onError?.({ message: wrongPasswordMessage });
    } else if (is401) {
      // 401 without error message or with "Session expired" - account was successfully deleted
      console.log("Delete account returned 401 - treating as successful deletion");

      // Clear auth token
      const { AuthToken } = yield import("@app/helpers");
      yield call(AuthToken.clear.bind(AuthToken));

      // Clear Zustand auth store
      const { useAuthStore } = yield import("@app/store/authStore");
      useAuthStore.getState().logout();

      // Disconnect socket
      const { disconnectSocket } = yield import("@app/service");
      disconnectSocket();

      // Clear user data from Redux
      yield put(setAuthToken(null));
      yield put(setUser(null));
      yield put(setProfile(null));

      // Dispatch logout to clear all state
      const { logoutApp } = yield import("@app/module/common");
      yield put(logoutApp());

      showMessage({
        message: i18n.t("common.accountDeleted") || "Account Deleted",
        description: i18n.t("common.accountDeletedDesc") || "Your account has been successfully deleted.",
        type: "success",
        duration: 3000,
      });

      // Navigate to login screen
      NavigationService.navigate(Routes.LoginScreen, {});

      action.payload.onSuccess?.();
    } else {
      // Other errors (network, server errors, etc.)
      const finalErrorMessage = errorMessage || "An error occurred while deleting account";
      showMessage({
        message: i18n.t("common.error"),
        description: finalErrorMessage,
        type: "danger",
        duration: 4000,
      });
      action.payload.onError?.({ message: finalErrorMessage });
    }
  } finally {
    yield put(dismissLoader());
  }
}

function* authSagas() {
  yield takeLatest(login, loginSaga);
  yield takeLatest(signUp, signUpSaga);
  yield takeLatest(roles, rolesSaga);
  yield takeLatest(forgotPassword, forgotPasswordSaga);
  yield takeLatest(resetPassword, resetPasswordSaga);
  yield takeLatest(verifyOTP, verifyOTPSaga);
  yield takeLatest(resendOTP, resendOTPSaga);
  yield takeLatest(profile, profileSaga);
  yield takeLatest(deleteAccount, deleteAccountSaga);
}

export { authSagas };
