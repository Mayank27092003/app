# Message Notifications - Navigation Guide

## 📨 Two Types of Message Notifications

### 1. **New Message** (`new_message`)
Navigates to **Messages Tab** (conversation list)

### 2. **Specific Message** (`message`)
Navigates to **Specific Chat Screen** (conversation with a specific user)

---

## 🎯 How It Works

### Type 1: `new_message` - General Message Notification

**Use Case:** When you want to notify user they have new messages, but don't want to open a specific conversation.

**Backend Payload:**
```json
{
  "notification": {
    "title": "New Messages",
    "body": "You have 3 new messages"
  },
  "data": {
    "type": "new_message"
  }
}
```

**Result:** 
- User taps notification
- ✅ Opens **Messages Tab** (conversation list)
- User can see all conversations and choose which one to open

**Console Log:**
```
🔔 New message notification - Navigating to Messages tab
```

---

### Type 2: `message` - Specific Conversation

**Use Case:** When you want to open a specific conversation directly.

**Backend Payload:**
```json
{
  "notification": {
    "title": "John Doe",
    "body": "Hey, are you available for the job?"
  },
  "data": {
    "type": "message",
    "conversationId": "conv_123"
  }
}
```

**Result:**
- User taps notification
- ✅ Opens **Specific Chat Screen** with John Doe
- User is directly in the conversation

**Console Log:**
```
🔔 Navigating to Chat screen with conversationId: conv_123
```

---

## 📤 Backend Integration

### Send New Message Notification (Navigate to Messages Tab):

```javascript
// Node.js example
const admin = require('firebase-admin');

async function sendNewMessageNotification(userToken, messageCount) {
  const message = {
    token: userToken,
    notification: {
      title: 'New Messages',
      body: messageCount === 1 
        ? 'You have a new message' 
        : `You have ${messageCount} new messages`,
      sound: 'default'
    },
    data: {
      type: 'new_message',
      count: messageCount.toString()
    }
  };

  await admin.messaging().send(message);
}

// Usage
await sendNewMessageNotification('user_fcm_token', 3);
```

### Send Specific Message Notification (Navigate to Chat):

```javascript
async function sendSpecificMessageNotification(
  userToken, 
  senderName, 
  messageText, 
  conversationId
) {
  const message = {
    token: userToken,
    notification: {
      title: senderName,
      body: messageText,
      sound: 'default'
    },
    data: {
      type: 'message',
      conversationId: conversationId,
      senderId: 'user_123', // Optional
      senderName: senderName // Optional
    }
  };

  await admin.messaging().send(message);
}

// Usage
await sendSpecificMessageNotification(
  'user_fcm_token',
  'John Doe',
  'Hey, are you available?',
  'conv_123'
);
```

---

## 🎨 Notification Examples

### Example 1: Multiple New Messages

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "New Messages",
    "body": "You have 5 new messages"
  },
  "data": {
    "type": "new_message",
    "count": "5"
  }
}
```

**Result:** Opens Messages tab showing all conversations

---

### Example 2: Message from Specific User

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "Sarah Johnson",
    "body": "The delivery is complete!"
  },
  "data": {
    "type": "message",
    "conversationId": "conv_456",
    "senderId": "user_789",
    "senderName": "Sarah Johnson"
  }
}
```

**Result:** Opens specific chat with Sarah Johnson

---

### Example 3: Group Chat Message

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "Job #123 Discussion",
    "body": "Mike: When can you pick up?"
  },
  "data": {
    "type": "message",
    "conversationId": "conv_group_123",
    "chatId": "conv_group_123",
    "isGroup": "true",
    "groupName": "Job #123 Discussion"
  }
}
```

**Result:** Opens group chat for Job #123

---

## 🧪 Testing

### Test New Message Notification:

1. Go to Firebase Console → Cloud Messaging
2. Send test message:
   - **Title:** "New Messages"
   - **Body:** "You have 3 new messages"
   - **Custom data:**
     - Key: `type`, Value: `new_message`
     - Key: `count`, Value: `3`
3. Send to your device
4. **Tap notification** → Should open Messages tab! ✅

### Test Specific Message Notification:

1. Go to Firebase Console → Cloud Messaging
2. Send test message:
   - **Title:** "John Doe"
   - **Body:** "Hey, are you available?"
   - **Custom data:**
     - Key: `type`, Value: `message`
     - Key: `conversationId`, Value: `conv_123`
3. Send to your device
4. **Tap notification** → Should open chat with conversation ID! ✅

---

## 📊 Comparison

| Notification Type | Navigation Target | Use Case |
|-------------------|------------------|----------|
| `new_message` | **Messages Tab** (list) | Multiple unread messages, general notification |
| `message` | **Specific Chat** | Direct message from someone, quick reply needed |

---

## 💡 Best Practices

### When to use `new_message`:

✅ User has multiple unread messages  
✅ Periodic "You have X unread messages" reminders  
✅ Don't want to force user into specific conversation  
✅ Let user choose which conversation to open  

**Example Scenarios:**
- "You have 5 unread messages"
- "New messages from 3 contacts"
- Daily digest notification

### When to use `message`:

✅ Real-time message from a specific person  
✅ Important/urgent message that needs immediate attention  
✅ Want to take user directly to the conversation  
✅ Message is part of ongoing conversation  

**Example Scenarios:**
- "John: Hey, where are you?"
- "Sarah: The pickup is ready"
- "Driver: I've arrived at location"

---

## 🔧 Advanced Usage

### Navigate to Messages Tab with Filter:

```json
{
  "data": {
    "type": "new_message",
    "filter": "unread",
    "count": "3"
  }
}
```

Then in your Messages screen:
```typescript
const route = useRoute();
const params = route.params || {};

useEffect(() => {
  if (params.filter === 'unread') {
    // Show only unread conversations
    setFilter('unread');
  }
}, [params.filter]);
```

### Navigate with Highlight:

```json
{
  "data": {
    "type": "new_message",
    "highlightConversationId": "conv_123"
  }
}
```

Then in Messages screen:
```typescript
useEffect(() => {
  if (params.highlightConversationId) {
    // Scroll to and highlight specific conversation
    scrollToConversation(params.highlightConversationId);
  }
}, [params.highlightConversationId]);
```

---

## 📱 Console Logs

### For `new_message`:
```
📬 Notification received
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - FOREGROUND                    ║
╚═══════════════════════════════════════════════════════╝

📦 DATA:
  Type: new_message
  Count: 3

🔔 New message notification - Navigating to Messages tab
```

### For `message`:
```
📬 Notification received
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - FOREGROUND                    ║
╚═══════════════════════════════════════════════════════╝

📦 DATA:
  Type: message
  Conversation ID: conv_123

🔔 Navigating to Chat screen with conversationId: conv_123
```

---

## 📝 Summary

**Two notification types for messages:**

1. **`new_message`** → Opens Messages Tab (list)
   - Use for general message notifications
   - User sees all conversations
   - User chooses which to open

2. **`message`** → Opens Specific Chat
   - Use for real-time messages
   - Opens directly to conversation
   - Faster access to specific chat

**Both are now fully implemented and working!** 🎉

---

## 🚀 Quick Reference

```bash
# New message notification (opens Messages tab)
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "New Messages",
      "body": "You have 3 new messages"
    },
    "data": {
      "type": "new_message",
      "count": "3"
    }
  }'

# Specific message notification (opens chat)
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "John Doe",
      "body": "Hey, are you available?"
    },
    "data": {
      "type": "message",
      "conversationId": "conv_123"
    }
  }'
```

**That's it! Test both types and see the difference.** 📨✨

