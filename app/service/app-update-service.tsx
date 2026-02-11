/**
 * App Update Service
 * Checks for app updates from App Store and Play Store using react-native-version-check
 * @format
 */

import { Platform, Linking } from 'react-native';
import VersionCheck from 'react-native-version-check';

interface UpdateCheckResponse {
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion?: string;
  updateUrl?: string;
  forceUpdate?: boolean;
  releaseNotes?: string;
}

class AppUpdateService {
  /**
   * Get current app version
   */
  async getCurrentVersion(): Promise<string> {
    try {
      const version = await VersionCheck.getCurrentVersion();
      return version;
    } catch (error) {
      console.error('Error getting current version:', error);
      return '1.0.0';
    }
  }

  /**
   * Check for app updates using react-native-version-check
   */
  async checkForUpdate(): Promise<UpdateCheckResponse> {
    try {
      // Only check on Android and iOS
      if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
        return {
          hasUpdate: false,
          currentVersion: await this.getCurrentVersion(),
        };
      }

      const result = await VersionCheck.needUpdate();

      if (result?.isNeeded) {
        const currentVersion = await this.getCurrentVersion();
        
        return {
          hasUpdate: true,
          latestVersion: result.storeVersion || result.latestVersion,
          currentVersion: currentVersion,
          updateUrl: result.storeUrl,
          forceUpdate: false, // react-native-version-check doesn't provide force update info
          releaseNotes: result.description || undefined,
        };
      }

      return {
        hasUpdate: false,
        currentVersion: await this.getCurrentVersion(),
      };
    } catch (error) {
      console.error('Error checking for app update:', error);
      return {
        hasUpdate: false,
        currentVersion: await this.getCurrentVersion(),
      };
    }
  }

  /**
   * Get App Store or Play Store URL
   */
  async getStoreUrl(): Promise<string> {
    try {
      const storeUrl = await VersionCheck.getStoreUrl();
      return storeUrl;
    } catch (error) {
      console.error('Error getting store URL:', error);
      // Fallback URLs
      if (Platform.OS === 'ios') {
        return 'https://apps.apple.com/app/idcom.gofrts';
      } else {
        return 'https://play.google.com/store/apps/details?id=com.gofrts';
      }
    }
  }

  /**
   * Open App Store or Play Store
   */
  openStore(updateUrl?: string): void {
    if (updateUrl) {
      Linking.openURL(updateUrl).catch((err) => {
        console.error('Error opening store:', err);
      });
    } else {
      // Get store URL and open it
      this.getStoreUrl().then((url) => {
        Linking.openURL(url).catch((err) => {
          console.error('Error opening store:', err);
        });
      });
    }
  }
}

export const appUpdateService = new AppUpdateService();

