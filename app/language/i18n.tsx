import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, hr, es, de, pt, ar, zh, hi, fr, ru } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTranslation } from '@app/service/translation-service';
import * as RNLocalize from 'react-native-localize';

const STORE_LANGUAGE_KEY = 'settings.lang';
const USER_MANUALLY_SET_LANGUAGE_KEY = 'settings.lang.manual'; // Track if user manually set language

// Supported languages in the app
const SUPPORTED_LANGUAGES = ['en', 'hr', 'es', 'de', 'pt', 'ar', 'zh', 'hi', 'fr', 'ru'];

/**
 * Get device language and find the best match from supported languages
 */
const getDeviceLanguage = (): string => {
  try {
    // Get device locales in order of preference
    const locales = RNLocalize.getLocales();
    console.log(locales, 'locales');
    if (locales && locales.length > 0) {
      // Try to find exact match first (e.g., 'en-US' -> 'en')
      for (const locale of locales) {
        const languageCode = locale.languageCode.toLowerCase();
        
        // Check if we support this language
        if (SUPPORTED_LANGUAGES.includes(languageCode)) {
          console.log(`📱 Device language detected: ${languageCode} (from ${locale.languageTag})`);
          return languageCode;
        }
        
        // Check language tag variations (e.g., 'zh-Hans-CN' -> 'zh')
        const shortCode = languageCode.split('-')[0];
        if (SUPPORTED_LANGUAGES.includes(shortCode)) {
          console.log(`📱 Device language detected: ${shortCode} (from ${locale.languageTag})`);
          return shortCode;
        }
      }
    }
    
    console.log('📱 No matching device language found, using default: en');
    return 'en'; // Default fallback
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en';
  }
};

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: true,
  init: () => {
    console.log('🔧 Language detector plugin initialized');
  },
  detect: async function (callback: (lang: string) => void) {
    console.log('🔍 Language detection started...');
    try {
      // Check if user has manually set a language preference
      const storedLanguage = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
      const userManuallySet = await AsyncStorage.getItem(USER_MANUALLY_SET_LANGUAGE_KEY);
      
      console.log('💾 Stored language from AsyncStorage:', storedLanguage);
      console.log('👤 User manually set language:', userManuallySet);
      
      // Always use device language if user hasn't manually set one
      if (userManuallySet !== 'true') {
        console.log('🔍 User has not manually set language, using device language...');
        const deviceLanguage = getDeviceLanguage();
        console.log(`✅ Detected device language: ${deviceLanguage}`);
        
        // Store the detected language
        await AsyncStorage.setItem(STORE_LANGUAGE_KEY, deviceLanguage);
        console.log(`💾 Saved device language to storage: ${deviceLanguage}`);
        
        return callback(deviceLanguage);
      } else if (storedLanguage) {
        // User has manually set a language, use that
        console.log(`✅ Using user's manually set language: ${storedLanguage}`);
        return callback(storedLanguage);
      } else {
        // Fallback: detect device language
        console.log('🔍 No stored language, detecting device language...');
        const deviceLanguage = getDeviceLanguage();
        console.log(`✅ Detected device language: ${deviceLanguage}`);
        
        await AsyncStorage.setItem(STORE_LANGUAGE_KEY, deviceLanguage);
        console.log(`💾 Saved device language to storage: ${deviceLanguage}`);
        
        return callback(deviceLanguage);
      }
    } catch (error) {
      console.error('❌ Error in language detection:', error);
      return callback('en');
    }
  },
  cacheUserLanguage: async function (language: string, isManual: boolean = false) {
    try {
      // Save a user's language choice in Async storage
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
      
      // Mark if this was a manual selection
      if (isManual) {
        await AsyncStorage.setItem(USER_MANUALLY_SET_LANGUAGE_KEY, 'true');
        console.log(`💾 Language saved (manual): ${language}`);
      } else {
        console.log(`💾 Language saved (automatic): ${language}`);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

export { getDeviceLanguage };

// Initial static resources as fallback
const resources = {
  en: {
    translation: en,
  },
  hr: {
    translation: hr,
  },
  es: {
    translation: es,
  },
  de: {
    translation: de,
  },
  pt: {
    translation: pt,
  },
  ar: {
    translation: ar,
  },
  zh: {
    translation: zh,
  },
  hi: {
    translation: hi,
  },
  fr: {
    translation: fr,
  },
  ru: {
    translation: ru,
  },
};

i18n
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init(
    {
      resources,
      compatibilityJSON: 'v4',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    },
    () => {},
  );

/**
 * Load dynamic translation from backend
 * This function fetches translations from backend and updates i18n resources
 */
export const loadDynamicTranslation = async (
  lang: string,
  type: string = 'mobile'
): Promise<void> => {
  try {
    console.log(`🔄 Loading dynamic translation for ${lang}...`);
    
    // Fetch translation from backend (with cache and fallback logic)
    const translation = await getTranslation(lang, type);
    
    // Check if the language bundle already exists
    const hasLanguage = i18n.hasResourceBundle(lang, 'translation');
    
    if (hasLanguage) {
      // Update existing resource bundle
      i18n.addResourceBundle(lang, 'translation', translation, true, true);
      console.log(`✅ Updated translation bundle for ${lang}`);
    } else {
      // Add new resource bundle
      i18n.addResourceBundle(lang, 'translation', translation, true, false);
      console.log(`✅ Added new translation bundle for ${lang}`);
    }
    
    // Change language if it's different from current
    if (i18n.language !== lang) {
      await i18n.changeLanguage(lang);
      console.log(`✅ Changed language to ${lang}`);
    }
  } catch (error) {
    console.error(`❌ Error loading dynamic translation for ${lang}:`, error);
    // i18n will use static fallback automatically
  }
};

/**
 * Initialize translations with backend data
 * Call this on app startup or when user changes language
 */
export const initializeDynamicTranslations = async (): Promise<void> => {
  try {
    const currentLanguage = i18n.language || 'en';
    await loadDynamicTranslation(currentLanguage);
  } catch (error) {
    console.error('Error initializing dynamic translations:', error);
  }
};

/**
 * Clear stored language preference and force re-detection
 * Useful for testing or resetting language to device default
 */
export const clearStoredLanguage = async (): Promise<void> => {
  try {
    console.log('🗑️ Clearing stored language preference...');
    await AsyncStorage.removeItem(STORE_LANGUAGE_KEY);
    console.log('✅ Stored language cleared');
  } catch (error) {
    console.error('❌ Error clearing stored language:', error);
  }
};

/**
 * Force device language detection and update app language
 */
export const forceDeviceLanguageDetection = async (): Promise<string> => {
  try {
    console.log('🔄 Forcing device language detection...');
    
    // Clear stored language and manual flag
    await clearStoredLanguage();
    await AsyncStorage.removeItem(USER_MANUALLY_SET_LANGUAGE_KEY);
    
    // Detect device language
    const deviceLanguage = getDeviceLanguage();
    console.log(`📱 Detected device language: ${deviceLanguage}`);
    
    // Save and apply it (as automatic, not manual)
    await AsyncStorage.setItem(STORE_LANGUAGE_KEY, deviceLanguage);
    await i18n.changeLanguage(deviceLanguage);
    
    // Load dynamic translations
    await loadDynamicTranslation(deviceLanguage);
    
    console.log(`✅ Language changed to: ${deviceLanguage}`);
    return deviceLanguage;
  } catch (error) {
    console.error('❌ Error forcing device language detection:', error);
    return 'en';
  }
};

/**
 * Set language manually (user selection)
 * This will prevent automatic device language detection
 */
export const setLanguageManually = async (language: string): Promise<void> => {
  try {
    console.log(`👤 User manually setting language to: ${language}`);
    
    // Save language and mark as manual
    await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    await AsyncStorage.setItem(USER_MANUALLY_SET_LANGUAGE_KEY, 'true');
    
    // Change i18n language
    await i18n.changeLanguage(language);
    
    // Load dynamic translations
    await loadDynamicTranslation(language);
    
    console.log(`✅ Language manually set to: ${language}`);
  } catch (error) {
    console.error('❌ Error setting language manually:', error);
  }
};

/**
 * Enable automatic device language detection
 * This will make the app always follow device language
 */
export const enableAutomaticLanguageDetection = async (): Promise<string> => {
  try {
    console.log('🔄 Enabling automatic device language detection...');
    
    // Remove manual flag
    await AsyncStorage.removeItem(USER_MANUALLY_SET_LANGUAGE_KEY);
    
    // Detect and apply device language
    const deviceLanguage = getDeviceLanguage();
    await AsyncStorage.setItem(STORE_LANGUAGE_KEY, deviceLanguage);
    await i18n.changeLanguage(deviceLanguage);
    await loadDynamicTranslation(deviceLanguage);
    
    console.log(`✅ Automatic language detection enabled. Using: ${deviceLanguage}`);
    return deviceLanguage;
  } catch (error) {
    console.error('❌ Error enabling automatic detection:', error);
    return 'en';
  }
};

/**
 * Check if user has manually set a language
 */
export const isLanguageManuallySet = async (): Promise<boolean> => {
  try {
    const manualFlag = await AsyncStorage.getItem(USER_MANUALLY_SET_LANGUAGE_KEY);
    return manualFlag === 'true';
  } catch (error) {
    console.error('❌ Error checking manual language flag:', error);
    return false;
  }
};

/**
 * Check and update app language based on device locale
 * Call this when app becomes active/focused
 */
export const checkAndUpdateDeviceLanguage = async (): Promise<void> => {
  try {
    console.log('🔍 Checking device language...');
    
    // Check if user has manually set a language
    const isManual = await isLanguageManuallySet();
    
    if (!isManual) {
      // User hasn't manually set language, so follow device language
      console.log('📱 Checking for device language changes...');
      const newDeviceLanguage = getDeviceLanguage();
      const currentLanguage = i18n.language;
      
      if (newDeviceLanguage !== currentLanguage) {
        console.log(`🔄 Device language changed from ${currentLanguage} to ${newDeviceLanguage}`);
        
        // Update stored language
        await AsyncStorage.setItem(STORE_LANGUAGE_KEY, newDeviceLanguage);
        
        // Change i18n language
        await i18n.changeLanguage(newDeviceLanguage);
        
        // Load dynamic translations
        await loadDynamicTranslation(newDeviceLanguage);
        
        console.log(`✅ Language automatically changed to: ${newDeviceLanguage}`);
      } else {
        console.log(`ℹ️ Device language is still ${newDeviceLanguage}, no change needed`);
      }
    } else {
      console.log('👤 User has manually set language, not checking device language');
    }
  } catch (error) {
    console.error('❌ Error checking device language:', error);
  }
};

export { languageDetectorPlugin };

export default i18n;
