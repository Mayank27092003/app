# Device Language Detection - Quick Setup Guide

## ✅ What's Been Done

1. ✅ Installed `react-native-localize` package
2. ✅ Updated `i18n.tsx` with device language detection
3. ✅ Updated `languageStore.ts` to support all languages
4. ✅ Added Croatian (hr) to supported languages list
5. ✅ Created automatic language detection logic

## 🚀 Required Steps

### For iOS (REQUIRED)

Run pod install to link the native module:

```bash
export LANG=en_US.UTF-8
cd ios
pod install
cd ..
```

### For Android

No additional setup required - auto-linked! ✅

## 🧪 Testing the Feature

### Test 1: New User (First Launch)

1. **Change your device language**:
   - iOS: Settings → General → Language & Region
   - Android: Settings → System → Languages

2. **Delete and reinstall the app** OR **Clear app data**:
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

3. **Verify**: App should automatically use your device's language

### Test 2: Language Persistence

1. Open app (should use device language)
2. Go to Settings → Language
3. Select a different language
4. Close and reopen app
5. **Verify**: App uses your manually selected language (not device language)

### Test 3: Unsupported Language Fallback

1. Set device to an unsupported language (e.g., Japanese, Korean)
2. Open app
3. **Verify**: App defaults to English

## 📱 Supported Languages

The app will auto-detect these languages:

- 🇺🇸 English (en)
- 🇪🇸 Español (es)
- 🇫🇷 Français (fr)
- 🇩🇪 Deutsch (de)
- 🇸🇦 العربية (ar)
- 🇵🇹 Português (pt)
- 🇨🇳 中文 (zh)
- 🇷🇺 Русский (ru)
- 🇮🇳 हिन्दी (hi)
- 🇭🇷 Hrvatski (hr)

## 🔍 Debugging

Check console logs to see language detection:

```
📱 Device language detected: es (from es-MX)
💾 Language saved: es
✅ Changed language to es
```

## 📝 How It Works

```
1. App Launch
   ↓
2. Check for saved language preference
   ↓
3. If saved → Use it
   ↓
4. If not saved → Detect device language
   ↓
5. Match with supported languages
   ↓
6. Use matched language (or default to English)
   ↓
7. Load translations from backend
```

## ⚠️ Important Notes

- **Manual selection takes priority**: Once a user manually selects a language, it will always be used (device language is only used on first launch)
- **Clear data to re-detect**: To test device language detection again, clear app data or delete and reinstall
- **Fallback to English**: If device language is not supported, app uses English

## 🐛 Troubleshooting

### iOS: Language not detecting

**Solution**: Run pod install

```bash
export LANG=en_US.UTF-8
cd ios && pod install
```

### Always shows English

**Possible reasons**:
1. Device language is not in supported list
2. User has previously selected a language (check AsyncStorage)

**To reset**:
```typescript
// Clear stored language preference
AsyncStorage.removeItem('settings.lang');
```

### App crashes on launch

**Solution**: 
1. Clean build folder
2. Reinstall node_modules
3. Run pod install again

```bash
# Clean
cd ios && rm -rf Pods Podfile.lock && cd ..
rm -rf node_modules
npm install

# Reinstall pods
cd ios && pod install
```

## 🎯 Next Steps

1. **Run pod install** (iOS only)
2. **Test on both iOS and Android**
3. **Verify console logs** show correct language detection
4. **Test with different device languages**

## 📚 Full Documentation

See `DEVICE_LANGUAGE_DETECTION.md` for complete documentation.

