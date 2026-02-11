/**
 * Notification Message Data Logger
 * Use this to inspect notification data structure
 * @format
 */

/**
 * Log notification message with detailed structure
 */
export const logNotificationData = (remoteMessage: any, source: string = 'Unknown') => {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║  📬 NOTIFICATION DATA - ${source.toUpperCase().padEnd(24)}  ║`);
  console.log('╚═══════════════════════════════════════════════════════╝');
  
  if (!remoteMessage) {
    console.log('❌ No notification message data');
    return;
  }

  // 1. Notification Object (Title, Body)
  console.log('\n📱 NOTIFICATION (Visual):');
  if (remoteMessage.notification) {
    console.log('  Title:', remoteMessage.notification.title || 'N/A');
    console.log('  Body:', remoteMessage.notification.body || 'N/A');
    console.log('  Image:', remoteMessage.notification.imageUrl || remoteMessage.notification.image || 'N/A');
    console.log('  Sound:', remoteMessage.notification.sound || 'default');
    
    // iOS specific
    if (remoteMessage.notification.ios) {
      console.log('  iOS Badge:', remoteMessage.notification.ios.badge || 'N/A');
      console.log('  iOS Sound:', remoteMessage.notification.ios.sound || 'N/A');
    }
    
    // Android specific
    if (remoteMessage.notification.android) {
      console.log('  Android Channel:', remoteMessage.notification.android.channelId || 'N/A');
      console.log('  Android Priority:', remoteMessage.notification.android.priority || 'N/A');
    }
  } else {
    console.log('  ❌ No notification object (data-only message)');
  }

  // 2. Data Object (Custom Data)
  console.log('\n📦 DATA (Custom Payload):');
  if (remoteMessage.data) {
    console.log('  Raw Data:', JSON.stringify(remoteMessage.data, null, 2));
    
    // Common fields
    if (remoteMessage.data.type) {
      console.log('  Type:', remoteMessage.data.type);
    }
    if (remoteMessage.data.id || remoteMessage.data.jobId || remoteMessage.data.contractId) {
      console.log('  ID:', remoteMessage.data.id || remoteMessage.data.jobId || remoteMessage.data.contractId);
    }
    if (remoteMessage.data.title) {
      console.log('  Data Title:', remoteMessage.data.title);
    }
    if (remoteMessage.data.body || remoteMessage.data.message) {
      console.log('  Data Body:', remoteMessage.data.body || remoteMessage.data.message);
    }
    
    // Document specific fields
    if (remoteMessage.data.entityType) {
      console.log('  Entity Type:', remoteMessage.data.entityType);
    }
    if (remoteMessage.data.entityId) {
      console.log('  Entity ID:', remoteMessage.data.entityId);
    }
    if (remoteMessage.data.notificationId) {
      console.log('  Notification ID:', remoteMessage.data.notificationId);
    }
  } else {
    console.log('  ❌ No data object');
  }

  // 3. Message ID
  console.log('\n🔑 MESSAGE INFO:');
  console.log('  Message ID:', remoteMessage.messageId || 'N/A');
  console.log('  From:', remoteMessage.from || 'N/A');
  console.log('  Sent Time:', remoteMessage.sentTime ? new Date(remoteMessage.sentTime).toLocaleString() : 'N/A');
  console.log('  TTL:', remoteMessage.ttl || 'N/A');

  // 4. iOS Specific (APNs)
  if (remoteMessage.apns) {
    console.log('\n🍎 iOS APNs DATA:');
    console.log('  ', JSON.stringify(remoteMessage.apns, null, 2));
  }

  // 5. Android Specific (FCM)
  if (remoteMessage.fcmOptions) {
    console.log('\n🤖 ANDROID FCM OPTIONS:');
    console.log('  ', JSON.stringify(remoteMessage.fcmOptions, null, 2));
  }

  // 6. Full Message (for debugging)
  console.log('\n📋 FULL MESSAGE OBJECT:');
  console.log(JSON.stringify(remoteMessage, null, 2));
  
  console.log('\n═══════════════════════════════════════════════════════\n');
};

/**
 * Extract common data fields from notification
 */
export const extractNotificationData = (remoteMessage: any) => {
  if (!remoteMessage) return null;

  return {
    // Visual notification
    title: remoteMessage.notification?.title || remoteMessage.data?.title || '',
    body: remoteMessage.notification?.body || remoteMessage.data?.body || remoteMessage.data?.message || '',
    image: remoteMessage.notification?.imageUrl || remoteMessage.notification?.image || remoteMessage.data?.image || null,
    
    // Custom data
    type: remoteMessage.data?.type || null,
    id: remoteMessage.data?.id || remoteMessage.data?.jobId || remoteMessage.data?.contractId || remoteMessage.data?.conversationId || remoteMessage.data?.entityId || null,
    jobId: remoteMessage.data?.jobId || null,
    contractId: remoteMessage.data?.contractId || null,
    conversationId: remoteMessage.data?.conversationId || remoteMessage.data?.chatId || null,
    
    // Document specific fields
    entityType: remoteMessage.data?.entityType || null,
    entityId: remoteMessage.data?.entityId || null,
    notificationId: remoteMessage.data?.notificationId || null,
    
    // All custom data
    customData: remoteMessage.data || {},
    
    // Message info
    messageId: remoteMessage.messageId || null,
    sentTime: remoteMessage.sentTime || null,
  };
};

/**
 * Check if notification has specific data field
 */
export const hasNotificationData = (remoteMessage: any, field: string): boolean => {
  if (!remoteMessage) return false;
  return !!(remoteMessage.data && remoteMessage.data[field]);
};

/**
 * Get specific data field from notification
 */
export const getNotificationDataField = (remoteMessage: any, field: string, defaultValue: any = null): any => {
  if (!remoteMessage || !remoteMessage.data) return defaultValue;
  return remoteMessage.data[field] !== undefined ? remoteMessage.data[field] : defaultValue;
};

export default {
  log: logNotificationData,
  extract: extractNotificationData,
  hasData: hasNotificationData,
  getData: getNotificationDataField,
};

