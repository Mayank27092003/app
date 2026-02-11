# Deep Linking Backend Integration Guide

## 📱 Overview

This document explains how the backend should generate deep links for the GoFRTS mobile app to open specific screens on both iOS and Android.

---

## 🔗 Supported Link Formats

### 1. **Custom URL Scheme** (Works immediately, no verification needed)
```
gofrts://open/{path}
```

### 2. **Universal Links / App Links** (Requires domain verification)
```
https://gofrts.com/{path}
```

---

## 📋 Available Deep Links

### 1. Profile Screen
Opens the user's profile screen (used for bank account management return flow).

**Formats:**
```bash
# Custom URL Scheme
gofrts://open/profile

# Universal Link
https://gofrts.com/profile
```

**Use Cases:**
- After Stripe Connect bank account setup
- After updating profile information
- Direct link to profile management

**Backend Implementation:**
```javascript
// Node.js/Express Example
function generateProfileDeepLink() {
  return {
    appScheme: "gofrts://open/profile",
    universalLink: "https://gofrts.com/profile"
  };
}
```

---

### 2. Job Details Screen
Opens a specific job details page with the job ID.

**Formats:**
```bash
# Custom URL Scheme
gofrts://open/job/{jobId}

# Universal Link
https://gofrts.com/job/{jobId}
```

**Examples:**
```bash
gofrts://open/job/123
https://gofrts.com/job/456
```

**Use Cases:**
- After completing job payment
- Sharing job details with other users
- Push notification for new job assignment
- Email notifications about job updates

**Backend Implementation:**
```javascript
// Node.js/Express Example
function generateJobDetailsDeepLink(jobId) {
  return {
    appScheme: `gofrts://open/job/${jobId}`,
    universalLink: `https://gofrts.com/job/${jobId}`
  };
}

// Usage example
app.post('/api/v1/job/:jobId/payment/retry', async (req, res) => {
  const { jobId } = req.params;
  
  // Create Stripe payment session
  const session = await stripe.checkout.sessions.create({
    // ... payment config ...
    success_url: `https://gofrts.com/job/${jobId}?paymentSuccess=true`,
    cancel_url: `https://gofrts.com/job/${jobId}?paymentSuccess=false`,
  });
  
  res.json({ 
    sessionUrl: session.url,
    deepLink: generateJobDetailsDeepLink(jobId)
  });
});
```

---

### 3. Create Job Screen
Opens the create job screen (used for payment return flow).

**Formats:**
```bash
# Custom URL Scheme
gofrts://open/createjob

# Universal Link
https://gofrts.com/createjob
```

**Use Cases:**
- After completing job posting payment
- Direct link to create a new job

**Backend Implementation:**
```javascript
function generateCreateJobDeepLink() {
  return {
    appScheme: "gofrts://open/createjob",
    universalLink: "https://gofrts.com/createjob"
  };
}
```

---

## 🎯 When to Send Which Link Format?

### Use **Custom URL Scheme** (`gofrts://open/...`):
✅ **Best for:**
- Immediate return from web flows (Stripe, payments)
- Development/testing
- SMS messages
- In-app sharing

❌ **Limitations:**
- Doesn't work if app is not installed
- May show "Open in App?" prompt on some devices

### Use **Universal Links** (`https://gofrts.com/...`):
✅ **Best for:**
- Email notifications
- Marketing campaigns
- Social media sharing
- Push notifications
- Professional communications

✅ **Benefits:**
- Falls back to website if app not installed
- More professional appearance
- Better for SEO and analytics
- No "Open in App?" prompt

❌ **Requirements:**
- Requires domain verification (see setup below)
- Needs web server configuration

---

## 🔧 Backend API Response Format

### Recommended Response Structure

```javascript
{
  "success": true,
  "data": {
    "jobId": 123,
    "deepLinks": {
      "app": "gofrts://open/job/123",           // For immediate app opening
      "universal": "https://gofrts.com/job/123", // For emails/sharing
      "webFallback": "https://gofrts.com/web/job/123" // If app not installed
    }
  }
}
```

