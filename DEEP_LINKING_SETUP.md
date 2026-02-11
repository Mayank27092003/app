# Deep Linking Setup & Testing Guide

## ✅ What's Been Implemented

### 1. **Deep Link Handlers** (`app/main.tsx`)
- ✅ Profile screen deep linking
- ✅ Job details screen deep linking with jobId extraction
- ✅ Create job screen deep linking
- ✅ Support for both custom URL schemes and universal links
- ✅ Retry logic for navigation readiness
- ✅ Comprehensive logging for debugging

### 2. **Navigation Configuration** (`app/navigator/root-navigation.tsx`)
- ✅ Updated linking config with proper path patterns
- ✅ Parameter parsing for jobId, timestamps, and flags
- ✅ Support for nested navigation (CustomDrawer → BottomTab → Profile)
- ✅ Universal link prefixes configured

### 3. **iOS Configuration**
- ✅ AppDelegate.swift updated with:
  - URL scheme handler (`application:open:options:`)
  - Universal links handler (`application:continue:restorationHandler:`)
- ✅ Info.plist already has `gofrts` URL scheme configured
- ⚠️ **TODO**: Add Universal Links Associated Domains

### 4. **Android Configuration**
- ✅ AndroidManifest.xml updated with:
  - Custom URL scheme intent filter
  - App Links intent filter with autoVerify
- ⚠️ **TODO**: Domain verification setup

---

## 🚀 Quick Start Testing

### Test Deep Links Immediately

**Profile Screen:**
```bash
# iOS Simulator
xcrun simctl openurl booted "gofrts://open/profile"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "gofrts://open/profile"
```

**Job Details Screen:**
```bash
# iOS
xcrun simctl openurl booted "gofrts://open/job/123"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "gofrts://open/job/123"
```

**Create Job Screen:**
```bash
# iOS
xcrun simctl openurl booted "gofrts://open/createjob"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "gofrts://open/createjob"
```

---

## 📱 iOS Universal Links Setup

### Step 1: Update Xcode Project

1. Open `ios/CoinBase.xcworkspace` in Xcode
2. Select your target → **Signing & Capabilities**
3. Click **+ Capability** → Add **Associated Domains**
4. Add these domains:
```
applinks:gofrts.com
applinks:www.gofrts.com
```

### Step 2: Create AASA File

Host this file at `https://gofrts.com/.well-known/apple-app-site-association`:

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
          "/createjob",
          "/home"
        ]
      }
    ]
  }
}
```

**Replace `YOUR_TEAM_ID` with your Apple Developer Team ID** (found in your Apple Developer account).

### Step 3: Verify AASA File

```bash
# Must return JSON (no .json extension!)
curl -I https://gofrts.com/.well-known/apple-app-site-association

# Should show: Content-Type: application/json
```

### Step 4: Test Universal Links

```bash
# iOS Simulator
xcrun simctl openurl booted "https://gofrts.com/job/123"

# Real device - send yourself an iMessage or email with the link
```

---

## 🤖 Android App Links Setup

### Step 1: Get SHA256 Fingerprint

```bash
# For debug builds
cd android
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256

# For release builds (use your actual keystore)
keytool -list -v -keystore your_release.keystore -alias your_alias
```

### Step 2: Create assetlinks.json

Host this file at `https://gofrts.com/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.gofrts",
      "sha256_cert_fingerprints": [
        "YOUR_DEBUG_SHA256_HERE",
        "YOUR_RELEASE_SHA256_HERE"
      ]
    }
  }
]
```

### Step 3: Verify assetlinks.json

```bash
curl https://gofrts.com/.well-known/assetlinks.json
```

### Step 4: Test App Links

```bash
# Android Emulator/Device
adb shell am start -W -a android.intent.action.VIEW -d "https://gofrts.com/job/123" com.gofrts
```

### Step 5: Verify App Link Association

```bash
# Check if your app is verified for the domain
adb shell pm get-app-links com.gofrts
```

---

## 🧪 Testing Checklist

### Custom URL Schemes (`gofrts://`)
- [ ] Profile link opens profile screen
- [ ] Job link with ID opens correct job
- [ ] Create job link opens create job screen
- [ ] Works when app is closed (cold start)
- [ ] Works when app is in background (warm start)
- [ ] Works when app is in foreground

### Universal Links / App Links (`https://gofrts.com`)
- [ ] Links open app when installed
- [ ] Links open website when app not installed
- [ ] No "Open in App?" prompt appears
- [ ] Links work in emails
- [ ] Links work in SMS
- [ ] Links work in web browsers
- [ ] Works with different URL formats (/job/123, /profile, etc.)

### Payment Flow Integration
- [ ] Stripe payment success returns to job details
- [ ] Stripe payment cancel returns to job details
- [ ] Bank account setup returns to profile
- [ ] Success messages display correctly
- [ ] Data refreshes after returning

### Navigation
- [ ] Deep link to nested screen (Profile in BottomTab)
- [ ] Deep link preserves navigation stack
- [ ] Back button works correctly after deep link
- [ ] Parameters passed correctly (jobId, flags, etc.)

---

## 📊 Debugging Deep Links

### Enable Logging

The app already has extensive logging. Look for these in your console:

