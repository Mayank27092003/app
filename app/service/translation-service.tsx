/**
 * Translation Service
 * Fetches and caches translations from backend API
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpRequest } from './http-service';
import { endPoints } from './endpoints';
import { en, hr, es, de, ar, pt, zh, hi, fr, ru } from '@app/language/translations';
import { getCacheDuration } from './translation-config';

const TRANSLATION_CACHE_PREFIX = 'translation_cache_';
const TRANSLATION_TIMESTAMP_PREFIX = 'translation_timestamp_';
const TRANSLATION_VERSION_PREFIX = 'translation_version_';

// Fallback static translations
const staticTranslations: Record<string, any> = {
  en,
  hr,
  es,
  de,
  ar,
  pt,
  zh,
  hi,
  fr,
  ru,
};

interface TranslationResponse {
  success: boolean;
  lang: string;
  type: string;
  data: Record<string, any>;
  version?: string | number; // Optional version for cache invalidation
}

/**
 * Check if cached translation is still valid
 */
const isCacheValid = async (lang: string): Promise<boolean> => {
  try {
    const timestamp = await AsyncStorage.getItem(
      `${TRANSLATION_TIMESTAMP_PREFIX}${lang}`
    );
    if (!timestamp) return false;

    const cacheDuration = getCacheDuration();
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    const isValid = cacheAge < cacheDuration;
    
    if (__DEV__) {
      const remainingTime = Math.max(0, cacheDuration - cacheAge);
      const remainingMinutes = Math.floor(remainingTime / (60 * 1000));
      console.log(`📅 Cache for ${lang}: ${isValid ? 'VALID' : 'EXPIRED'} (${remainingMinutes}min remaining)`);
    }
    
    return isValid;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};

/**
 * Get cached translation
 */
const getCachedTranslation = async (
  lang: string
): Promise<Record<string, any> | null> => {
  try {
    const cached = await AsyncStorage.getItem(
      `${TRANSLATION_CACHE_PREFIX}${lang}`
    );
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('Error getting cached translation:', error);
    return null;
  }
};

/**
 * Cache translation with optional version
 */
const cacheTranslation = async (
  lang: string,
  translations: Record<string, any>,
  version?: string | number
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      `${TRANSLATION_CACHE_PREFIX}${lang}`,
      JSON.stringify(translations)
    );
    await AsyncStorage.setItem(
      `${TRANSLATION_TIMESTAMP_PREFIX}${lang}`,
      Date.now().toString()
    );
    
    // Store version if provided
    if (version) {
      await AsyncStorage.setItem(
        `${TRANSLATION_VERSION_PREFIX}${lang}`,
        version.toString()
      );
    }
    
    if (__DEV__) {
      const cacheDuration = getCacheDuration();
      const expiryTime = new Date(Date.now() + cacheDuration);
      console.log(`💾 Cached ${lang} (expires: ${expiryTime.toLocaleTimeString()})`);
    }
  } catch (error) {
    console.error('Error caching translation:', error);
  }
};

/**
 * Fetch translation from backend
 */
const fetchTranslationFromBackend = async (
  lang: string,
  type: string = 'mobile'
): Promise<Record<string, any> | null> => {
  try {
    const response = (await httpRequest.get(
      endPoints.getTranslations(lang, type)
    )) as TranslationResponse;

    if (response.success && response.data) {
      // Cache the fetched translation with version (if available)
      await cacheTranslation(lang, response.data, response.version);
      
      if (__DEV__ && response.version) {
        console.log(`📦 Fetched ${lang} version: ${response.version}`);
      }
      
      return response.data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching translation for ${lang}:`, error);
    return null;
  }
};

/**
 * Get translation for a specific language
 * Priority: Cache > Backend > Static Fallback
 */
export const getTranslation = async (
  lang: string,
  type: string = 'mobile'
): Promise<Record<string, any>> => {
  try {
    // 1. Check if cache is valid and return cached translation
    const isValid = await isCacheValid(lang);
    if (isValid) {
      const cached = await getCachedTranslation(lang);
      if (cached) {
        console.log(`✅ Using cached translation for ${lang}`);
        return cached;
      }
    }

    // 2. Try to fetch from backend
    console.log(`📡 Fetching translation for ${lang} from backend...`);
    const backendTranslation = await fetchTranslationFromBackend(lang, type);
    if (backendTranslation) {
      console.log(`✅ Fetched translation for ${lang} from backend`);
      return backendTranslation;
    }

    // 3. Check cache even if expired (better than nothing)
    const cached = await getCachedTranslation(lang);
    if (cached) {
      console.log(`⚠️ Using expired cache for ${lang} (backend unavailable)`);
      return cached;
    }

    // 4. Fallback to static translation
    console.log(`⚠️ Using static fallback translation for ${lang}`);
    return staticTranslations[lang] || staticTranslations.en;
  } catch (error) {
    console.error(`Error getting translation for ${lang}:`, error);
    // Ultimate fallback to static translation
    return staticTranslations[lang] || staticTranslations.en;
  }
};

/**
 * Preload translations for all available languages
 */
export const preloadTranslations = async (
  languages: string[] = ['en', 'es', 'hr', 'de', 'ar', 'pt', 'zh', 'hi', 'fr', 'ru'],
  type: string = 'mobile'
): Promise<void> => {
  try {
    console.log('🔄 Preloading translations...');
    const promises = languages.map((lang) =>
      fetchTranslationFromBackend(lang, type)
    );
    await Promise.allSettled(promises);
    console.log('✅ Translations preloaded');
  } catch (error) {
    console.error('Error preloading translations:', error);
  }
};

/**
 * Clear translation cache
 */
export const clearTranslationCache = async (lang?: string): Promise<void> => {
  try {
    if (lang) {
      // Clear specific language
      await AsyncStorage.removeItem(`${TRANSLATION_CACHE_PREFIX}${lang}`);
      await AsyncStorage.removeItem(`${TRANSLATION_TIMESTAMP_PREFIX}${lang}`);
      console.log(`🗑️ Cleared cache for ${lang}`);
    } else {
      // Clear all translation caches
      const keys = await AsyncStorage.getAllKeys();
      const translationKeys = keys.filter(
        (key) =>
          key.startsWith(TRANSLATION_CACHE_PREFIX) ||
          key.startsWith(TRANSLATION_TIMESTAMP_PREFIX)
      );
      await AsyncStorage.multiRemove(translationKeys);
      console.log('🗑️ Cleared all translation caches');
    }
  } catch (error) {
    console.error('Error clearing translation cache:', error);
  }
};

/**
 * Force refresh translation from backend
 */
export const refreshTranslation = async (
  lang: string,
  type: string = 'mobile'
): Promise<Record<string, any>> => {
  try {
    console.log(`🔄 Force refreshing translation for ${lang}...`);
    const translation = await fetchTranslationFromBackend(lang, type);
    if (translation) {
      console.log(`✅ Successfully refreshed translation for ${lang}`);
      return translation;
    }
    // Fallback to cached or static
    return await getTranslation(lang, type);
  } catch (error) {
    console.error(`Error refreshing translation for ${lang}:`, error);
    return await getTranslation(lang, type);
  }
};

