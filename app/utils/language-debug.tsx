/**
 * Language Detection Debug Utilities
 * Use these functions to test and debug language detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';
import i18n from '@app/language/i18n';
import { clearStoredLanguage, forceDeviceLanguageDetection, getDeviceLanguage } from '@app/language/i18n';

const STORE_LANGUAGE_KEY = 'settings.lang';

/**
 * Get complete language debug information
 */
export const getLanguageDebugInfo = async () => {
  try {
    // Get stored language
    const storedLanguage = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
    
    // Get device locales
    const locales = RNLocalize.getLocales();
    
    // Get current i18n language
    const currentLanguage = i18n.language;
    
    // Get detected device language
    const detectedLanguage = getDeviceLanguage();
    
    const debugInfo = {
      currentLanguage,
      storedLanguage,
      detectedLanguage,
      deviceLocales: locales,
      allAsyncStorageKeys: await AsyncStorage.getAllKeys(),
    };
    
    console.log('🐛 === LANGUAGE DEBUG INFO ===');
    console.log('Current i18n language:', currentLanguage);
    console.log('Stored language (AsyncStorage):', storedLanguage);
    console.log('Detected device language:', detectedLanguage);
    console.log('Device locales:', JSON.stringify(locales, null, 2));
    console.log('AsyncStorage keys:', debugInfo.allAsyncStorageKeys);
    console.log('🐛 === END DEBUG INFO ===');
    
    return debugInfo;
  } catch (error) {
    console.error('Error getting debug info:', error);
    return null;
  }
};

/**
 * Clear language and test detection
 * This will:
 * 1. Clear stored language
 * 2. Detect device language
 * 3. Apply detected language
 */
export const testLanguageDetection = async () => {
  console.log('🧪 === TESTING LANGUAGE DETECTION ===');
  
  // Show current state
  await getLanguageDebugInfo();
  
  // Force detection
  const detectedLang = await forceDeviceLanguageDetection();
  
  console.log('✅ Test complete. App should now use:', detectedLang);
  console.log('🧪 === END TEST ===');
  
  return detectedLang;
};

/**
 * Reset to device language
 */
export const resetToDeviceLanguage = async () => {
  console.log('🔄 Resetting to device language...');
  return await forceDeviceLanguageDetection();
};

/**
 * Clear all language data
 */
export const clearAllLanguageData = async () => {
  try {
    console.log('🗑️ Clearing all language data...');
    await AsyncStorage.removeItem(STORE_LANGUAGE_KEY);
    await AsyncStorage.removeItem('language-storage'); // Zustand store
    console.log('✅ All language data cleared');
    console.log('ℹ️ Restart the app to trigger device language detection');
  } catch (error) {
    console.error('❌ Error clearing language data:', error);
  }
};

// Export for easy console access
if (__DEV__) {
  // @ts-ignore
  global.languageDebug = {
    getInfo: getLanguageDebugInfo,
    test: testLanguageDetection,
    reset: resetToDeviceLanguage,
    clear: clearAllLanguageData,
    clearStored: clearStoredLanguage,
  };
  
  console.log('🐛 Language debug utilities loaded. Use:');
  console.log('  languageDebug.getInfo()  - Get debug information');
  console.log('  languageDebug.test()     - Test language detection');
  console.log('  languageDebug.reset()    - Reset to device language');
  console.log('  languageDebug.clear()    - Clear all language data');
}

export default {
  getLanguageDebugInfo,
  testLanguageDetection,
  resetToDeviceLanguage,
  clearAllLanguageData,
};

