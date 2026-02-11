/**
 * Custom hook for advanced translation features
 * Provides additional functionality beyond basic useTranslation
 * @format
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { loadDynamicTranslation } from '@app/language/i18n';
import { 
  clearTranslationCache, 
  refreshTranslation,
  preloadTranslations 
} from '@app/service/translation-service';
import { useLanguageStore } from '@app/store/languageStore';

interface UseTranslationsReturn {
  // Standard translation function
  t: (key: string, options?: any) => string;
  // Current language
  currentLanguage: string;
  // Change language and load translations
  changeLanguage: (lang: string) => Promise<void>;
  // Refresh current language translations from backend
  refreshCurrentLanguage: () => Promise<void>;
  // Clear cache for current language
  clearCache: () => Promise<void>;
  // Preload multiple languages
  preload: (languages: string[]) => Promise<void>;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
}

/**
 * Advanced translation hook with additional features
 */
export const useTranslations = (): UseTranslationsReturn => {
  const { t, i18n } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Change language and load translations from backend
   */
  const changeLanguage = useCallback(async (lang: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await loadDynamicTranslation(lang);
      setLanguage(lang as any);
      
      console.log(`✅ Language changed to ${lang}`);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to change language';
      setError(errorMessage);
      console.error('Error changing language:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setLanguage]);

  /**
   * Refresh current language translations from backend
   */
  const refreshCurrentLanguage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const translation = await refreshTranslation(currentLanguage);
      
      // Update i18n resource bundle
      i18n.addResourceBundle(currentLanguage, 'translation', translation, true, true);
      
      console.log(`✅ Refreshed translations for ${currentLanguage}`);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to refresh translations';
      setError(errorMessage);
      console.error('Error refreshing translations:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, i18n]);

  /**
   * Clear cache for current language
   */
  const clearCache = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await clearTranslationCache(currentLanguage);
      
      console.log(`🗑️ Cleared cache for ${currentLanguage}`);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to clear cache';
      setError(errorMessage);
      console.error('Error clearing cache:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  /**
   * Preload multiple languages in background
   */
  const preload = useCallback(async (languages: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await preloadTranslations(languages);
      
      console.log(`✅ Preloaded ${languages.length} languages`);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to preload translations';
      setError(errorMessage);
      console.error('Error preloading translations:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    t,
    currentLanguage,
    changeLanguage,
    refreshCurrentLanguage,
    clearCache,
    preload,
    isLoading,
    error,
  };
};

export default useTranslations;

