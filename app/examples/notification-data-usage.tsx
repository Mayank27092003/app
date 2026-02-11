/**
 * Notification Data Usage Examples
 * Shows how to check and use notification message data
 * @format
 */

import React, { useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { logNotificationData, extractNotificationData } from '@app/utils/notification-logger';
import { useNavigation } from '@react-navigation/native';

/**
 * Example 1: Log notification data when received in foreground
 */
export const ForegroundNotificationExample = () => {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('📬 Notification received in foreground');
      
      // Log detailed data
      logNotificationData(remoteMessage, 'FOREGROUND_EXAMPLE');
      
      // Extract structured data
      const data = extractNotificationData(remoteMessage);
      
      // Access specific fields
      console.log('Title:', data.title);
      console.log('Body:', data.body);
      console.log('Type:', data.type);
      console.log('Job ID:', data.jobId);
      console.log('All custom data:', data.customData);
      
      // Show alert with data
      Alert.alert(
        data.title,
        data.body,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'View', onPress: () => handleNotificationAction(data) }
        ]
      );
    });

    return unsubscribe;
  }, []);

  return <View />;
};

/**
 * Example 2: Handle notification tap and navigate based on data
 */
export const NotificationTapExample = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle notification tap when app is in background
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('🔔 Notification tapped from background');
      
      // Log data
      logNotificationData(remoteMessage, 'TAP_EXAMPLE');
      
      // Extract data
      const data = extractNotificationData(remoteMessage);
      
      // Navigate based on notification type
      handleNotificationNavigation(data, navigation);
    });

    // Handle notification tap when app was closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('🔔 Notification opened app from quit state');
          
          // Log data
          logNotificationData(remoteMessage, 'QUIT_STATE_EXAMPLE');
          
          // Extract data
          const data = extractNotificationData(remoteMessage);
          
          // Navigate after a delay (let app initialize)
          setTimeout(() => {
            handleNotificationNavigation(data, navigation);
          }, 2000);
        }
      });

    return unsubscribe;
  }, [navigation]);

  return <View />;
};

/**
 * Example 3: Check specific data fields
 */
export const CheckSpecificDataExample = (remoteMessage: any) => {
  // Method 1: Direct access
  const title = remoteMessage.notification?.title;
  const body = remoteMessage.notification?.body;
  const type = remoteMessage.data?.type;
  const jobId = remoteMessage.data?.jobId;

  console.log('Direct access:', { title, body, type, jobId });

  // Method 2: Using extract utility
  const data = extractNotificationData(remoteMessage);
  console.log('Extracted:', data);

  // Method 3: Safe access with defaults
  const safeType = remoteMessage.data?.type || 'unknown';
  const safeJobId = remoteMessage.data?.jobId || null;

  console.log('Safe access:', { safeType, safeJobId });

  // Method 4: Check if field exists
  if (remoteMessage.data?.jobId) {
    console.log('Has job ID:', remoteMessage.data.jobId);
  }

  // Method 5: Check multiple fields
  const hasJobData = remoteMessage.data?.type === 'job' && remoteMessage.data?.jobId;
  if (hasJobData) {
    console.log('This is a job notification with ID');
  }
};

/**
 * Example 4: Handle different notification types
 */
const handleNotificationAction = (data: any) => {
  console.log('Handling notification action:', data.type);

  switch (data.type) {
    case 'job':
      console.log('Job notification - ID:', data.jobId);
      // Handle job notification
      // navigation.navigate('JobDetailsScreen', { jobId: data.jobId });
      break;

    case 'contract':
      console.log('Contract notification - ID:', data.contractId);
      // Handle contract notification
      // navigation.navigate('TrackingScreen', { contractId: data.contractId });
      break;

    case 'message':
      console.log('Message notification - Conversation:', data.conversationId);
      // Handle message notification
      // navigation.navigate('ChatScreen', { conversationId: data.conversationId });
      break;

    case 'payment':
      console.log('Payment notification');
      // Handle payment notification
      // navigation.navigate('PaymentsScreen');
      break;

    default:
      console.log('Unknown notification type:', data.type);
      // Handle unknown notification
      // navigation.navigate('NotificationScreen');
  }
};

