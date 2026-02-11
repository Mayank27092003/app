# Dynamic Translation System

This document explains how the app now fetches translations from the backend API instead of using static JSON files.

## Overview

The app now uses a dynamic translation system that:
- **Fetches translations from backend API** when language changes
- **Caches translations** for 24 hours to reduce API calls
- **Falls back to cached translations** when offline
- **Uses static JSON files** as ultimate fallback
- **Preloads translations** on app startup

## API Endpoint

```bash
GET https://api.gofrts.com/api/v1/translation/{lang}?type=mobile
```

### Response Format

```json
{
  "success": true,
  "lang": "en",
  "type": "mobile",
  "data": {
    "common": {
      "loading": "Loading...",
      "error": "Error",
      "success": "Success"
    },
    "auth": {
      "login": {
        "title": "Welcome Back"
      }
    }
  }
}
```

## Architecture

### Translation Loading Priority

1. **Valid Cache** (< 24 hours old)
2. **Backend API** (fetches and caches)
3. **Expired Cache** (if backend unavailable)
4. **Static JSON Files** (ultimate fallback)

### Key Files

#### 1. `/app/service/translation-service.tsx`
Core service that handles:
- Fetching translations from backend
- Caching translations in AsyncStorage
- Cache validation (24-hour expiry)
- Fallback logic

#### 2. `/app/language/i18n.tsx`
Updated i18n configuration:
- `loadDynamicTranslation(lang)` - Load translations for a specific language
- `initializeDynamicTranslations()` - Initialize translations on app startup
- Integrates with i18next to dynamically add/update resource bundles

#### 3. `/app/service/endpoints.tsx`
Added endpoint:
```typescript
getTranslations: (lang: string, type: string = 'mobile') => `/translation/${lang}?type=${type}`
```

#### 4. `/app/module/app-bootstrap/index.tsx`
Initializes translations when app starts:
```typescript
await initializeDynamicTranslations();
```

#### 5. `/app/module/settings/view/language.tsx`
Updated to load dynamic translations when user changes language:
```typescript
await loadDynamicTranslation(language);
```

## Usage

### In Components

Continue using the existing `useTranslation` hook from `react-i18next`:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('common.loading')}</Text>
      <Text>{t('auth.login.title')}</Text>
    </View>
  );
}
```

### Programmatic Language Change

```typescript
import { loadDynamicTranslation } from '@app/language/i18n';

// Load and switch to Spanish
await loadDynamicTranslation('es');
```

### Cache Management

```typescript
import { 
  clearTranslationCache, 
  refreshTranslation,
  preloadTranslations 
} from '@app/service/translation-service';

// Clear cache for specific language
await clearTranslationCache('es');

// Clear all translation caches
await clearTranslationCache();

// Force refresh translation from backend
await refreshTranslation('en');

// Preload all languages in background
await preloadTranslations(['en', 'es', 'fr', 'de']);
```

## Benefits

✅ **Always Up-to-Date**: Translations updated on backend are available to users without app updates  
✅ **Reduced Bundle Size**: Don't need to include all translations in app bundle  
✅ **Offline Support**: Cached translations work offline  
✅ **Fast Performance**: 24-hour cache minimizes API calls  
✅ **Graceful Fallback**: Static files ensure app always works  
✅ **Multi-layer Fallback**: Backend → Cache → Static files  

## Cache Strategy

- **Cache Duration**: 24 hours
- **Storage**: AsyncStorage with keys:
  - `translation_cache_{lang}` - Translation data
  - `translation_timestamp_{lang}` - Cache timestamp
- **Auto-refresh**: Cache refreshes automatically after 24 hours on next language access

## Error Handling

The system handles errors gracefully:

1. **Backend API Error**: Uses cached translation (even if expired)
2. **No Cache Available**: Falls back to static JSON files
3. **Network Offline**: Uses cached translations
4. **Invalid Response**: Falls back to previous layer

All errors are logged but don't break the app.

## Migration from Static to Dynamic

The migration is **seamless** and **backward compatible**:

- ✅ Existing code using `t()` continues to work
- ✅ Static JSON files remain as fallback
- ✅ No breaking changes
- ✅ Gradual rollout possible (backend controls)

## Testing

### Test Translation Loading

```typescript
// In a test component or debug screen
import { getTranslation } from '@app/service/translation-service';

const testTranslations = async () => {
  const enTranslations = await getTranslation('en');
  console.log('English translations:', enTranslations);
};
```

### Test Cache

```typescript
import { clearTranslationCache, getTranslation } from '@app/service/translation-service';

// Clear cache
await clearTranslationCache('en');

// First load - fetches from backend
const t1 = await getTranslation('en');

// Second load - uses cache
const t2 = await getTranslation('en');
```

## Monitoring

Check console logs for translation loading:
- `✅ Using cached translation for {lang}` - Cache hit
- `📡 Fetching translation for {lang} from backend...` - API call
- `⚠️ Using expired cache for {lang}` - Offline fallback
- `⚠️ Using static fallback translation for {lang}` - Ultimate fallback

## Future Enhancements

- [ ] Background sync for translations
- [ ] Delta updates (only changed keys)
- [ ] Translation versioning
- [ ] Analytics for translation usage
- [ ] A/B testing different translations
- [ ] User-specific translations

## Troubleshooting

### Translations not updating?

1. Clear cache: `await clearTranslationCache()`
2. Force refresh: `await refreshTranslation(lang)`
3. Check backend API endpoint is accessible
4. Verify API response format matches expected structure

### App using old translations?

- Check cache expiry (24 hours)
- Force refresh specific language
- Clear all caches and restart app

### Backend API unavailable?

- App automatically uses cached translations
- If no cache, falls back to static JSON files
- No user impact - translations always available

## API Requirements

Backend must return translations in this format:

```typescript
{
  success: boolean;      // Must be true
  lang: string;          // Language code (e.g., "en", "es")
  type: string;          // App type (e.g., "mobile")
  data: {                // Actual translations
    [key: string]: any;  // Nested translation object
  };
}
```

The `data` object should match the structure of existing static JSON files.

