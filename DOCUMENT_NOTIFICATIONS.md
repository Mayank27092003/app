# Document Verification Notifications

## ✅ Feature Added

When users receive document verification notifications (`document_verified` or `document_rejected`), the app now automatically navigates to the **Profile tab**.

---

## 📱 Notification Structure

### Example Notification Payload:

```json
{
  "notification": {
    "title": "Document Verified",
    "body": "Your Social Security Number has been verified successfully"
  },
  "data": {
    "type": "document_verified",
    "entityType": "document",
    "entityId": "96",
    "notificationId": "53"
  }
}
```

### Fields Explained:

- **`type`**: Notification type (`document_verified` or `document_rejected`)
- **`entityType`**: Always `"document"` for document notifications
- **`entityId`**: The ID of the document that was verified/rejected
- **`notificationId`**: The notification ID for tracking

---

## 🎯 How It Works

### 1. User Receives Notification

When backend sends a notification with `type: "document_verified"` or `type: "document_rejected"`:

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "Document Verified",
    "body": "Your Social Security Number has been verified successfully"
  },
  "data": {
    "type": "document_verified",
    "entityType": "document",
    "entityId": "96",
    "notificationId": "53"
  }
}
```

### 2. User Taps Notification

The app detects the notification type and automatically navigates to Profile tab:

```typescript
// In notification-service.tsx
if (data.type === 'document_verified' || data.type === 'document_rejected') {
  console.log('🔔 Document notification - Navigating to Profile tab');
  
  NavigationService.navigate('CustomDrawer', {
    screen: 'BottomTab',
    params: {
      screen: 'ProfileScreen',
      params: {
        timestamp: Date.now(),
        documentId: data.entityId,
        notificationType: data.type,
      },
    },
  });
}
```

### 3. Profile Screen Opens

The Profile screen receives:
- **`documentId`**: The document ID (e.g., `"96"`)
- **`notificationType`**: The notification type (`"document_verified"` or `"document_rejected"`)
- **`timestamp`**: Forces screen refresh

You can use these params to:
- Highlight the verified/rejected document
- Show a success/error message
- Scroll to the document section
- Refresh document list

---

## 📤 Backend Integration

### Send Document Verified Notification:

```javascript
// Node.js example
const admin = require('firebase-admin');

async function sendDocumentVerifiedNotification(userToken, documentId, documentName) {
  const message = {
    token: userToken,
    notification: {
      title: 'Document Verified',
      body: `Your ${documentName} has been verified successfully`,
      sound: 'default'
    },
    data: {
      type: 'document_verified',
      entityType: 'document',
      entityId: documentId.toString(),
      notificationId: Date.now().toString()
    }
  };

  await admin.messaging().send(message);
}
```

### Send Document Rejected Notification:

```javascript
async function sendDocumentRejectedNotification(userToken, documentId, documentName, reason) {
  const message = {
    token: userToken,
    notification: {
      title: 'Document Rejected',
      body: `Your ${documentName} was rejected: ${reason}`,
      sound: 'default'
    },
    data: {
      type: 'document_rejected',
      entityType: 'document',
      entityId: documentId.toString(),
      notificationId: Date.now().toString(),
      reason: reason // Optional: rejection reason
    }
  };

  await admin.messaging().send(message);
}
```

---

## 💡 Usage in Profile Screen

### Access Notification Data:

```typescript
// In ProfileScreen.tsx
import { useRoute } from '@react-navigation/native';

export const ProfileScreen = () => {
  const route = useRoute();
  const params = route.params || {};
  
  useEffect(() => {
    // Check if opened from document notification
    if (params.notificationType) {
      const { documentId, notificationType } = params;
      
      if (notificationType === 'document_verified') {
        // Show success message
        showMessage({
          message: 'Document Verified',
          description: 'Your document has been verified successfully',
          type: 'success',
        });
        
        // Highlight the document or scroll to it
        highlightDocument(documentId);
      }
      else if (notificationType === 'document_rejected') {
        // Show error message
        showMessage({
          message: 'Document Rejected',
          description: 'Please review and resubmit your document',
          type: 'danger',
        });
        
        // Scroll to document section
        scrollToDocuments();
      }
    }
  }, [params]);
  
  // ... rest of your component
};
```

### Refresh Documents:

```typescript
useEffect(() => {
  if (params.timestamp) {
    // Force refresh when opened from notification
    refreshDocuments();
  }
}, [params.timestamp]);
```

---

## 🧪 Testing

### Test from Firebase Console:

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Fill in:
   - **Title**: "Document Verified"
   - **Body**: "Your Social Security Number has been verified"
4. Click "Additional options"
5. Add custom data:
   - Key: `type`, Value: `document_verified`
   - Key: `entityType`, Value: `document`
   - Key: `entityId`, Value: `96`
   - Key: `notificationId`, Value: `53`
6. Send to your device
7. Tap notification → Should navigate to Profile tab!

### Check Console Logs:

When notification is tapped, you'll see:

```
🔔 Notification tapped
╔═══════════════════════════════════════════════════════╗
║  📬 NOTIFICATION DATA - BACKGROUND TAP                ║
╚═══════════════════════════════════════════════════════╝

