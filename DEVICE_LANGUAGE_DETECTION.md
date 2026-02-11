# Device Language Detection Guide

This guide explains how the app automatically detects and uses the device's language setting.

## Overview

The app now uses `react-native-localize` to automatically detect the device's language and pre-select it on first launch. If the user has previously selected a language, that preference will be used instead.

## How It Works

### 1. **Language Detection Flow**

```
1. App starts
   ↓
2. Check AsyncStorage for saved language preference
   ↓
3. If found → Use saved language
   ↓
4. If not found → Detect device language using react-native-localize
   ↓
5. Match device language with supported languages
   ↓
6. Set and save the detected language
   ↓
7. Load translations from backend for that language
```

### 2. **Supported Languages**

The app supports the following languages:

| Code | Language | Flag | Region |
|------|----------|------|--------|
| `en` | English | 🇺🇸 | Global default |
| `es` | Español | 🇪🇸 | Latin America, Spain |
| `fr` | Français | 🇫🇷 | Africa, Europe, Canada |
| `de` | Deutsch | 🇩🇪 | Central Europe |
| `ar` | العربية | 🇸🇦 | Middle East & North Africa |
| `pt` | Português | 🇵🇹 | Brazil, Portugal |
| `zh` | 中文 | 🇨🇳 | China |
| `ru` | Русский | 🇷🇺 | Eastern Europe, Central Asia |
| `hi` | हिन्दी | 🇮🇳 | India |
| `hr` | Hrvatski | 🇭🇷 | Croatia |

### 3. **Language Matching Logic**

The app uses the following logic to match device language:

1. **Exact Match**: If device language code matches exactly (e.g., `en` → `en`)
2. **Short Code Match**: If device has variant but base matches (e.g., `en-US` → `en`, `zh-Hans-CN` → `zh`)
3. **Fallback**: If no match found, defaults to English (`en`)

## Implementation Details

### Files Modified

#### 1. `app/language/i18n.tsx`
- Added `react-native-localize` import
- Created `getDeviceLanguage()` function to detect device language
- Updated `languageDetectorPlugin` to use device language detection
- Added console logs for debugging

```typescript
const getDeviceLanguage = (): string => {
  const locales = RNLocalize.getLocales();
  
  // Try to find exact match or short code match
  for (const locale of locales) {
    const languageCode = locale.languageCode.toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(languageCode)) {
      return languageCode;
    }
    // ... short code matching logic
  }
  
  return 'en'; // Default fallback
};
```

#### 2. `app/store/languageStore.ts`
- Updated `Language` type to include all supported languages
- Changed from: `'en' | 'es'`
- Changed to: `'en' | 'es' | 'fr' | 'de' | 'ar' | 'pt' | 'zh' | 'ru' | 'hi' | 'hr'`

#### 3. `app/constants/languages.ts`
- Added Croatian (hr) to the language list

## Usage Examples

### For Users

1. **First Time Launch**:
   - App detects device is set to Spanish → App automatically uses Spanish
   - App detects device is set to French → App automatically uses French
   - App detects device is set to unsupported language → App uses English

2. **Manual Language Change**:
   - User goes to Settings → Language
   - Selects a different language
   - Selected language is saved and used on future launches

3. **Subsequent Launches**:
   - App always uses the last selected language (manual selection takes priority over device language)

### For Developers

#### Get Device Language Programmatically

```typescript
import { getDeviceLanguage } from '@app/language/i18n';

const deviceLang = getDeviceLanguage();
console.log(`Device language: ${deviceLang}`);
```

#### Force Language Detection (Clear Stored Preference)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear stored language preference
await AsyncStorage.removeItem('settings.lang');

// Restart app or reload i18n to trigger re-detection
```

#### Check Current Language

```typescript
import i18n from '@app/language/i18n';

console.log(`Current language: ${i18n.language}`);
```

## Testing

### Test Device Language Detection

1. **iOS**:
   ```
   Settings → General → Language & Region → iPhone Language
   → Select a language → Confirm
   → Delete and reinstall app
   → App should use selected language
   ```

2. **Android**:
   ```
   Settings → System → Languages & input → Languages
   → Add/move a language to top
   → Clear app data or reinstall
   → App should use selected language
   ```

### Test Language Persistence

1. Open app (should use device language)
2. Go to Settings → Language
3. Select a different language
4. Close and reopen app
5. App should use manually selected language (not device language)

## Console Logs

The app logs language detection information:

```
📱 Device language detected: es (from es-MX)
💾 Language saved: es
✅ Changed language to es
🔄 Loading dynamic translation for es...
✅ Updated translation bundle for es
```

## Installation

### Package Installed

```bash
npm install react-native-localize
```

### iOS Additional Setup (Required)

Run pod install:

```bash
cd ios && pod install
```

### Android Setup

No additional setup required. The package auto-links.

## Troubleshooting

### Issue: Language not detecting on iOS

**Solution**: Make sure you've run `pod install` after installing the package.

```bash
cd ios && pod install
```

### Issue: Language always defaults to English

**Check**:
1. Verify device language is set correctly
2. Check if the device language is in the supported languages list
3. Check console logs for detection messages

### Issue: App not respecting device language

**Possible Causes**:
1. User has previously selected a language (stored preference takes priority)
2. Clear app data to reset: `AsyncStorage.removeItem('settings.lang')`

### Issue: App crashes on language change

**Solution**: Ensure all translation files are properly loaded. Check backend API for translation data.

## Migration Notes

### For Existing Users

- Existing users with saved language preferences: No change, their saved language will continue to be used
- New users: Will get device language automatically
- Users who delete and reinstall app: Will get device language automatically

### Breaking Changes

- `Language` type in `languageStore.ts` now includes all supported languages
- Any code that explicitly types `Language` as `'en' | 'es'` will need to be updated

## Future Enhancements

1. **Regional Variants**: Support regional variants like `en-US`, `en-GB`, `pt-BR`, `pt-PT`
2. **Dynamic Language List**: Fetch supported languages from backend
3. **Language Analytics**: Track which languages are most used
4. **Smart Fallback**: Use similar language if exact match not found (e.g., `es-MX` → `es-ES`)

## API Reference

### `getDeviceLanguage()`

Returns the device's language code or fallback.

**Returns**: `string` - Language code (e.g., 'en', 'es', 'fr')

**Example**:
```typescript
const lang = getDeviceLanguage();
// Returns: 'en' | 'es' | 'fr' | 'de' | 'ar' | 'pt' | 'zh' | 'ru' | 'hi' | 'hr'
```

### `languageDetectorPlugin`

i18next plugin that detects and caches language.

**Methods**:
- `detect(callback)`: Detects language (checks storage first, then device)
- `cacheUserLanguage(lang)`: Saves language preference to AsyncStorage

## Resources

- [react-native-localize GitHub](https://github.com/zoontek/react-native-localize)
- [i18next Documentation](https://www.i18next.com/)
- [React Native Internationalization](https://reactnative.dev/docs/platform-specific-code#platform-module)

