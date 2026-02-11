# User Verification Notifications

## ✅ Feature Added

When users receive user verification notifications (`user_verified` or `user_rejected`), the app now automatically navigates to the **Profile tab**.

---

## 📱 Notification Structure

### Example: User Verified Notification

```json
{
  "notification": {
    "title": "Account Verified",
    "body": "Your account has been verified successfully"
  },
  "data": {
    "type": "user_verified",
    "entityType": "user",
    "entityId": "123",
    "notificationId": "54"
  }
}
```

### Example: User Rejected Notification

```json
{
  "notification": {
    "title": "Verification Failed",
    "body": "Your account verification was rejected. Please review and resubmit your information."
  },
  "data": {
    "type": "user_rejected",
    "entityType": "user",
    "entityId": "123",
    "notificationId": "55",
    "reason": "Incomplete documents"
  }
}
```

### Fields Explained:

- **`type`**: Notification type (`user_verified` or `user_rejected`)
- **`entityType`**: Always `"user"` for user verification notifications
- **`entityId`**: The user ID who was verified/rejected
- **`notificationId`**: The notification ID for tracking
- **`reason`**: (Optional) Rejection reason for `user_rejected`

---

## 🎯 How It Works

### 1. User Receives Notification

When backend sends a notification with `type: "user_verified"` or `type: "user_rejected"`:

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "Account Verified",
    "body": "Your account has been verified successfully"
  },
  "data": {
    "type": "user_verified",
    "entityType": "user",
    "entityId": "123",
    "notificationId": "54"
  }
}
```

### 2. User Taps Notification

The app detects the notification type and automatically navigates to Profile tab:

```typescript
// In notification-service.tsx
if (data.type === 'user_verified' || data.type === 'user_rejected') {
  console.log('🔔 User verification notification - Navigating to Profile tab');
  
  NavigationService.navigate('CustomDrawer', {
    screen: 'BottomTab',
    params: {
      screen: 'ProfileScreen',
      params: {
        timestamp: Date.now(),
        notificationType: data.type,
        verificationStatus: data.type === 'user_verified' ? 'verified' : 'rejected',
      },
    },
  });
}
```

### 3. Profile Screen Opens

The Profile screen receives:
- **`notificationType`**: The notification type (`"user_verified"` or `"user_rejected"`)
- **`verificationStatus`**: Either `"verified"` or `"rejected"`
- **`timestamp`**: Forces screen refresh

---

## 📤 Backend Integration

### Send User Verified Notification:

```javascript
// Node.js example
const admin = require('firebase-admin');

async function sendUserVerifiedNotification(userToken, userId, userName) {
  const message = {
    token: userToken,
    notification: {
      title: 'Account Verified ✅',
      body: `Congratulations ${userName}! Your account has been verified successfully.`,
      sound: 'default'
    },
    data: {
      type: 'user_verified',
      entityType: 'user',
      entityId: userId.toString(),
      notificationId: Date.now().toString()
    }
  };

  await admin.messaging().send(message);
}

// Usage
await sendUserVerifiedNotification('user_fcm_token', 123, 'John Doe');
```

### Send User Rejected Notification:

```javascript
async function sendUserRejectedNotification(userToken, userId, userName, reason) {
  const message = {
    token: userToken,
    notification: {
      title: 'Verification Failed ❌',
      body: `${userName}, your account verification was rejected: ${reason}`,
      sound: 'default'
    },
    data: {
      type: 'user_rejected',
      entityType: 'user',
      entityId: userId.toString(),
      notificationId: Date.now().toString(),
      reason: reason
    }
  };

  await admin.messaging().send(message);
}

// Usage
await sendUserRejectedNotification(
  'user_fcm_token', 
  123, 
  'John Doe',
  'Incomplete documents'
);
```

---

## 💡 Usage in Profile Screen

### Access Notification Data:

```typescript
// In ProfileScreen.tsx
import { useRoute } from '@react-navigation/native';
import { showMessage } from 'react-native-flash-message';