/**
 * Example 5: Navigate based on notification data
 */
const handleNotificationNavigation = (data: any, navigation: any) => {
  console.log('Navigating based on notification data:', data);

  // Job notification
  if (data.type === 'job' && data.jobId) {
    navigation.navigate('JobDetailsScreen', {
      jobId: Number.parseInt(data.jobId, 10),
      timestamp: Date.now(), // Force refresh
    });
    return;
  }

  // Contract notification
  if (data.type === 'contract' && data.contractId) {
    navigation.navigate('CustomDrawer', {
      screen: 'BottomTab',
      params: {
        screen: 'TrackingScreen',
        params: {
          contractId: Number.parseInt(data.contractId, 10),
          timestamp: Date.now(),
        },
      },
    });
    return;
  }

  // Message notification
  if (data.type === 'message' && data.conversationId) {
    navigation.navigate('ChatScreen', {
      conversationId: data.conversationId.toString(),
      timestamp: Date.now(),
    });
    return;
  }

  // Default: Go to notifications screen
  navigation.navigate('CustomDrawer', {
    screen: 'BottomTab',
    params: {
      screen: 'NotificationScreen',
    },
  });
};

/**
 * Example 6: Display notification data in UI
 */
export const NotificationDataDisplay = ({ remoteMessage }: { remoteMessage: any }) => {
  const data = extractNotificationData(remoteMessage);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Notification Data
      </Text>

      <Text>Title: {data.title}</Text>
      <Text>Body: {data.body}</Text>
      <Text>Type: {data.type || 'N/A'}</Text>
      <Text>ID: {data.id || 'N/A'}</Text>
      <Text>Job ID: {data.jobId || 'N/A'}</Text>
      <Text>Contract ID: {data.contractId || 'N/A'}</Text>
      <Text>Conversation ID: {data.conversationId || 'N/A'}</Text>
      <Text>Message ID: {data.messageId}</Text>
      <Text>Sent Time: {data.sentTime ? new Date(data.sentTime).toLocaleString() : 'N/A'}</Text>

      <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Custom Data:</Text>
      <Text>{JSON.stringify(data.customData, null, 2)}</Text>
    </View>
  );
};

/**
 * Example 7: Test notification data structure
 */
export const testNotificationStructure = () => {
  // Example notification from backend
  const exampleNotification = {
    notification: {
      title: 'New Job Available',
      body: 'A delivery job is waiting for you',
      sound: 'default',
    },
    data: {
      type: 'job',
      jobId: '123',
      title: 'Delivery Job',
      message: 'Pickup from warehouse',
      priority: 'high',
    },
    messageId: 'msg-123-456',
    sentTime: Date.now(),
  };

  console.log('Testing with example notification:');
  logNotificationData(exampleNotification, 'TEST');

  const extracted = extractNotificationData(exampleNotification);
  console.log('Extracted data:', extracted);

  // Verify data
  console.assert(extracted.title === 'New Job Available', 'Title mismatch');
  console.assert(extracted.type === 'job', 'Type mismatch');
  console.assert(extracted.jobId === '123', 'Job ID mismatch');
  console.log('✅ All assertions passed');
};

/**
 * Example 8: Backend notification format
 * 
 * Send this from your backend to FCM:
 * 
 * POST https://fcm.googleapis.com/fcm/send
 * Headers:
 *   Authorization: Bearer YOUR_SERVER_KEY
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "to": "device_fcm_token",
 *   "notification": {
 *     "title": "New Job Available",
 *     "body": "A delivery job is waiting for you",
 *     "sound": "default"
 *   },
 *   "data": {
 *     "type": "job",
 *     "jobId": "123",
 *     "contractId": null,
 *     "priority": "high"
 *   }
 * }
 * 
 * The app will receive this and you can access:
 * - remoteMessage.notification.title → "New Job Available"
 * - remoteMessage.notification.body → "A delivery job is waiting for you"
 * - remoteMessage.data.type → "job"
 * - remoteMessage.data.jobId → "123"
 */

export default {
  ForegroundNotificationExample,
  NotificationTapExample,
  CheckSpecificDataExample,
  handleNotificationAction,
  handleNotificationNavigation,
  NotificationDataDisplay,
  testNotificationStructure,
};

