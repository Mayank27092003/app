/**
 * Notification Service
 * Handles all notification-related functionality
 */

import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onMessage,
  getMessaging,
  AuthorizationStatus,
  requestPermission,
  getToken,
  onTokenRefresh,
  hasPermission,
  setBackgroundMessageHandler,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { httpRequest, } from './http-service';
import { endPoints } from './endpoints';
import { NavigationService } from '@app/helpers/navigation-service';
import { logNotificationData, extractNotificationData } from '@app/utils/notification-logger';

const messaging = getMessaging();

class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;

  private constructor() { }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  public async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await this.requestUserIosPermission();
      } else {
        await this.requestUserAndroidPermission();
      }

      await this.handleTokenRefresh();
      const unsubscribe = this.setupForegroundMessageHandler();

      // Setup notification tap handlers
      this.setupNotificationTapHandlers();

      // Store unsubscribe function for cleanup if needed
      if (unsubscribe) {
        // You can store this for cleanup later if needed
        console.log('Foreground message handler setup complete');
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Handle notification tap and navigate to appropriate screen
   */
  private handleNotificationNavigation(remoteMessage: any): void {
    try {
      console.log('🔔 Notification tapped:', remoteMessage);

      if (!remoteMessage) {
        console.log('🔔 No notification data to handle');
        return;
      }

      const data = remoteMessage.data || {};
      const notification = remoteMessage.notification || {};

      console.log('🔔 Notification data:', data);
      console.log('🔔 Notification payload:', notification);

      // Wait for navigation to be ready
      const attemptNavigation = (retries = 5) => {
        if (!NavigationService.isReady.current) {
          if (retries > 0) {
            console.log('🔔 Navigation not ready, retrying...', retries);
            setTimeout(() => attemptNavigation(retries - 1), 500);
            return;
          } else {
            console.warn('🔔 Navigation not ready after retries, skipping navigation');
            return;
          }
        }

        try {
          // Handle different notification types based on data
          if (data.type === 'job' || data.jobId) {
            const jobId = data.jobId || data.id;
            if (jobId) {
              console.log('🔔 Navigating to JobDetailsScreen with jobId:', jobId);
              NavigationService.navigate('JobDetailsScreen', {
                jobId: Number.parseInt(jobId, 10),
                timestamp: Date.now(),
              });
              return;
            }
          }

          if (data.type === 'contract' || data.contractId) {
            const contractId = data.contractId || data.id;
            if (contractId) {
              console.log('🔔 Navigating to Contract/Tracking screen with contractId:', contractId);
              NavigationService.navigate('CustomDrawer', {
                screen: 'BottomTab',
                params: {
                  screen: 'TrackingScreen',
                  params: {
                    contractId: Number.parseInt(contractId, 10),
                    timestamp: Date.now(),
                  },
                },
              });
              return;
            }
          }

          // Handle new message notification (navigate to Messages tab)
          if (data.type === 'new_message') {
            console.log('🔔 New message notification - Navigating to Messages tab');
            NavigationService.navigate('CustomDrawer', {
              screen: 'BottomTab',
              params: {
                screen: 'MessagesScreen',
                params: {
                  timestamp: Date.now(),
                },
              },
            });
            return;
          }

          // Handle specific message notification (navigate to specific chat)
          if (data.type === 'message' || data.conversationId || data.chatId) {
            const conversationId = data.conversationId || data.chatId || data.id;
            if (conversationId) {
              console.log('🔔 Navigating to Chat screen with conversationId:', conversationId);
              NavigationService.navigate('ChatScreen', {
                conversationId: conversationId.toString(),
                timestamp: Date.now(),
              });
              return;
            }
          }

          // Handle document verification notifications
          if (data.type === 'document_verified' || data.type === 'document_rejected') {
            console.log('🔔 Document notification - Navigating to Profile tab');
            console.log('🔔 Document details:', {
              type: data.type,
              entityType: data.entityType,
              entityId: data.entityId,
              notificationId: data.notificationId,
            });

            NavigationService.navigate('CustomDrawer', {
              screen: 'BottomTab',
              params: {
                screen: 'ProfileScreen',
                params: {
                  timestamp: Date.now(),
                  documentId: data.entityId, // Pass document ID if needed
                  notificationType: data.type, // Pass type to show appropriate message
                },
              },
            });
            return;
          }

          // Handle user verification notifications
          if (data.type === 'user_verified' || data.type === 'user_rejected') {
            console.log('🔔 User verification notification - Navigating to Profile tab');
            console.log('🔔 User verification details:', {
              type: data.type,
              entityType: data.entityType,
              entityId: data.entityId,
              notificationId: data.notificationId,
            });

            NavigationService.navigate('CustomDrawer', {
              screen: 'BottomTab',
              params: {
                screen: 'ProfileScreen',
                params: {
                  timestamp: Date.now(),
                  notificationType: data.type, // Pass type to show appropriate message
                  verificationStatus: data.type === 'user_verified' ? 'verified' : 'rejected',
                },
              },
            });
            return;
          }

          if (data.type === 'notification' || data.notificationId) {
            console.log('🔔 Navigating to Notifications screen');
            NavigationService.navigate('CustomDrawer', {
              screen: 'BottomTab',
              params: {
                screen: 'NotificationScreen',
                params: {
                  timestamp: Date.now(),
                },
              },
            });
            return;
          }

          // Default: Navigate to home or notifications screen
          console.log('🔔 No specific navigation target, navigating to home');
          NavigationService.navigate('CustomDrawer', {
            screen: 'BottomTab',
            params: {
              screen: 'HomeScreen',
            },
          });
        } catch (navError) {
          console.error('🔔 Error navigating from notification:', navError);
        }
      };

      // Wait a bit for app to be ready, then attempt navigation
      setTimeout(() => attemptNavigation(), 1000);
    } catch (error) {
      console.error('🔔 Error handling notification navigation:', error);
    }
  }

  /**
   * Setup notification tap handlers
   */
  private setupNotificationTapHandlers(): void {
    try {
      // Handle notification when app is opened from background
      onNotificationOpenedApp(messaging, (remoteMessage) => {
        console.log('🔔 Notification tapped (from background)');

        // Log detailed notification data
        logNotificationData(remoteMessage, 'BACKGROUND TAP');

        // Extract and log structured data
        const data = extractNotificationData(remoteMessage);
        console.log('📦 Extracted Data:', data);

        this.handleNotificationNavigation(remoteMessage);
      });

      // Handle notification when app is opened from killed state
      getInitialNotification(messaging)
        .then((remoteMessage) => {
          if (remoteMessage) {
            console.log('🔔 Notification tapped (from killed state)');

            // Log detailed notification data
            logNotificationData(remoteMessage, 'KILLED STATE TAP');

            // Extract and log structured data
            const data = extractNotificationData(remoteMessage);
            console.log('📦 Extracted Data:', data);

            // Wait for app to fully initialize before navigating
            setTimeout(() => {
              this.handleNotificationNavigation(remoteMessage);
            }, 2000);
          }
        })
        .catch((error) => {
          console.error('🔔 Error getting initial notification:', error);
        });

      console.log('🔔 Notification tap handlers setup complete');
    } catch (error) {
      console.error('🔔 Error setting up notification tap handlers:', error);
    }
  }

  /**
   * Request notification permission for Android
   */
  private async requestUserAndroidPermission(): Promise<void> {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
        return;
      }
    }

    // Request FCM permission
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted:', authStatus);
      const token = await this.getFcmToken();
      if (token) {
        // Register token after getting it
        await this.registerFcmToken();
      }
    } else {
      console.log('Permission not granted');
    }
  }

  /**
   * Request notification permission for iOS
   */
  private async requestUserIosPermission(): Promise<void> {
    try {
      console.log('Requesting iOS notification permission...');

      // First check current permission status
      const currentStatus = await hasPermission(messaging);
      console.log('Current iOS permission status:', currentStatus);

      if (currentStatus === AuthorizationStatus.AUTHORIZED) {
        console.log('iOS notification permission already granted');
        const token = await this.getFcmToken();
        if (token) {
          // Register token after getting it
          await this.registerFcmToken();
        }
        return;
      }

      // Request permission
      const authorizationStatus = await requestPermission(messaging);
      console.log('iOS Permission request result:', authorizationStatus);

      if (authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        authorizationStatus === AuthorizationStatus.PROVISIONAL) {
        console.log('iOS notification permission granted');
        const token = await this.getFcmToken();
        if (token) {
          // Register token after getting it
          await this.registerFcmToken();
        }
      } else {
        console.log('iOS notification permission denied:', authorizationStatus);
      }
    } catch (error) {
      console.error('Error requesting iOS notification permission:', error);
    }
  }

  /**
   * Get FCM token
   */
  private async getFcmToken(): Promise<string | null> {
    try {
      const token = await getToken(messaging);
      if (token) {
        this.fcmToken = token;
        console.log('FCM Token:', token);
        await AsyncStorage.setItem('fcm_token', token);
        return token;
      } else {
        console.log('Failed to get FCM token');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Get or generate device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        // Generate a unique device ID if not exists
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback to a generated ID
      return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
  }

  /**
   * Get device name
   */
  private async getDeviceName(): Promise<string> {
    try {
      // Try to get device name from AsyncStorage if stored
      const storedName = await AsyncStorage.getItem('device_name');
      if (storedName) {
        return storedName;
      }

      // Generate a device name based on platform
      const deviceName = `${Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1)} Device`;
      await AsyncStorage.setItem('device_name', deviceName);
      return deviceName;
    } catch (error) {
      console.error('Error getting device name:', error);
      return `${Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1)} Device`;
    }
  }

  /**
   * Register FCM token with backend
   */
  public async registerFcmToken(): Promise<boolean> {
    try {
      // First try to get existing token from storage, if not available, get from Firebase
      let fcmToken = this.fcmToken || await this.getStoredFcmToken();

      // If no token in storage, try to get from Firebase
      if (!fcmToken) {
        fcmToken = await this.getFcmToken();
      }

      if (!fcmToken) {
        console.log('No FCM token available to register');
        return false;
      }

      const deviceId = await this.getDeviceId();
      const deviceName = await this.getDeviceName();
      const deviceType = Platform.OS; // 'ios' or 'android'

      const payload = {
        fcmToken,
        deviceId,
        deviceType,
        deviceName,
      };

      console.log('Registering FCM token:', payload);

      const response: any = await httpRequest.post(endPoints.registerFcmToken, payload);

      if (response?.success || response?.data) {
        console.log('FCM token registered successfully:', response);
        return true;
      } else {
        console.error('Failed to register FCM token:', response);
        return false;
      }
    } catch (error: any) {
      console.warn('⚠️ [NotificationService] FCM registration failed (non-fatal):', error);
      // Suppress fatal crash and return false so caller can handle gracefully
      return false;
    }
  }

  /**
   * Handle FCM token refresh
   */
  private async handleTokenRefresh(): Promise<void> {
    onTokenRefresh(messaging, async newToken => {
      console.log('New FCM Token:', newToken);
      this.fcmToken = newToken;
      await AsyncStorage.setItem('fcm_token', newToken);
      // Re-register the new token
      await this.registerFcmToken();
    });
  }

  /**
   * Setup foreground message handler
   */
  private setupForegroundMessageHandler(): (() => void) | undefined {
    const unsubscribe = onMessage(messaging, async remoteMessage => {
      console.log('📬 Foreground Notification Received');

      // Log detailed notification data
      logNotificationData(remoteMessage, 'FOREGROUND');

      // Extract structured data
      const data = extractNotificationData(remoteMessage);
      console.log('📦 Extracted Data:', data);

      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
    });

    // Create notification channel
    notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    return unsubscribe;
  }

  /**
   * Display local notification
   */
  public async displayLocalNotification(
    title: string,
    body: string,
  ): Promise<void> {
    try {
      // Request permission for local notifications
      await notifee.requestPermission();

      // Create a channel (required for Android)
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display notification
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  }

  /**
   * Get current FCM token
   */
  public getCurrentFcmToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Get stored FCM token from AsyncStorage
   */
  public async getStoredFcmToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('fcm_token');
    } catch (error) {
      console.error('Error getting stored FCM token:', error);
      return null;
    }
  }

  /**
   * Clear stored FCM token
   */
  public async clearFcmToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('fcm_token');
      this.fcmToken = null;
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  }

  /**
   * Check if notification permission is granted
   */
  public async checkPermissionStatus(): Promise<boolean> {
    try {
      const authStatus = await hasPermission(messaging);
      return (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Error checking permission status:', error);
      return false;
    }
  }

  /**
   * Manually request notification permission (can be called from UI)
   */
  public async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        await this.requestUserIosPermission();
        const status = await hasPermission(messaging);
        return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
      } else {
        await this.requestUserAndroidPermission();
        const status = await hasPermission(messaging);
        return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('Error manually requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Setup background message handler
   */
  public setupBackgroundMessageHandler(): void {
    setBackgroundMessageHandler(messaging, async remoteMessage => {
      console.log('📬 Background Notification Received');

      // Log detailed notification data
      logNotificationData(remoteMessage, 'BACKGROUND');

      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
    });
  }
}

// Export singleton instance
export default NotificationService.getInstance();