📱 NOTIFICATION (Visual):
  Title: Document Verified
  Body: Your Social Security Number has been verified successfully

📦 DATA (Custom Payload):
  Type: document_verified
  Entity Type: document
  Entity ID: 96
  Notification ID: 53

🔔 Document notification - Navigating to Profile tab
🔔 Document details: {
  type: 'document_verified',
  entityType: 'document',
  entityId: '96',
  notificationId: '53'
}
```

---

## 📊 Notification Types Handled

| Type | Action | Screen |
|------|--------|--------|
| `document_verified` | Navigate to Profile | Profile Tab |
| `document_rejected` | Navigate to Profile | Profile Tab |
| `job` | Navigate to Job Details | Job Details |
| `contract` | Navigate to Tracking | Tracking Tab |
| `message` | Navigate to Chat | Chat Screen |
| `notification` | Navigate to Notifications | Notifications Tab |

---

## 🎨 UI Recommendations

### Show Badge on Profile Tab:

```typescript
// In your tab navigator
<Tab.Screen
  name="ProfileScreen"
  component={ProfileScreen}
  options={{
    tabBarBadge: hasUnverifiedDocuments ? '!' : undefined,
  }}
/>
```

### Highlight Document in Profile:

```typescript
// In ProfileScreen
const highlightDocument = (documentId: string) => {
  // Scroll to documents section
  scrollViewRef.current?.scrollTo({ y: documentsY, animated: true });
  
  // Highlight the specific document
  setHighlightedDocumentId(documentId);
  
  // Remove highlight after 3 seconds
  setTimeout(() => setHighlightedDocumentId(null), 3000);
};
```

### Show Status Message:

```typescript
// Show different messages based on notification type
if (notificationType === 'document_verified') {
  showMessage({
    message: '✅ Document Verified',
    description: 'Your document has been approved',
    type: 'success',
    duration: 5000,
  });
}
else if (notificationType === 'document_rejected') {
  showMessage({
    message: '❌ Document Rejected',
    description: 'Please review the rejection reason and resubmit',
    type: 'danger',
    duration: 5000,
  });
}
```

---

## 🔧 Customization

### Add More Document Types:

If you want to handle more document notification types, just add them:

```typescript
// In notification-service.tsx
if (
  data.type === 'document_verified' || 
  data.type === 'document_rejected' ||
  data.type === 'document_pending' ||
  data.type === 'document_expired'
) {
  // Navigate to profile
}
```

### Navigate to Specific Document:

If you want to navigate directly to a document details screen:

```typescript
if (data.type === 'document_verified' || data.type === 'document_rejected') {
  NavigationService.navigate('DocumentDetailsScreen', {
    documentId: data.entityId,
    status: data.type === 'document_verified' ? 'verified' : 'rejected',
  });
}
```

---

## 📝 Summary

**What's Changed:**
1. ✅ Added handling for `document_verified` and `document_rejected` notification types
2. ✅ Automatically navigates to Profile tab when these notifications are tapped
3. ✅ Passes document ID and notification type to Profile screen
4. ✅ Enhanced logging to show document notification details

**Backend Needs to Send:**
```json
{
  "data": {
    "type": "document_verified",  // or "document_rejected"
    "entityType": "document",
    "entityId": "96",
    "notificationId": "53"
  }
}
```

**Result:**
User taps notification → App opens Profile tab → Can show success/error message and highlight document

**That's it!** Document verification notifications are now fully handled. 🎉

