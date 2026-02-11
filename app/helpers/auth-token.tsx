/**
 * App Auth Token & Password Reset Token
 * @format
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "appAuthToken";
const PASSWORD_RESET_TOKEN_KEY = "passwordResetToken";

class AuthToken {
  private static token: string | null = null;

  // Save to memory + AsyncStorage
  static async set(token: string): Promise<void> {
    this.token = token;
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error saving auth token:", error);
    }
  }

  // Get from memory first, fallback to AsyncStorage
  static async get(): Promise<string | null> {
    if (this.token) return this.token;
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      this.token = storedToken;
      return storedToken;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  // Remove token from everywhere
  static async clear(): Promise<void> {
    this.token = null;
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error("Error clearing auth token:", error);
    }
  }
}

class PasswordResetToken {
  private static resetToken: string | null = null;

  static async set(resetToken: string): Promise<void> {
    this.resetToken = resetToken;
    try {
      await AsyncStorage.setItem(PASSWORD_RESET_TOKEN_KEY, resetToken);
    } catch (error) {
      console.error("Error saving password reset token:", error);
    }
  }

  static async get(): Promise<string | null> {
    if (this.resetToken) return this.resetToken;
    try {
      const storedToken = await AsyncStorage.getItem(PASSWORD_RESET_TOKEN_KEY);
      this.resetToken = storedToken;
      return storedToken;
    } catch (error) {
      console.error("Error getting password reset token:", error);
      return null;
    }
  }

  static async clear(): Promise<void> {
    this.resetToken = null;
    try {
      await AsyncStorage.removeItem(PASSWORD_RESET_TOKEN_KEY);
    } catch (error) {
      console.error("Error clearing password reset token:", error);
    }
  }
}

export { AuthToken, PasswordResetToken };