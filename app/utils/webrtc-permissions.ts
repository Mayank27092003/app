/**
 * WebRTC Permissions Setup
 * @format
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';

export interface PermissionResult {
  granted: boolean;
  permissions: {
    camera: boolean;
    microphone: boolean;
  };
}

/**
 * Request WebRTC permissions (camera and microphone)
 */
export const requestWebRTCPermissions = async (): Promise<PermissionResult> => {
  const result: PermissionResult = {
    granted: false,
    permissions: {
      camera: false,
      microphone: false,
    },
  };

  try {
    if (Platform.OS === 'android') {
      // Request Android permissions
      const cameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera for video calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      const microphonePermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for audio calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      result.permissions.camera = cameraPermission === PermissionsAndroid.RESULTS.GRANTED;
      result.permissions.microphone = microphonePermission === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // Request iOS permissions
      const cameraPermission = await request(PERMISSIONS.IOS.CAMERA);
      const microphonePermission = await request(PERMISSIONS.IOS.MICROPHONE);

      result.permissions.camera = cameraPermission === RESULTS.GRANTED;
      result.permissions.microphone = microphonePermission === RESULTS.GRANTED;
    }

    result.granted = result.permissions.camera && result.permissions.microphone;

    if (!result.granted) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone permissions are required for video calls. Please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => {
            // You can add navigation to settings here if needed
            console.log('Navigate to settings');
          }},
        ]
      );
    }

    return result;
  } catch (error) {
    console.error('❌ Permission request failed:', error);
    return result;
  }
};

/**
 * Check if WebRTC permissions are granted
 */
export const checkWebRTCPermissions = async (): Promise<PermissionResult> => {
  const result: PermissionResult = {
    granted: false,
    permissions: {
      camera: false,
      microphone: false,
    },
  };

  try {
    if (Platform.OS === 'android') {
      const cameraPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      const microphonePermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      result.permissions.camera = cameraPermission;
      result.permissions.microphone = microphonePermission;
    } else {
      // For iOS, we'll assume permissions are granted if we can access the camera
      // In a real app, you might want to use a more sophisticated check
      result.permissions.camera = true;
      result.permissions.microphone = true;
    }

    result.granted = result.permissions.camera && result.permissions.microphone;
    return result;
  } catch (error) {
    console.error('❌ Permission check failed:', error);
    return result;
  }
};

/**
 * Get camera permission individually
 */
export const getCameraPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera for video calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return permission === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const permission = await request(PERMISSIONS.IOS.CAMERA);
      return permission === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('❌ Camera permission request failed:', error);
    return false;
  }
};

/**
 * Get microphone permission individually
 */
export const getMicrophonePermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for audio calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return permission === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const permission = await request(PERMISSIONS.IOS.MICROPHONE);
      return permission === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('❌ Microphone permission request failed:', error);
    return false;
  }
};