export const ProfileScreen = () => {
  const route = useRoute();
  const params = route.params || {};
  
  useEffect(() => {
    // Check if opened from user verification notification
    if (params.notificationType) {
      const { verificationStatus } = params;
      
      if (verificationStatus === 'verified') {
        // Show success message
        showMessage({
          message: '🎉 Account Verified!',
          description: 'Your account has been verified successfully. You now have full access to all features.',
          type: 'success',
          duration: 5000,
        });
        
        // Optionally show verification badge
        setShowVerificationBadge(true);
      }
      else if (verificationStatus === 'rejected') {
        // Show error message
        showMessage({
          message: '❌ Verification Failed',
          description: 'Your account verification was rejected. Please review your information and resubmit.',
          type: 'danger',
          duration: 5000,
        });
        
        // Optionally scroll to verification section
        scrollToVerificationSection();
      }
    }
  }, [params.notificationType, params.verificationStatus]);
  
  // ... rest of your component
};
```

### Display Verification Status:

```typescript
// Show verification badge in profile
{verificationStatus === 'verified' && (
  <View style={styles.verifiedBadge}>
    <Icon name="check-circle" size={20} color="green" />
    <Text style={styles.verifiedText}>Verified Account ✅</Text>
  </View>
)}

{verificationStatus === 'rejected' && (
  <View style={styles.rejectedBadge}>
    <Icon name="x-circle" size={20} color="red" />
    <Text style={styles.rejectedText}>Verification Failed</Text>
    <TouchableOpacity onPress={handleResubmit}>
      <Text style={styles.resubmitLink}>Resubmit Information →</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## 🧪 Testing

### Test User Verified:

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Fill in:
   - **Title**: "Account Verified"
   - **Body**: "Your account has been verified successfully"
4. Click "Additional options"
5. Add custom data:
   - Key: `type`, Value: `user_verified`
   - Key: `entityType`, Value: `user`
   - Key: `entityId`, Value: `123`
   - Key: `notificationId`, Value: `54`
6. Send to your device
7. **Tap notification** → Should navigate to Profile tab! ✅

### Test User Rejected:

1. Same steps as above but change:
   - **Title**: "Verification Failed"
   - **Body**: "Your account verification was rejected"
   - **Custom data:**
     - Key: `type`, Value: `user_rejected`
     - Key: `reason`, Value: `Incomplete documents`
8. **Tap notification** → Should navigate to Profile tab! ✅

### Check Console Logs:

When notification is tapped, you'll see:

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
  Notification ID: 54

🔔 User verification notification - Navigating to Profile tab
🔔 User verification details: {
  type: 'user_verified',
  entityType: 'user',
  entityId: '123',
  notificationId: '54'
}
```

---

## 🎨 UI/UX Recommendations

### 1. Show Verification Badge:

```typescript
// In ProfileScreen header
{user.isVerified && (
  <View style={styles.verifiedBadge}>
    <Icon name="verified" size={16} color="#4CAF50" />
    <Text style={styles.verifiedText}>Verified</Text>
  </View>
)}
```

### 2. Display Verification Timeline:

```typescript
// Show verification progress
<View style={styles.verificationTimeline}>
  <TimelineItem 
    status="completed" 
    title="Documents Submitted" 
    date="Nov 20, 2024"
  />
  <TimelineItem 
    status="completed" 
    title="Under Review" 
    date="Nov 21, 2024"
  />
  <TimelineItem 
    status="current" 
    title="Verified ✅" 
    date="Nov 22, 2024"
  />
</View>
```

### 3. Show Rejection Reason:

```typescript
// If user was rejected
{verificationStatus === 'rejected' && rejectionReason && (
  <View style={styles.rejectionCard}>
    <Icon name="alert-circle" size={24} color="#FF4D4D" />
    <Text style={styles.rejectionTitle}>Verification Failed</Text>
    <Text style={styles.rejectionReason}>{rejectionReason}</Text>
    <TouchableOpacity 
      style={styles.resubmitButton}
      onPress={handleResubmit}
    >
      <Text style={styles.resubmitText}>Resubmit Documents</Text>
    </TouchableOpacity>
  </View>
)}
```

### 4. Celebration Animation (for verified):

```typescript
import LottieView from 'lottie-react-native';

{showVerificationSuccess && (
  <LottieView
    source={require('./animations/success.json')}
    autoPlay
    loop={false}
    style={styles.celebrationAnimation}
  />
)}
```

---

## 📊 Notification Types Summary

| Type | Navigation | Description | Use Case |
|------|-----------|-------------|----------|
| `user_verified` | **Profile Tab** | Account verified | User passed verification |
| `user_rejected` | **Profile Tab** | Account rejected | User failed verification |
| `document_verified` | **Profile Tab** | Document approved | Specific document verified |
| `document_rejected` | **Profile Tab** | Document rejected | Specific document rejected |
| `new_message` | **Messages Tab** | New messages | Multiple messages |
| `message` | **Chat Screen** | Specific message | Direct message |
| `job` | **Job Details** | Job update | Job-related |
| `contract` | **Tracking** | Contract update | Delivery tracking |

---

## 🔧 Customization

### Add More User Status Types:

```typescript
// In notification-service.tsx
if (
  data.type === 'user_verified' || 
  data.type === 'user_rejected' ||
  data.type === 'user_pending' ||
  data.type === 'user_suspended'
) {
  // Navigate to profile
}
```

### Navigate to Verification Screen Instead:

```typescript
if (data.type === 'user_verified' || data.type === 'user_rejected') {
  // Navigate to dedicated verification screen
  NavigationService.navigate('VerificationScreen', {
    status: data.type === 'user_verified' ? 'verified' : 'rejected',
    reason: data.reason,
  });
}
```

---

## 📝 Backend Payload Examples

### Comprehensive User Verified Payload:

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "🎉 Account Verified!",
    "body": "Congratulations! Your account has been verified. You now have full access.",
    "sound": "default"
  },
  "data": {
    "type": "user_verified",
    "entityType": "user",
    "entityId": "123",
    "notificationId": "54",
    "verifiedAt": "2024-11-22T10:30:00Z",
    "verifiedBy": "admin_id_456"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "verification",
      "color": "#4CAF50"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "badge": 1,
        "sound": "success.caf"
      }
    }
  }
}
```

### Comprehensive User Rejected Payload:

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "Verification Failed",
    "body": "Your account verification was rejected. Please review the details.",
    "sound": "default"
  },
  "data": {
    "type": "user_rejected",
    "entityType": "user",
    "entityId": "123",
    "notificationId": "55",
    "reason": "Incomplete documents: Missing driver's license",
    "rejectedAt": "2024-11-22T10:30:00Z",
    "rejectedBy": "admin_id_456",
    "canResubmit": "true",
    "requiredDocuments": "driver_license,insurance"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "verification",
      "color": "#FF4D4D"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "badge": 1,
        "sound": "error.caf"
      }
    }
  }
}
```

---

## 🚀 Quick cURL Examples

### Send User Verified:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "Account Verified",
      "body": "Your account has been verified successfully"
    },
    "data": {
      "type": "user_verified",
      "entityType": "user",
      "entityId": "123",
      "notificationId": "54"
    }
  }'
```

### Send User Rejected:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "Verification Failed",
      "body": "Your account verification was rejected"
    },
    "data": {
      "type": "user_rejected",
      "entityType": "user",
      "entityId": "123",
      "notificationId": "55",
      "reason": "Incomplete documents"
    }
  }'
```

---

## ✅ Summary

**What's Added:**
- ✅ `user_verified` notification navigates to Profile tab
- ✅ `user_rejected` notification navigates to Profile tab
- ✅ Passes verification status to Profile screen
- ✅ Enhanced logging for debugging

**Profile Screen Receives:**
- `notificationType`: `"user_verified"` or `"user_rejected"`
- `verificationStatus`: `"verified"` or `"rejected"`
- `timestamp`: For forcing refresh

**Use Cases:**
- Show success message when user is verified
- Show error message when user is rejected
- Display verification badge
- Allow user to resubmit information

**Test it now!** Send a test notification and tap it to see the Profile tab open. 🎉

