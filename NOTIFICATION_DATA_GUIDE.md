# How to Check Notification Message Data

## ✅ What I Added

### 1. Notification Logger Utility
**File:** `app/utils/notification-logger.tsx`

Provides detailed logging of notification data with a nice formatted output.

### 2. Updated Notification Service
**File:** `app/service/notification-service.tsx`

Now automatically logs all notification data when received.

---

## 📱 Notification Data Structure

### Firebase Cloud Messaging (FCM) Notification Object:

```typescript
{
  // Visual notification (shows in system tray)
  notification: {
    title: "New Job Available",
    body: "A new delivery job is waiting for you",
    imageUrl: "https://...",  // Optional
    sound: "default",
    
    // iOS specific
    ios: {
      badge: "1",
      sound: "default.caf"
    },
    
    // Android specific
    android: {
      channelId: "default",
      priority: "high",
      sound: "default"
    }
  },
  
  // Custom data (your application data)
  data: {
    type: "job",           // Your custom type
    jobId: "123",          // Your custom ID
    title: "Delivery",     // Optional title in data
    message: "Details...", // Optional message
    // ... any other custom fields
  },
  
  // Message metadata
  messageId: "xxx",
  from: "your-firebase-project-id",
  sentTime: 1234567890,
  ttl: 86400
}
```

---

## 🔍 How to Check Notification Data

### Method 1: Automatic Logging (Already Setup!)

Just receive a notification and check the console. You'll see:

```
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - FOREGROUND                    ║
╚═══════════════════════════════════════════════════════╝

📱 NOTIFICATION (Visual):
  Title: New Job Available
  Body: A delivery job is waiting for you
  Image: N/A
  Sound: default

📦 DATA (Custom Payload):
  Raw Data: {
    "type": "job",
    "jobId": "123",
    "title": "Delivery Job"
  }
  Type: job
  ID: 123

🔑 MESSAGE INFO:
  Message ID: xxx-xxx-xxx
  From: your-project-id
  Sent Time: 11/22/2024, 3:30 PM

📋 FULL MESSAGE OBJECT:
{...}
```

### Method 2: Use Logger Utility in Your Code

```typescript
import { logNotificationData, extractNotificationData } from '@app/utils/notification-logger';

// When you receive notification data
const handleNotification = (remoteMessage) => {
  // Log detailed data
  logNotificationData(remoteMessage, 'MY_HANDLER');
  
  // Extract structured data
  const data = extractNotificationData(remoteMessage);
  console.log('Title:', data.title);
  console.log('Type:', data.type);
  console.log('Job ID:', data.jobId);
  console.log('All custom data:', data.customData);
};
```

### Method 3: Access Specific Fields

```typescript
import NotificationLogger from '@app/utils/notification-logger';

// Check if field exists
if (NotificationLogger.hasData(remoteMessage, 'jobId')) {
  console.log('Has job ID!');
}

// Get specific field
const jobId = NotificationLogger.getData(remoteMessage, 'jobId');
const type = NotificationLogger.getData(remoteMessage, 'type', 'unknown'); // with default
```

---

## 📤 Backend Notification Format

### To send notification from your backend:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_FCM_TOKEN",
    "notification": {
      "title": "New Job Available",
      "body": "A delivery job is waiting for you",
      "sound": "default"
    },
    "data": {
      "type": "job",
      "jobId": "123",
      "contractId": null,
      "customField": "customValue"
    }
  }'
```

### Or send data-only (no visual notification):

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_FCM_TOKEN",
    "data": {
      "type": "job",
      "jobId": "123",
      "title": "New Job",
      "body": "Details here"
    }
  }'
```

**Note:** Data-only messages won't show a visual notification, but will be received by your app handlers.

---

## 🎯 Common Use Cases

### 1. Navigate to Specific Screen Based on Data

```typescript
const handleNotificationTap = (remoteMessage) => {
  const data = extractNotificationData(remoteMessage);
  
  if (data.type === 'job' && data.jobId) {
    // Navigate to job details
    navigation.navigate('JobDetailsScreen', { jobId: data.jobId });
  }
  else if (data.type === 'message' && data.conversationId) {
    // Navigate to chat
    navigation.navigate('ChatScreen', { conversationId: data.conversationId });
  }
};
```

### 2. Update Local State from Notification

```typescript
const handleNotification = (remoteMessage) => {
  const data = extractNotificationData(remoteMessage);
  
  if (data.type === 'job_update') {
    // Refresh jobs list
    dispatch(fetchJobs());
  }
  
  if (data.type === 'new_message') {
    // Update message count
    dispatch(incrementUnreadCount(data.conversationId));
  }
};
```

