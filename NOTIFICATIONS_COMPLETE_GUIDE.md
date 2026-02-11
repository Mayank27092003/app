# Complete Notifications Guide - All Types

## 🎯 All Notification Types Implemented

Your app now handles **8 different notification types** with automatic navigation!

---

## 📋 Quick Reference Table

| Notification Type | Navigation Target | Description |
|-------------------|------------------|-------------|
| `user_verified` | **Profile Tab** | User account verified |
| `user_rejected` | **Profile Tab** | User account rejected |
| `document_verified` | **Profile Tab** | Document approved |
| `document_rejected` | **Profile Tab** | Document rejected |
| `new_message` | **Messages Tab** | New messages (list) |
| `message` | **Specific Chat** | Direct message |
| `job` | **Job Details** | Job update |
| `contract` | **Tracking Tab** | Contract/delivery |

---

## 📱 1. User Verification Notifications

### `user_verified` - Account Verified

**Payload:**
```json
{
  "notification": {
    "title": "Account Verified ✅",
    "body": "Your account has been verified successfully"
  },
  "data": {
    "type": "user_verified",
    "entityType": "user",
    "entityId": "123"
  }
}
```

**Result:** Opens Profile tab with success message

---

### `user_rejected` - Account Rejected

**Payload:**
```json
{
  "notification": {
    "title": "Verification Failed ❌",
    "body": "Your account verification was rejected"
  },
  "data": {
    "type": "user_rejected",
    "entityType": "user",
    "entityId": "123",
    "reason": "Incomplete documents"
  }
}
```

**Result:** Opens Profile tab with error message

---

## 📄 2. Document Verification Notifications

### `document_verified` - Document Approved

**Payload:**
```json
{
  "notification": {
    "title": "Document Verified",
    "body": "Your Social Security Number has been verified"
  },
  "data": {
    "type": "document_verified",
    "entityType": "document",
    "entityId": "96"
  }
}
```

**Result:** Opens Profile tab, can highlight specific document

---

### `document_rejected` - Document Rejected

**Payload:**
```json
{
  "notification": {
    "title": "Document Rejected",
    "body": "Your document was rejected"
  },
  "data": {
    "type": "document_rejected",
    "entityType": "document",
    "entityId": "96",
    "reason": "Image not clear"
  }
}
```

**Result:** Opens Profile tab, shows rejection reason

---

## 💬 3. Message Notifications

### `new_message` - General Message Notification

**Payload:**
```json
{
  "notification": {
    "title": "New Messages",
    "body": "You have 3 new messages"
  },
  "data": {
    "type": "new_message",
    "count": "3"
  }
}
```

**Result:** Opens Messages tab (conversation list)

---

### `message` - Specific Conversation

**Payload:**
```json
{
  "notification": {
    "title": "John Doe",
    "body": "Hey, are you available?"
  },
  "data": {
    "type": "message",
    "conversationId": "conv_123"
  }
}
```

**Result:** Opens specific chat with John Doe

---

## 💼 4. Job Notifications

### `job` - Job Update

**Payload:**
```json
{
  "notification": {
    "title": "New Job Available",
    "body": "A delivery job is waiting for you"
  },
  "data": {
    "type": "job",
    "jobId": "123"
  }
}
```

**Result:** Opens Job Details screen for job #123

---

## 🚚 5. Contract/Tracking Notifications

### `contract` - Delivery Update

**Payload:**
```json
{
  "notification": {
    "title": "Delivery Update",
    "body": "Your delivery is in progress"
  },
  "data": {
    "type": "contract",
    "contractId": "456"
  }
}
```

**Result:** Opens Tracking screen for contract #456

---

## 📤 Backend Integration Examples

### Node.js / Firebase Admin SDK

```javascript
const admin = require('firebase-admin');

// 1. User Verified
async function sendUserVerified(userToken, userId) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: 'Account Verified ✅',
      body: 'Your account has been verified successfully'
    },
    data: {
      type: 'user_verified',
      entityType: 'user',
      entityId: userId.toString()
    }
  });
}

// 2. User Rejected
async function sendUserRejected(userToken, userId, reason) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: 'Verification Failed ❌',
      body: `Your account verification was rejected: ${reason}`
    },
    data: {
      type: 'user_rejected',
      entityType: 'user',
      entityId: userId.toString(),
      reason: reason
    }
  });
}

// 3. Document Verified
async function sendDocumentVerified(userToken, documentId, docName) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: 'Document Verified',
      body: `Your ${docName} has been verified`
    },
    data: {
      type: 'document_verified',
      entityType: 'document',
      entityId: documentId.toString()
    }
  });
}

// 4. Document Rejected
async function sendDocumentRejected(userToken, documentId, reason) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: 'Document Rejected',
      body: `Your document was rejected: ${reason}`
    },
    data: {
      type: 'document_rejected',
      entityType: 'document',
      entityId: documentId.toString(),
      reason: reason
    }
  });
}

// 5. New Message (general)
async function sendNewMessageNotification(userToken, count) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: 'New Messages',
      body: `You have ${count} new messages`
    },
    data: {
      type: 'new_message',
      count: count.toString()
    }
  });
}

// 6. Specific Message
async function sendMessageNotification(userToken, senderName, message, conversationId) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: senderName,
      body: message
    },
    data: {
      type: 'message',
      conversationId: conversationId
    }
  });
}

// 7. Job Notification
async function sendJobNotification(userToken, jobId, jobTitle) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: 'New Job Available',
      body: jobTitle
    },
    data: {
      type: 'job',
      jobId: jobId.toString()
    }
  });
}

// 8. Contract/Tracking Notification
async function sendContractNotification(userToken, contractId, status) {
  await admin.messaging().send({
    token: userToken,
    notification: {
      title: 'Delivery Update',
      body: `Your delivery is ${status}`
    },
    data: {
      type: 'contract',
      contractId: contractId.toString()
    }
  });
}
```

