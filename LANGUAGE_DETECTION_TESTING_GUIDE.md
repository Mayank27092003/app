# Language Detection Testing Guide

## Problem: Device Language Not Detecting

If the app is showing English even after changing device language, this is because **there's already a stored language preference** in AsyncStorage. Device language detection only happens **on first launch** or when there's no stored preference.

## Quick Fix: Test Device Language Detection

### Method 1: Use the Debug Button (Easiest)

1. **Open the app**
2. **Go to**: Settings → Language
3. **Scroll to the bottom** - you'll see a red debug button:
   ```
   🐛 Use Device Language (Debug)
   ```
4. **Tap the button**
5. **Confirm** the dialog
6. **App will detect and switch to your device language**

### Method 2: Use Console Commands

In development mode, open Metro console and run:

```javascript
// Get debug information
languageDebug.getInfo()

// Test device language detection
languageDebug.test()

// Force device language
languageDebug.reset()

// Clear all language data
languageDebug.clear()
```

### Method 3: Clear App Data

#### iOS:
```bash
# Delete and reinstall the app
npm run ios
```

Or manually:
1. Delete app from device/simulator
2. Reinstall

#### Android:
```bash
# Clear app data
adb shell pm clear com.coinbase

# Or reinstall
npm run android
```

## Step-by-Step Testing

### Test 1: Device Language Detection

```bash
# 1. Change device language to Spanish
# iOS: Settings → General → Language & Region
# Android: Settings → System → Languages

# 2. Clear stored language preference
# In Metro console:
languageDebug.clear()

# 3. Close and restart app
# iOS: Swipe up and force close
# Android: Recent apps → Swipe away

# 4. Reopen app
# Should now be in Spanish!
```

### Test 2: Manual Language Override

```bash
# 1. Device in Spanish, app in Spanish

# 2. Go to Settings → Language
# 3. Select French
# 4. Close and reopen app
# App should stay in French (not revert to Spanish)
```

### Test 3: Console Debugging

```bash
# Open Metro console and watch for logs:

# When app starts:
🔧 Language detector plugin initialized
🔍 Language detection started...
💾 Stored language from AsyncStorage: en
✅ Using stored language: en

# Or if no stored language:
🔍 No stored language, detecting device language...
locales [{"countryCode": "US", "languageTag": "en-US", "languageCode": "en", ...}]
📱 Device language detected: en (from en-US)
✅ Detected device language: en
💾 Saved device language to storage: en
```

## Debugging Console Logs

### Expected Logs on First Launch (No Stored Language):

```
🔧 Language detector plugin initialized
🔍 Language detection started...
💾 Stored language from AsyncStorage: null
🔍 No stored language, detecting device language...
locales [{"countryCode": "ES", "languageTag": "es-ES", "languageCode": "es", ...}]
📱 Device language detected: es (from es-ES)
✅ Detected device language: es
💾 Saved device language to storage: es
🔄 Loading dynamic translation for es...
✅ Changed language to es
```

### Expected Logs on Subsequent Launches (Has Stored Language):

```
🔧 Language detector plugin initialized
🔍 Language detection started...
💾 Stored language from AsyncStorage: es
✅ Using stored language: es
🔄 Loading dynamic translation for es...
```

## Common Issues & Solutions

### Issue 1: Device language shows correctly in logs but app still in English

**Cause**: UI not re-rendering after language change

**Solution**:
```javascript
// Force app restart after language change
import RNRestart from 'react-native-restart';
RNRestart.Restart();
```

### Issue 2: `locales` array is empty

**Cause**: `react-native-localize` not installed properly on iOS

**Solution**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Issue 3: Always defaults to English

**Possible Causes**:
1. Device language not in supported list
2. Stored language exists
3. RNLocalize.getLocales() returning empty

**Solution**:
```javascript
// Check what's happening
languageDebug.getInfo()

// Clear and retry
languageDebug.clear()
// Restart app
```

### Issue 4: TypeScript error with `react-native-localize`

**Solution**:
```bash
npm install --save-dev @types/react-native-localize
```

## Manual Testing Checklist

- [ ] Install app fresh (no previous data)
- [ ] Change device to Spanish → App shows Spanish
- [ ] Change device to French → App shows French  
- [ ] Change device to Japanese → App shows English (unsupported fallback)
- [ ] Manually select German in app → App shows German
- [ ] Close and reopen → App still shows German (not device language)
- [ ] Use debug button → App switches to device language
- [ ] Check console logs for all transitions

## Verifying Installation

### Check if react-native-localize is installed:

```bash
# Check package.json
cat package.json | grep react-native-localize

# Should show:
"react-native-localize": "^x.x.x"
```

### Check if iOS pods are linked:

```bash
cd ios
cat Podfile.lock | grep RNLocalize

# Should show:
- RNLocalize (x.x.x)
```

### Test in code:

```javascript
import * as RNLocalize from 'react-native-localize';

const locales = RNLocalize.getLocales();
console.log('Device locales:', locales);

// Should output array of locales:
// [{countryCode: "US", languageTag: "en-US", languageCode: "en", ...}]
```

## Debug Utilities Reference

All debug utilities are automatically loaded in `__DEV__` mode:

```javascript
// Get complete debug information
await languageDebug.getInfo()
// Returns: { currentLanguage, storedLanguage, detectedLanguage, deviceLocales, ... }

// Test device language detection (clears stored, detects, applies)
await languageDebug.test()

// Reset to device language (same as debug button)
await languageDebug.reset()

// Clear all language data (requires app restart)
await languageDebug.clear()

// Clear only stored preference (not Zustand)
await languageDebug.clearStored()
```

## Expected Behavior

1. **First Launch**: App detects device language and uses it
2. **Manual Change**: User manually selects a language → preference saved
3. **Subsequent Launches**: App uses saved preference (not device language)
4. **Clear Data**: Clears preference → Next launch detects device language again

## Support Matrix

| Device Language | Supported? | App Language |
|----------------|------------|--------------|
| English (en) | ✅ Yes | English |
| Spanish (es) | ✅ Yes | Spanish |
| French (fr) | ✅ Yes | French |
| German (de) | ✅ Yes | German |
| Arabic (ar) | ✅ Yes | Arabic |
| Portuguese (pt) | ✅ Yes | Portuguese |
| Chinese (zh) | ✅ Yes | Chinese |
| Russian (ru) | ✅ Yes | Russian |
| Hindi (hi) | ✅ Yes | Hindi |
| Croatian (hr) | ✅ Yes | Croatian |
| Japanese (ja) | ❌ No | English (fallback) |
| Korean (ko) | ❌ No | English (fallback) |
| Italian (it) | ❌ No | English (fallback) |

## Next Steps

1. **Run the app** and check console logs
2. **Use the debug button** in Settings → Language to test detection
3. **Share console logs** if detection is not working
4. **Verify iOS pods** are installed if on iOS

Need help? Check the console logs and share them for debugging!

