/**
 * Translation Usage Examples
 * Demonstrates how to use the dynamic translation system
 * @format
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTranslations } from '@app/hooks/useTranslations';
import { 
  getTranslation, 
  clearTranslationCache, 
  refreshTranslation,
  preloadTranslations 
} from '@app/service/translation-service';

/**
 * Example 1: Basic Translation Usage (Most Common)
 * Use this in 99% of your components
 */
export const BasicTranslationExample = () => {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('common.loading')}</Text>
      <Text>{t('auth.login.title')}</Text>
      <Text>{t('navigation.home')}</Text>
    </View>
  );
};

/**
 * Example 2: Advanced Translation Hook
 * Use when you need language switching or cache management
 */
export const AdvancedTranslationExample = () => {
  const { 
    t, 
    currentLanguage, 
    changeLanguage, 
    refreshCurrentLanguage,
    clearCache,
    isLoading,
    error 
  } = useTranslations();

  const handleLanguageChange = async (lang: string) => {
    try {
      await changeLanguage(lang);
      console.log('Language changed successfully!');
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshCurrentLanguage();
      console.log('Translations refreshed!');
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      console.log('Cache cleared!');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      <Text>Current Language: {currentLanguage}</Text>
      <Text>{t('common.welcome')}</Text>
      
      <TouchableOpacity onPress={() => handleLanguageChange('es')}>
        <Text>Switch to Spanish</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => handleLanguageChange('fr')}>
        <Text>Switch to French</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleRefresh}>
        <Text>Refresh Translations</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleClearCache}>
        <Text>Clear Cache</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Example 3: Programmatic Translation Loading
 * Use in background tasks or initialization
 */
export const ProgrammaticTranslationExample = async () => {
  // Get translation for a specific language
  const englishTranslations = await getTranslation('en');
  console.log('English translations:', englishTranslations);

  // Force refresh from backend
  const freshTranslations = await refreshTranslation('es');
  console.log('Fresh Spanish translations:', freshTranslations);

  // Clear cache for a specific language
  await clearTranslationCache('fr');

  // Clear all translation caches
  await clearTranslationCache();

  // Preload multiple languages in background
  await preloadTranslations(['en', 'es', 'fr', 'de']);
};

/**
 * Example 4: Language Selector Component
 * Complete example of a language selection screen
 */
export const LanguageSelectorExample = () => {
  const { t, currentLanguage, changeLanguage, isLoading } = useTranslations();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const handleSelectLanguage = async (langCode: string) => {
    try {
      await changeLanguage(langCode);
      // Show success message
      console.log(`Language changed to ${langCode}`);
    } catch (error) {
      // Show error message
      console.error('Failed to change language:', error);
    }
  };

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
        {t('settings.selectLanguage')}
      </Text>
      
      {isLoading && <ActivityIndicator />}
      
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          onPress={() => handleSelectLanguage(lang.code)}
          style={{
            padding: 15,
            backgroundColor: currentLanguage === lang.code ? '#e3f2fd' : 'white',
            borderRadius: 8,
            marginVertical: 5,
          }}
        >
          <Text>
            {lang.flag} {lang.name}
            {currentLanguage === lang.code && ' ✓'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * Example 5: Translation with Interpolation
 * Use when you need to insert dynamic values
 */
export const InterpolationExample = () => {
  const { t } = useTranslation();
  const userName = 'John Doe';
  const itemCount = 5;

  return (
    <View>
      {/* Simple interpolation */}
      <Text>{t('common.greeting', { name: userName })}</Text>
      
      {/* Pluralization */}
      <Text>{t('common.itemCount', { count: itemCount })}</Text>
      
      {/* Multiple values */}
      <Text>{t('messages.welcome', { name: userName, date: new Date().toLocaleDateString() })}</Text>
    </View>
  );
};

/**
 * Example 6: Conditional Translations
 * Use when translations depend on user role or state
 */
export const ConditionalTranslationExample = () => {
  const { t } = useTranslation();
  const userRole = 'driver'; // or 'merchant'

  return (
    <View>
      {userRole === 'driver' ? (
        <Text>{t('home.noJobsDriver')}</Text>
      ) : (
        <Text>{t('home.noJobsMerchant')}</Text>
      )}
    </View>
  );
};

/**
 * Example 7: Translation Cache Management
 * Use in settings or debug screens
 */
export const CacheManagementExample = () => {
  const { t } = useTranslations();

  const handleClearAllCaches = async () => {
    await clearTranslationCache();
    console.log('All translation caches cleared');
  };

  const handlePreloadLanguages = async () => {
    const languages = ['en', 'es', 'fr', 'de', 'hi', 'zh'];
    await preloadTranslations(languages);
    console.log('All languages preloaded');
  };

  const handleRefreshCurrent = async () => {
    const currentLang = 'en'; // Get from language store
    await refreshTranslation(currentLang);
    console.log('Current language refreshed');
  };

  return (
    <View>
      <Text>{t('settings.cacheManagement')}</Text>
      
      <TouchableOpacity onPress={handleClearAllCaches}>
        <Text>Clear All Caches</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handlePreloadLanguages}>
        <Text>Preload All Languages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleRefreshCurrent}>
        <Text>Refresh Current Language</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Best Practices:
 * 
 * 1. Use basic useTranslation() for most components
 * 2. Use useTranslations() when you need language switching
 * 3. Avoid calling getTranslation() directly in components (use hooks)
 * 4. Keep translation keys descriptive and hierarchical
 * 5. Test with different languages during development
 * 6. Handle loading states when changing languages
 * 7. Provide feedback to users when translations update
 * 8. Use fallback values for missing translations
 * 9. Cache is managed automatically - don't clear it too often
 * 10. Preload languages during idle time for better UX
 */