### Stripe Payment Integration Example

```javascript
// Complete example for job payment
app.post('/api/v1/job/:jobId/payment', async (req, res) => {
  const { jobId } = req.params;
  const { userId, amount } = req.body;
  
  try {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Job Payment - #${jobId}`,
          },
          unit_amount: amount * 100, // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      // IMPORTANT: Use deep links for success/cancel URLs
      success_url: `https://gofrts.com/job/${jobId}?paymentSuccess=true&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://gofrts.com/job/${jobId}?paymentSuccess=false`,
      metadata: {
        jobId: jobId.toString(),
        userId: userId.toString(),
      },
    });
    
    res.json({
      success: true,
      sessionUrl: session.url,
      deepLinks: {
        app: `gofrts://open/job/${jobId}`,
        universal: `https://gofrts.com/job/${jobId}`,
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

---

## 📧 Email Notification Examples

### Job Assignment Notification

```javascript
const nodemailer = require('nodemailer');

async function sendJobAssignmentEmail(job, driverEmail) {
  const deepLink = `https://gofrts.com/job/${job.id}`;
  
  const emailHTML = `
    <h1>New Job Assigned!</h1>
    <p>You have been assigned to job #${job.id}</p>
    <p><strong>${job.title}</strong></p>
    <p>Pickup: ${job.pickupLocation}</p>
    <p>Delivery: ${job.deliveryLocation}</p>
    <p>
      <a href="${deepLink}" 
         style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
        View Job Details
      </a>
    </p>
  `;
  
  await transporter.sendMail({
    from: 'notifications@gofrts.com',
    to: driverEmail,
    subject: `New Job Assignment - #${job.id}`,
    html: emailHTML,
  });
}
```

### Payment Success Notification

```javascript
async function sendPaymentSuccessEmail(payment, userEmail) {
  const deepLink = `https://gofrts.com/profile`;
  
  const emailHTML = `
    <h1>Payment Successful!</h1>
    <p>Your payment of $${payment.amount} has been processed successfully.</p>
    <p>
      <a href="${deepLink}">
        View Your Profile
      </a>
    </p>
  `;
  
  await transporter.sendMail({
    from: 'payments@gofrts.com',
    to: userEmail,
    subject: 'Payment Confirmation',
    html: emailHTML,
  });
}
```

---

## 🔔 Push Notification Examples

### Using Firebase Cloud Messaging (FCM)

```javascript
const admin = require('firebase-admin');

async function sendJobNotification(fcmToken, jobId, jobTitle) {
  const message = {
    token: fcmToken,
    notification: {
      title: 'New Job Available',
      body: jobTitle,
    },
    data: {
      type: 'job_details',
      jobId: jobId.toString(),
      deepLink: `gofrts://open/job/${jobId}`,
    },
    apns: {
      payload: {
        aps: {
          'content-available': 1,
        },
      },
    },
  };
  
  await admin.messaging().send(message);
}
```

---

## 🌐 Domain Verification Setup

### For Universal Links / App Links to Work

#### 1. **iOS - Apple App Site Association (AASA)**

Create a file at: `https://gofrts.com/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.gofrts",
        "paths": [
          "/profile",
          "/job/*",
          "/createjob"
        ]
      }
    ]
  }
}
```

**Important:**
- File must be served with `Content-Type: application/json`
- Must be accessible over HTTPS
- No `.json` extension on filename
- Replace `YOUR_TEAM_ID` with your Apple Developer Team ID

#### 2. **Android - Asset Links**

Create a file at: `https://gofrts.com/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.gofrts",
      "sha256_cert_fingerprints": [
        "YOUR_RELEASE_KEY_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

**To get your SHA256 fingerprint:**
```bash
keytool -list -v -keystore your_release_keystore.keystore
```

---

## 🧪 Testing Deep Links

### Test URLs (Development)

```bash
# Profile Screen
gofrts://open/profile
https://gofrts.com/profile

# Job Details
gofrts://open/job/123
https://gofrts.com/job/123

# Create Job
gofrts://open/createjob
https://gofrts.com/createjob
```

### Testing on iOS Simulator
```bash
xcrun simctl openurl booted "gofrts://open/job/123"
```

### Testing on Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "gofrts://open/job/123"
```

### Testing Universal Links
```bash
# iOS
xcrun simctl openurl booted "https://gofrts.com/job/123"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "https://gofrts.com/job/123"
```

---

## 📱 Link Behavior in App

### What Happens When Links Are Opened?

1. **Profile Link** (`/profile`):
   - Opens profile screen
   - Shows "Bank account updated successfully" message
   - Refreshes wallet balance and bank accounts

2. **Job Details Link** (`/job/123`):
   - Opens job details for job ID 123
   - Shows "Payment completed successfully" message if from payment
   - Refreshes job data

3. **Create Job Link** (`/createjob`):
   - Opens create job screen
   - Shows payment success indicator if from payment
   - Allows immediate job creation

---

## 🔒 Security Considerations

### 1. Validate Job IDs
```javascript
// Always validate that user has access to the job
app.get('/api/v1/job/:jobId', authenticateUser, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  
  const job = await Job.findById(jobId);
  
  // Check permissions
  if (!canUserAccessJob(userId, job)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json({ job });
});
```

### 2. Use Short-Lived Tokens for Sensitive Actions
```javascript
// Generate temporary token for profile updates
const token = jwt.sign(
  { userId, action: 'profile_update' },
  process.env.JWT_SECRET,
  { expiresIn: '10m' }
);

const deepLink = `https://gofrts.com/profile?token=${token}`;
```

### 3. Log Deep Link Usage
```javascript
// Track deep link opens for analytics and security
await DeepLinkLog.create({
  userId,
  linkType: 'job_details',
  jobId,
  openedAt: new Date(),
  platform: 'ios', // or 'android'
});
```

---

## 📊 Analytics & Tracking

### Track Deep Link Performance

```javascript
// Example analytics event
function trackDeepLinkOpen(linkType, params) {
  analytics.track({
    event: 'Deep Link Opened',
    properties: {
      linkType,
      ...params,
      timestamp: new Date().toISOString(),
    },
  });
}

// Usage in app
// When job link is opened:
trackDeepLinkOpen('job_details', { jobId: 123 });
```

---

## ❓ FAQ

### Q: Which link format should I use by default?
**A:** Use **Universal Links** (`https://gofrts.com/...`) for all external communications (emails, SMS, push notifications). They're more professional and work better across platforms.

### Q: What if the user doesn't have the app installed?
**A:** Universal links will fall back to opening the web version. Custom URL schemes will show an error or prompt to install.

### Q: Can I add query parameters to deep links?
**A:** Yes! Example: `https://gofrts.com/job/123?referral=email&campaign=summer2024`

### Q: How do I debug deep linking issues?
**A:** Check the app logs for `🔗 Deep link received:` messages. The app logs the full URL and extraction process.

### Q: Do I need to update URLs when app updates?
**A:** No! Deep link URLs remain the same across app versions. Only update if you change URL structure.

---

## 📞 Support

For questions or issues with deep linking:
- **Backend Team**: backend@gofrts.com
- **Mobile Team**: mobile@gofrts.com
- **Documentation**: https://docs.gofrts.com/deep-linking

---

## 🚀 Quick Start Checklist

- [ ] Add deep link generation to payment success URLs
- [ ] Update email templates with universal links
- [ ] Configure push notifications with deep link data
- [ ] Set up `.well-known` files for domain verification
- [ ] Test deep links on both iOS and Android
- [ ] Add analytics tracking for deep link opens
- [ ] Document any custom deep links you create