### 3. Show Custom Alert

```typescript
const handleNotification = (remoteMessage) => {
  const data = extractNotificationData(remoteMessage);
  
  Alert.alert(
    data.title,
    data.body,
    [
      { text: 'Dismiss', style: 'cancel' },
      { 
        text: 'View', 
        onPress: () => {
          // Handle navigation
          if (data.jobId) {
            navigation.navigate('JobDetailsScreen', { jobId: data.jobId });
          }
        }
      }
    ]
  );
};
```

---

## 🧪 Testing Notification Data

### Test from Firebase Console:

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Fill in:
   - **Notification title:** "Test Title"
   - **Notification text:** "Test body"
4. Click "Additional options"
5. Add custom data:
   - Key: `type`, Value: `test`
   - Key: `jobId`, Value: `123`
6. Select your app
7. Send

### Check Console Output:

You should see the detailed log with all your data!

---

## 📊 Where Notifications Are Logged

### 1. **Foreground** (App is open)
When app is open and notification received:
```
📬 Foreground Notification Received
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - FOREGROUND                    ║
╚═══════════════════════════════════════════════════════╝
...
```

### 2. **Background Tap** (App in background, user taps notification)
```
🔔 Notification tapped (from background)
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - BACKGROUND TAP                ║
╚═══════════════════════════════════════════════════════╝
...
```

### 3. **Killed State Tap** (App closed, user taps notification)
```
🔔 Notification tapped (from killed state)
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - KILLED STATE TAP              ║
╚═══════════════════════════════════════════════════════╝
...
```

### 4. **Background** (App in background, notification received)
```
📬 Background Notification Received
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - BACKGROUND                    ║
╚═══════════════════════════════════════════════════════╝
...
```

---

## 💡 Pro Tips

### 1. Structure Your Notification Data

Always include a `type` field to identify notification type:

```json
{
  "data": {
    "type": "job_update",        // ← Always include
    "id": "123",                  // ← Generic ID
    "jobId": "123",              // ← Specific IDs
    "action": "status_change",   // ← Optional action
    "status": "completed"        // ← Additional data
  }
}
```

### 2. Keep Notification and Data in Sync

```json
{
  "notification": {
    "title": "New Job",
    "body": "Delivery to 123 Main St"
  },
  "data": {
    "type": "job",
    "jobId": "456",
    "title": "New Job",           // ← Same as notification.title
    "body": "Delivery to 123..."  // ← Same as notification.body
  }
}
```

This ensures data-only messages can still show content.

### 3. Use Consistent Field Names

```json
// Good: Consistent across all notifications
{
  "data": {
    "type": "job",
    "id": "123",
    "title": "Title",
    "body": "Body"
  }
}

// Bad: Inconsistent field names
{
  "data": {
    "notificationType": "job",  // ← Inconsistent
    "jobIdentifier": "123",     // ← Inconsistent
    "heading": "Title"          // ← Inconsistent
  }
}
```

---

## 🐛 Troubleshooting

### "No notification data logged"

**Check:**
1. Is app receiving notifications? (Test from Firebase Console)
2. Check console filters (search for "📬" or "NOTIFICATION")
3. Check if notification-service initialized (`NotificationService.initialize()`)

### "Data is null or undefined"

**Check:**
1. Backend is sending `data` field
2. Data is not nested under `notification`
3. Check full message object in logs

### "Can't access custom fields"

**Use:**
```typescript
// ✅ Correct
const jobId = remoteMessage.data?.jobId;

// ❌ Wrong
const jobId = remoteMessage.jobId;  // Won't work
```

Custom data is always under `remoteMessage.data`.

---

## 📝 Quick Reference

```typescript
// Import logger
import { logNotificationData, extractNotificationData } from '@app/utils/notification-logger';

// Log full details
logNotificationData(remoteMessage, 'MY_SOURCE');

// Extract structured data
const data = extractNotificationData(remoteMessage);
// Returns: { title, body, image, type, id, jobId, contractId, conversationId, customData, messageId, sentTime }

// Access fields manually
const title = remoteMessage.notification?.title;
const body = remoteMessage.notification?.body;
const type = remoteMessage.data?.type;
const jobId = remoteMessage.data?.jobId;
const allCustomData = remoteMessage.data;
```

---

## 🎉 Summary

**Now when you receive notifications:**
1. ✅ Detailed logs automatically show in console
2. ✅ All data is formatted and easy to read
3. ✅ Can extract specific fields easily
4. ✅ Can use logger utility anywhere in your code

**Just run your app and send a test notification!** You'll see all the data in the console. 📱📊

