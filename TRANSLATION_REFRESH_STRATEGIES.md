# Translation Refresh Strategies

## Problem: 24-Hour Cache Delay

With the default 24-hour cache, users won't see updated translations from the backend immediately. Here are **5 strategies** to get fresh translations faster.

---

## ✅ Solution 1: Pull-to-Refresh (Already Implemented!)

Users can manually refresh translations by pulling down in the Language Settings screen.

### How it works:
- Go to Settings → Language
- Pull down on the list
- Or tap "Update Translations" button
- Forces fresh fetch from backend
- Bypasses cache completely

### Implementation:
```typescript
// In language.tsx
const handleRefreshTranslations = async () => {
  const freshTranslations = await refreshTranslation(currentLanguage);
  i18n.addResourceBundle(currentLanguage, 'translation', freshTranslations, true, true);
};
```

### When to use:
- User reports seeing old translations
- After you update translations in backend
- For immediate updates without waiting

---

## ✅ Solution 2: Adjust Cache Duration (Configurable)

Change the cache duration based on your update frequency.

### File: `app/service/translation-config.tsx`

```typescript
// For frequent updates (development):
export const TRANSLATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// For moderate updates (staging):
export const TRANSLATION_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// For stable translations (production):
export const TRANSLATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Auto-adjust by environment:
```typescript
const config = getTranslationConfig(); // Automatically uses 5min in DEV, 24h in PROD
```

### Pros & Cons:

**Short cache (5 minutes):**
- ✅ Fresh translations quickly
- ❌ More API calls
- ❌ Higher data usage

**Long cache (24 hours):**
- ✅ Fewer API calls
- ✅ Lower data usage
- ❌ Delayed updates

### Recommended Settings:

| Environment | Cache Duration | Reason |
|-------------|---------------|---------|
| Development | 5 minutes | Testing translation changes |
| Staging | 1 hour | Balance between fresh & API calls |
| Production | 24 hours | Stable translations, minimize API |

---

## ✅ Solution 3: Version-Based Cache Invalidation

Backend sends a version number. Cache is invalidated when version changes.

### Backend Response:
```json
{
  "success": true,
  "lang": "en",
  "type": "mobile",
  "version": "2024-11-22-v2",  // ← Add this
  "data": {
    "common": {
      "loading": "Loading..."
    }
  }
}
```

### How it works:
1. Backend increments version when translations updated
2. App checks if cached version matches backend version
3. If different, cache is invalidated and fresh data fetched
4. If same, use cache (even if < 24 hours)

### Enable in config:
```typescript
// app/service/translation-config.tsx
export const ENABLE_VERSION_BASED_CACHE = true;
```

### Benefits:
- ✅ Instant updates when backend changes
- ✅ No unnecessary API calls if nothing changed
- ✅ Best of both worlds

### Backend Implementation:
```javascript
// When you update translations, increment version:
const translationVersion = "2024-11-22-v2";

// Return in API response:
{
  success: true,
  lang: "en",
  version: translationVersion,
  data: translations
}
```

---

## ✅ Solution 4: Force Refresh on App Start

Always fetch fresh translations when app starts (ignores cache).

### Enable in config:
```typescript
// app/service/translation-config.tsx
export const FORCE_REFRESH_ON_APP_START = true;
```

### How it works:
- App starts → Fetches from backend (ignores cache)
- Background fetch doesn't block UI
- Falls back to cache if offline

### Implementation:
```typescript
// In app-bootstrap/index.tsx
const initializeServices = async () => {
  const config = getTranslationConfig();
  
  if (config.forceRefreshOnStart) {
    // Clear cache and fetch fresh
    await clearTranslationCache();
  }
  
  await initializeDynamicTranslations();
};
```

### Pros & Cons:

**Pros:**
- ✅ Always see latest translations on app start
- ✅ Good for frequent updates

**Cons:**
- ❌ API call on every app start
- ❌ Slower startup if network is slow
- ❌ Higher data usage

### When to use:
- During active development
- When making frequent translation updates
- For critical translation fixes

---

## ✅ Solution 5: Programmatic Cache Clear

Trigger cache clear remotely via push notification or feature flag.

### Scenario:
You update translations → Send push notification → App clears cache → Fetches fresh translations

### Implementation:

```typescript
// When receiving push notification:
import { clearTranslationCache, refreshTranslation } from '@app/service';

const handleTranslationUpdateNotification = async (notification) => {
  const { lang, clearCache } = notification.data;
  
  if (clearCache) {
    // Clear cache for specific language
    await clearTranslationCache(lang);
    
    // Or clear all
    await clearTranslationCache();
    
    // Fetch fresh translations
    await refreshTranslation(lang);
    
    showMessage({
      message: 'Translations Updated',
      description: 'New translations are now available',
      type: 'success',
    });
  }
};
```

### Push Notification Payload:
```json
{
  "type": "translation_update",
  "data": {
    "lang": "en",
    "clearCache": true,
    "version": "2024-11-22-v2"
  }
}
```

### Benefits:
- ✅ Instant updates for all users
- ✅ Controlled rollout
- ✅ No code changes needed

---

## 📊 Comparison Table

| Solution | Update Speed | API Calls | Data Usage | Complexity | Best For |
|----------|--------------|-----------|------------|------------|----------|
| Pull-to-Refresh | On-demand | Low | Low | ✅ Easy | User-initiated updates |
| Short Cache (5min) | 5 minutes | High | High | ✅ Easy | Development |
| Medium Cache (1h) | 1 hour | Medium | Medium | ✅ Easy | Staging |
| Version-Based | Instant | Low | Low | ⚠️ Medium | Production (recommended) |
| Force Refresh | On app start | Medium | Medium | ✅ Easy | Frequent updates |
| Push Notification | Instant | Low | Low | ⚠️ Complex | Critical updates |

---

## 🎯 Recommended Strategy (Hybrid Approach)

Combine multiple strategies for best results:

### Production Setup:
```typescript
// translation-config.tsx