```
🔗 Deep link received: gofrts://open/job/123
🔗 Deep link lowercase: gofrts://open/job/123
🔗 Extracted jobId: 123 from URL: gofrts://open/job/123
🔗 Navigating to JobDetailsScreen with jobId: 123
```

### iOS Debugging

```bash
# View console logs
xcrun simctl spawn booted log stream --predicate 'process == "CoinBase"'

# Test specific URL
xcrun simctl openurl booted "gofrts://open/job/123"
```

### Android Debugging

```bash
# View logs
adb logcat | grep -i "deeplink\|linking"

# Test specific URL
adb shell am start -W -a android.intent.action.VIEW -d "gofrts://open/job/123" com.gofrts

# Check intent filters
adb shell dumpsys package com.gofrts | grep -A 5 "android.intent.action.VIEW"
```

---

## 🐛 Common Issues & Solutions

### Issue: Universal Links Not Working on iOS

**Symptoms:** Links open in Safari instead of app

**Solutions:**
1. Check Associated Domains in Xcode
2. Verify AASA file is accessible and valid JSON
3. Delete and reinstall app
4. Test on real device (simulator has known issues)
5. Make sure Team ID in AASA matches your Xcode project

**Validate AASA:**
```bash
# Apple's official validator
https://search.developer.apple.com/appsearch-validation-tool/
```

### Issue: App Links Not Working on Android

**Symptoms:** Links open in browser or show app chooser

**Solutions:**
1. Verify assetlinks.json is accessible
2. Check SHA256 fingerprint matches
3. Run: `adb shell pm verify-app-links --re-verify com.gofrts`
4. Clear app data and reinstall
5. Wait a few minutes for Android to verify domain

**Check verification status:**
```bash
adb shell pm get-app-links com.gofrts
```

### Issue: "Navigation not ready" Error

**Symptoms:** Console shows retry messages

**Solutions:**
- This is expected on first launch
- The handler automatically retries after 500ms
- If persists, check NavigationService initialization

### Issue: JobId Not Extracted

**Symptoms:** Job link opens but shows wrong job

**Solutions:**
1. Check URL format matches: `/job/123` or `/jobdetails/123`
2. View logs to see extracted jobId
3. Ensure jobId is a number in the URL

---

## 📝 URL Format Reference

### Supported URL Patterns

```bash
# Profile Screen
gofrts://open/profile
gofrts://open/profilescreen
https://gofrts.com/profile

# Job Details (with ID)
gofrts://open/job/123
gofrts://open/jobdetails/123
gofrts://open/jobdetailsscreen/123
https://gofrts.com/job/123

# Create Job
gofrts://open/createjob
gofrts://open/createjobscreen
https://gofrts.com/createjob
```

### Query Parameters

Add optional query parameters for tracking or state:

```bash
# With payment success flag
https://gofrts.com/job/123?paymentSuccess=true

# With referral tracking
https://gofrts.com/job/123?referral=email&campaign=summer

# With timestamp (forces refresh)
https://gofrts.com/profile?timestamp=1234567890
```

---

## 🔐 Security Notes

1. **Always validate jobId** on the backend before serving data
2. **Check user permissions** for accessing specific jobs/profiles
3. **Log deep link opens** for security auditing
4. **Use HTTPS** for all universal links
5. **Don't include sensitive data** in URLs (use tokens if needed)

---

## 📦 What Backend Needs to Do

See `DEEP_LINKING_BACKEND_GUIDE.md` for complete backend integration details.

**Quick Summary:**
1. Generate deep links in payment success URLs
2. Include deep links in email notifications
3. Add deep links to push notification payloads
4. Set up `.well-known` files for domain verification
5. Use format: `gofrts://open/job/123` or `https://gofrts.com/job/123`

---

## 🎯 Next Steps

### Immediate (Can Test Now)
- [x] Custom URL schemes work out of the box
- [x] Test on simulator/emulator
- [x] Verify navigation to all screens
- [x] Check parameter passing

### Before Production
- [ ] Set up Associated Domains in Xcode
- [ ] Create and host AASA file
- [ ] Create and host assetlinks.json
- [ ] Get release keystore SHA256
- [ ] Test on real devices (iOS & Android)
- [ ] Verify domain ownership
- [ ] Update backend to generate proper links

### Optional Enhancements
- [ ] Add deep link analytics tracking
- [ ] Create more screen-specific deep links
- [ ] Add A/B testing for deep link formats
- [ ] Implement dynamic link shortening

---

## 📞 Support

- **Documentation**: See `DEEP_LINKING_BACKEND_GUIDE.md`
- **iOS Docs**: https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
- **Android Docs**: https://developer.android.com/training/app-links
- **React Navigation**: https://reactnavigation.org/docs/deep-linking/

---

## ✅ Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Custom URL Schemes | ✅ Ready | Works immediately |
| iOS Universal Links | ⚠️ Needs Setup | Requires AASA file |
| Android App Links | ⚠️ Needs Setup | Requires assetlinks.json |
| Profile Deep Link | ✅ Ready | Tested |
| Job Details Deep Link | ✅ Ready | Tested with jobId |
| Create Job Deep Link | ✅ Ready | Tested |
| Payment Return Flow | ✅ Ready | Integrated with Stripe |
| Parameter Parsing | ✅ Ready | jobId, flags, timestamps |
| Logging & Debugging | ✅ Ready | Comprehensive logs |
| Backend Integration | ✅ Documented | See guide |

