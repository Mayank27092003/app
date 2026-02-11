/**
 * Permission Service
 * @format
 */

import { Platform, PermissionsAndroid } from "react-native";
import { showMessage } from "@app/global";

export interface PermissionResult {
  granted: boolean;
  error?: string;
}

export class PermissionService {
  /**
   * Request camera permission for Android
   */
  static async requestCameraPermission(): Promise<PermissionResult> {
    if (Platform.OS !== "android") {
      return { granted: true };
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "This app needs access to your camera to take photos.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      return {
        granted: granted === PermissionsAndroid.RESULTS.GRANTED,
        error:
          granted !== PermissionsAndroid.RESULTS.GRANTED
            ? "Camera permission denied"
            : undefined,
      };
    } catch (err) {
      return {
        granted: false,
        error: "Failed to request camera permission",
      };
    }
  }

  /**
   * Request storage permission for Android
   */
  static async requestStoragePermission(): Promise<PermissionResult> {
    if (Platform.OS !== "android") {
      return { granted: true };
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "This app needs access to your storage to save photos.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      return {
        granted: granted === PermissionsAndroid.RESULTS.GRANTED,
        error:
          granted !== PermissionsAndroid.RESULTS.GRANTED
            ? "Storage permission denied"
            : undefined,
      };
    } catch (err) {
      return {
        granted: false,
        error: "Failed to request storage permission",
      };
    }
  }

  /**
   * Request both camera and storage permissions
   */
  static async requestMediaPermissions(): Promise<PermissionResult> {
    const cameraResult = await this.requestCameraPermission();
    if (!cameraResult.granted) {
      return cameraResult;
    }

    const storageResult = await this.requestStoragePermission();
    if (!storageResult.granted) {
      return storageResult;
    }

    return { granted: true };
  }

  /**
   * Show permission denied message
   */
  static showPermissionDeniedAlert(permissionType: string) {
    showMessage({
      message: `You need to grant ${permissionType} permission to use this feature.`,
      type: "warning",
    });
  }

  /**
   * Open app settings
   */
  private static openAppSettings() {
    // TODO: Implement app settings navigation
    console.log("Open app settings");
  }
}