// 1. Use 24-hour cache as default
export const TRANSLATION_CACHE_DURATION = 24 * 60 * 60 * 1000;

// 2. Enable version-based cache
export const ENABLE_VERSION_BASED_CACHE = true;

// 3. Keep pull-to-refresh for manual updates
// (already implemented in language.tsx)

// 4. Use push notifications for critical updates
// (implement in notification-service.tsx)
```

### Development Setup:
```typescript
// translation-config.tsx

// Use short cache in development
export const TRANSLATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Force refresh on app start
export const FORCE_REFRESH_ON_APP_START = true;
```

### This gives you:
- ✅ 24-hour cache reduces API calls
- ✅ Version-based invalidation for instant updates
- ✅ Pull-to-refresh for user control
- ✅ Push notifications for emergencies
- ✅ Short cache in development for testing

---

## 🚀 Quick Start Guide

### For Development (frequent translation changes):

1. Open `app/service/translation-config.tsx`
2. Change cache duration:
   ```typescript
   export const TRANSLATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
   ```
3. Done! Translations refresh every 5 minutes

### For Production (stable translations):

1. Keep default 24-hour cache
2. Enable version-based cache:
   ```typescript
   export const ENABLE_VERSION_BASED_CACHE = true;
   ```
3. Update backend to include version in response:
   ```json
   {
     "success": true,
     "lang": "en",
     "version": "1.0.0",
     "data": { ... }
   }
   ```
4. Increment version when translations change

### For Immediate Updates:

1. Go to Settings → Language
2. Pull down to refresh
3. Or tap "Update Translations" button

---

## 🧪 Testing

### Test Cache Duration:
```typescript
// Set to 1 minute for testing
export const TRANSLATION_CACHE_DURATION = 60 * 1000;

// Update backend translation
// Wait 1 minute
// Open app → Should see new translation
```

### Test Pull-to-Refresh:
1. Update translation in backend
2. Open Language Settings
3. Pull down
4. Should see updated translation immediately

### Test Version-Based Cache:
1. Enable version-based cache
2. Backend returns version "v1"
3. Update translation and change version to "v2"
4. Open app → Should fetch new translations automatically

---

## 📱 User Experience

### Without Refresh:
- User sees old translations for up to 24 hours
- Inconsistent with backend

### With Pull-to-Refresh:
- User can manually refresh anytime
- Takes 2 seconds
- Clear feedback

### With Version-Based Cache:
- User sees updates automatically
- No manual action needed
- Transparent to user

### With Push Notifications:
- User notified of important updates
- One tap to refresh
- Best experience

---

## 🔧 Implementation Checklist

- [x] Pull-to-refresh in Language Settings
- [x] Configurable cache duration
- [x] Version-based cache support
- [x] Force refresh on app start option
- [ ] Push notification handler (optional)
- [ ] Background refresh (optional)
- [ ] Analytics for cache hits/misses (optional)

---

## 💡 Pro Tips

1. **Use version-based cache in production** - Best balance
2. **Keep pull-to-refresh** - Users feel in control
3. **Monitor API calls** - Adjust cache duration based on usage
4. **Test with real users** - See if 24h is acceptable
5. **Use push notifications sparingly** - Only for critical updates
6. **Log cache hits in dev** - Understand behavior
7. **Document update process** - Team knows when to refresh

---

## 🐛 Troubleshooting

### Translations not updating?

1. Check cache duration:
   ```typescript
   console.log('Cache duration:', getCacheDuration());
   ```

2. Clear cache manually:
   ```typescript
   await clearTranslationCache();
   ```

3. Check backend response:
   ```bash
   curl https://api.gofrts.com/api/v1/translation/en?type=mobile
   ```

4. Verify version (if using version-based cache):
   ```typescript
   const version = await AsyncStorage.getItem('translation_version_en');
   console.log('Cached version:', version);
   ```

### Too many API calls?

1. Increase cache duration:
   ```typescript
   export const TRANSLATION_CACHE_DURATION = 48 * 60 * 60 * 1000; // 48 hours
   ```

2. Disable force refresh on app start:
   ```typescript
   export const FORCE_REFRESH_ON_APP_START = false;
   ```

3. Check logs for cache hits:
   ```
   ✅ Using cached translation for en // Good
   📡 Fetching translation for en from backend... // Happening too often?
   ```

---

## 📚 Related Files

- `app/service/translation-config.tsx` - Configuration
- `app/service/translation-service.tsx` - Core logic
- `app/module/settings/view/language.tsx` - UI with pull-to-refresh
- `app/language/i18n.tsx` - i18n integration
- `DYNAMIC_TRANSLATIONS.md` - Full documentation

---

## Summary

**The 24-hour cache problem has 5 solutions:**

1. ✅ **Pull-to-Refresh** (Already implemented) - Users can manually refresh
2. ✅ **Shorter Cache** (5min-1h) - Auto-refresh more frequently
3. ✅ **Version-Based Cache** - Instant updates when backend changes version
4. ✅ **Force Refresh on Start** - Always fresh on app launch
5. ✅ **Push Notifications** - Remote cache clear trigger

**Recommended:** Use version-based cache + pull-to-refresh for production. Use short cache (5min) for development.

