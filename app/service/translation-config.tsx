/**
 * Translation Configuration
 * Adjust these settings to control translation caching behavior
 * @format
 */

/**
 * CACHE DURATION SETTINGS
 * 
 * Adjust the cache duration based on your needs:
 * 
 * Production (stable translations):
 * - 24 hours = 24 * 60 * 60 * 1000 (current default)
 * 
 * Development (frequent updates):
 * - 1 hour = 60 * 60 * 1000
 * - 30 minutes = 30 * 60 * 1000
 * - 5 minutes = 5 * 60 * 1000
 * 
 * No cache (always fresh, more API calls):
 * - 0 (will always fetch from backend)
 */

// Default: 24 hours
export const TRANSLATION_CACHE_DURATION = 24 * 60 * 60 * 1000;

// For development/testing (uncomment to use):
// export const TRANSLATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// For staging (uncomment to use):
// export const TRANSLATION_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * VERSION-BASED CACHE INVALIDATION
 * 
 * Enable this to invalidate cache when translation version changes
 * Backend should return a version number in the response
 */
export const ENABLE_VERSION_BASED_CACHE = false;

/**
 * BACKGROUND REFRESH SETTINGS
 * 
 * Enable background refresh to update translations in the background
 * without user interaction
 */
export const ENABLE_BACKGROUND_REFRESH = false;
export const BACKGROUND_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * PRELOAD SETTINGS
 * 
 * Control which languages to preload on app startup
 */
export const PRELOAD_LANGUAGES_ON_STARTUP = false;
export const LANGUAGES_TO_PRELOAD = ['en', 'es', 'fr', 'de', 'hi'];

/**
 * FORCE REFRESH ON APP START
 * 
 * Enable to always fetch fresh translations when app starts
 * (ignores cache)
 */
export const FORCE_REFRESH_ON_APP_START = false;

/**
 * ENVIRONMENT-BASED CONFIGURATION
 * 
 * Automatically adjust settings based on environment
 */
export const getTranslationConfig = () => {
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    return {
      cacheDuration: 5 * 60 * 1000, // 5 minutes in dev
      enableVersionCache: true,
      enableBackgroundRefresh: false,
      forceRefreshOnStart: false,
    };
  }
  
  return {
    cacheDuration: TRANSLATION_CACHE_DURATION,
    enableVersionCache: ENABLE_VERSION_BASED_CACHE,
    enableBackgroundRefresh: ENABLE_BACKGROUND_REFRESH,
    forceRefreshOnStart: FORCE_REFRESH_ON_APP_START,
  };
};

/**
 * Get current cache duration based on configuration
 */
export const getCacheDuration = (): number => {
  const config = getTranslationConfig();
  return config.cacheDuration;
};