---

## 🧪 Testing All Types

### From Firebase Console:

For each type, go to Firebase Console → Cloud Messaging → Send test message:

#### Test User Verified:
- Title: `Account Verified`
- Body: `Your account has been verified`
- Data: `type` = `user_verified`, `entityId` = `123`

#### Test User Rejected:
- Title: `Verification Failed`
- Body: `Your account verification was rejected`
- Data: `type` = `user_rejected`, `entityId` = `123`

#### Test Document Verified:
- Title: `Document Verified`
- Body: `Your document has been verified`
- Data: `type` = `document_verified`, `entityId` = `96`

#### Test Document Rejected:
- Title: `Document Rejected`
- Body: `Your document was rejected`
- Data: `type` = `document_rejected`, `entityId` = `96`

#### Test New Message:
- Title: `New Messages`
- Body: `You have 3 new messages`
- Data: `type` = `new_message`, `count` = `3`

#### Test Specific Message:
- Title: `John Doe`
- Body: `Hey, are you available?`
- Data: `type` = `message`, `conversationId` = `conv_123`

#### Test Job:
- Title: `New Job`
- Body: `A job is waiting`
- Data: `type` = `job`, `jobId` = `123`

#### Test Contract:
- Title: `Delivery Update`
- Body: `Your delivery is in progress`
- Data: `type` = `contract`, `contractId` = `456`

---

## 📊 Navigation Flow Chart

```
Notification Received
        ↓
User Taps Notification
        ↓
    Check Type
        ↓
┌───────────────────────────────┐
│                               │
│  user_verified         → Profile Tab
│  user_rejected         → Profile Tab
│  document_verified     → Profile Tab
│  document_rejected     → Profile Tab
│  new_message          → Messages Tab
│  message              → Specific Chat
│  job                  → Job Details
│  contract             → Tracking Screen
│                               │
└───────────────────────────────┘
```

---

## 💡 Best Practices

### 1. Always Include `type` Field

```json
{
  "data": {
    "type": "user_verified"  // ← Always required
  }
}
```

### 2. Use Consistent Field Names

```json
{
  "data": {
    "type": "document_verified",
    "entityType": "document",    // ← Consistent
    "entityId": "96",            // ← Consistent
    "notificationId": "53"       // ← Consistent
  }
}
```

### 3. Include Identifiers

Always include IDs for navigation:
- `jobId` for jobs
- `contractId` for contracts
- `conversationId` for messages
- `entityId` for documents/users

### 4. Add Optional Fields for Context

```json
{
  "data": {
    "type": "document_rejected",
    "entityId": "96",
    "reason": "Image not clear",        // ← Optional but helpful
    "canResubmit": "true",             // ← Optional
    "requiredDocuments": "id,license"  // ← Optional
  }
}
```

---

## 🎨 UI/UX Recommendations

### Profile Tab Notifications:
- Show success animation for `user_verified`
- Show error state for `user_rejected`
- Highlight specific document for `document_*`
- Scroll to relevant section

### Messages Tab Notifications:
- Show unread count badge
- Highlight new conversations
- Auto-scroll to top

### Job/Contract Notifications:
- Refresh data automatically
- Show loading state briefly
- Highlight updated information

---

## 📝 Console Logs

When notification is tapped, you'll see detailed logs:

```
🔔 Notification tapped
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - BACKGROUND TAP                ║
╚═══════════════════════════════════════════════════════╝

📱 NOTIFICATION:
  Title: Account Verified
  Body: Your account has been verified successfully

📦 DATA:
  Type: user_verified
  Entity Type: user
  Entity ID: 123

🔔 User verification notification - Navigating to Profile tab
```

---

## 🚀 Quick cURL Test Commands

```bash
# User Verified
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"TOKEN","notification":{"title":"Account Verified","body":"Success"},"data":{"type":"user_verified","entityId":"123"}}'

# Document Verified
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"TOKEN","notification":{"title":"Document Verified","body":"Success"},"data":{"type":"document_verified","entityId":"96"}}'

# New Message
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"TOKEN","notification":{"title":"New Messages","body":"You have 3 new messages"},"data":{"type":"new_message","count":"3"}}'

# Job
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"TOKEN","notification":{"title":"New Job","body":"Available"},"data":{"type":"job","jobId":"123"}}'
```

---

## ✅ Summary

**Total Types Implemented:** 8

**Profile Tab (4 types):**
- ✅ `user_verified`
- ✅ `user_rejected`
- ✅ `document_verified`
- ✅ `document_rejected`

**Messages (2 types):**
- ✅ `new_message` → Messages Tab
- ✅ `message` → Specific Chat

**Jobs/Tracking (2 types):**
- ✅ `job` → Job Details
- ✅ `contract` → Tracking

**All notifications automatically:**
- ✅ Log detailed data
- ✅ Navigate to correct screen
- ✅ Pass relevant parameters
- ✅ Handle tap from any app state

---

## 📚 Documentation Files

1. `NOTIFICATION_DATA_GUIDE.md` - How to check notification data
2. `MESSAGE_NOTIFICATIONS.md` - Message notification details
3. `DOCUMENT_NOTIFICATIONS.md` - Document verification details
4. `USER_VERIFICATION_NOTIFICATIONS.md` - User verification details
5. `NOTIFICATIONS_COMPLETE_GUIDE.md` - This file (complete reference)

---

**Your notification system is now complete and production-ready!** 🎉

Test each type and verify the navigation works correctly. All notifications will automatically log their data and navigate to the appropriate screen.

