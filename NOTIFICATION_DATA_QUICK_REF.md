# Notification Data - Quick Reference

## ✅ Setup Complete!

Your app now automatically logs all notification data when received.

---

## 📱 What You'll See in Console

When you receive a notification, console will show:

```
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - FOREGROUND                    ║
╚═══════════════════════════════════════════════════════╝

📱 NOTIFICATION (Visual):
  Title: New Job Available
  Body: A delivery job is waiting for you

📦 DATA (Custom Payload):
  Type: job
  ID: 123

🔑 MESSAGE INFO:
  Message ID: xxx-xxx-xxx
  From: your-project-id
```

---

## 🔍 How to Access Notification Data

### Quick Access:

```typescript
// Title and body (visual notification)
const title = remoteMessage.notification?.title;
const body = remoteMessage.notification?.body;

// Your custom data
const type = remoteMessage.data?.type;
const jobId = remoteMessage.data?.jobId;
const contractId = remoteMessage.data?.contractId;

// All custom fields
const allData = remoteMessage.data;
```

### Using Helper:

```typescript
import { extractNotificationData } from '@app/utils/notification-logger';

const data = extractNotificationData(remoteMessage);

// Access like this:
data.title          // "New Job Available"
data.body           // "A delivery job..."
data.type           // "job"
data.jobId          // "123"
data.contractId     // null
data.conversationId // null
data.customData     // { type: "job", jobId: "123", ... }
```

---

## 📤 Backend Format

Send from your backend like this:

```json
{
  "to": "DEVICE_FCM_TOKEN",
  "notification": {
    "title": "Title Here",
    "body": "Message here"
  },
  "data": {
    "type": "job",
    "jobId": "123",
    "anyCustomField": "anyValue"
  }
}
```

---

## 🎯 Common Patterns

### Navigate Based on Type:

```typescript
const data = extractNotificationData(remoteMessage);

if (data.type === 'job' && data.jobId) {
  navigation.navigate('JobDetailsScreen', { jobId: data.jobId });
}
else if (data.type === 'message' && data.conversationId) {
  navigation.navigate('ChatScreen', { conversationId: data.conversationId });
}
```

### Show Alert:

```typescript
Alert.alert(
  data.title,
  data.body,
  [
    { text: 'Dismiss' },
    { text: 'View', onPress: () => handleAction(data) }
  ]
);
```

---

## 🧪 Test It

### From Firebase Console:
1. Go to Firebase → Cloud Messaging → "Send test message"
2. Add custom data:
   - `type`: `test`
   - `jobId`: `123`
3. Send to your device
4. Check console for logs!

### From Your Code:
```typescript
import NotificationLogger from '@app/utils/notification-logger';

// Log any notification
NotificationLogger.log(remoteMessage, 'MY_TEST');

// Extract data
const data = NotificationLogger.extract(remoteMessage);
```

---

## 📚 Files Created

1. ✅ `app/utils/notification-logger.tsx` - Logger utility
2. ✅ `app/service/notification-service.tsx` - Updated with logging
3. ✅ `NOTIFICATION_DATA_GUIDE.md` - Complete guide
4. ✅ `app/examples/notification-data-usage.tsx` - Examples
5. ✅ `NOTIFICATION_DATA_QUICK_REF.md` - This file

---

## 🚀 Quick Start

**Just run your app and send a test notification!**

You'll immediately see all the notification data in your console with detailed formatting. No additional setup needed - it's automatic! 📱✨

