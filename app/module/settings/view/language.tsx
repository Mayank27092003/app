import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { CheckCircle2, Smartphone } from "lucide-react-native";

//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { Language, useLanguageStore } from "@app/store/languageStore";
import i18n, { getDeviceLanguage, setLanguageManually, enableAutomaticLanguageDetection } from "@app/language/i18n";
import Header from "@app/components/Header";
import { httpRequest, endPoints, refreshTranslation } from "@app/service";
import { showMessage } from "react-native-flash-message";

interface LanguageItem {
  code: string;
  name: string;
  flagUrl: string;
}

export default function LanguageSettingsScreen() {
  const styles = useThemedStyle(getStyles);
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await httpRequest.get(endPoints.getLanguages('mobile'));
      
      if (response?.success && response?.languages) {
        setLanguages(response.languages);
      } else if (Array.isArray(response)) {
        // Handle case where API returns array directly
        setLanguages(response);
      } else if (response?.languages) {
        // Handle case where languages are in response.languages
        setLanguages(response.languages);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching languages:', err);
      setError(err?.message || 'Failed to load languages');
      showMessage({
        message: 'Failed to load languages',
        description: err?.message || 'Please try again later',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLanguage = async (language: Language) => {
    try {
      // Show loading indicator while fetching translations
      showMessage({
        message: 'Changing language...',
        type: 'info',
        duration: 1000,
      });

      // Set language manually (this marks it as user's choice and prevents automatic device language changes)
      await setLanguageManually(language);
      
      // Update the language store
      setLanguage(language);

      showMessage({
        message: 'Language changed successfully',
        description: 'Automatic device language detection disabled',
        type: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error changing language:', error);
      showMessage({
        message: 'Failed to change language',
        description: 'Using cached translations',
        type: 'warning',
        duration: 3000,
      });
      // Still update the language even if dynamic loading fails
      await setLanguageManually(language);
      setLanguage(language);
    }
  };

  const handleRefreshTranslations = async () => {
    try {
      setRefreshing(true);
      
      // Force refresh current language translations from backend
      const freshTranslations = await refreshTranslation(currentLanguage);
      
      // Update i18n with fresh translations
      i18n.addResourceBundle(currentLanguage, 'translation', freshTranslations, true, true);
      
      showMessage({
        message: 'Translations Updated',
        description: 'Latest translations loaded from server',
        type: 'success',
        duration: 2000,
      });
      
      console.log(`✅ Force refreshed translations for ${currentLanguage}`);
    } catch (error) {
      console.error('Error refreshing translations:', error);
      showMessage({
        message: 'Refresh Failed',
        description: 'Could not fetch latest translations',
        type: 'danger',
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Function to enable automatic device language detection
  const handleUseDeviceLanguage = async () => {
    const deviceLang = getDeviceLanguage();
    
    Alert.alert(
      'Follow Device Language?',
      `Detected device language: ${deviceLang.toUpperCase()}\n\nEnable this to automatically follow your device's language settings. The app will change language whenever you change your device language.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Enable Automatic',
          onPress: () => {
            (async () => {
              try {
                showMessage({
                  message: 'Enabling automatic detection...',
                  type: 'info',
                  duration: 1000,
                });
                
                // Enable automatic language detection
                const detectedLang = await enableAutomaticLanguageDetection();
                setLanguage(detectedLang as Language);
                
                showMessage({
                  message: 'Automatic Language Enabled!',
                  description: `App will now follow your device language (currently ${detectedLang.toUpperCase()})`,
                  type: 'success',
                  duration: 3000,
                });
              } catch (error: any) {
                console.error('Error enabling automatic detection:', error);
                showMessage({
                  message: 'Failed to enable automatic detection',
                  description: error?.message || 'Could not detect device language',
                  type: 'danger',
                  duration: 3000,
                });
              }
            })();
          },
        },
      ]
    );
  };

  const renderLanguageItem = ({ item }: { item: LanguageItem }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === currentLanguage && styles.selectedLanguage,
      ]}
      onPress={() => handleSelectLanguage(item.code as Language)}
    >
      <View style={styles.languageInfo}>
        <Image
          source={{ uri: item.flagUrl }}
          style={styles.languageFlagImage}
          resizeMode="contain"
        />
        <Text
          style={[
            styles.languageName,
            item.code === currentLanguage && styles.selectedLanguageText,
          ]}
        >
          {item.name}
        </Text>
      </View>

      {item.code === currentLanguage && (
        <CheckCircle2 size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title={'Language Settings'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading languages...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title={'Language Settings'} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchLanguages}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={'Language Settings'} />

      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Choose your preferred language for the app interface
        </Text>
        
        {/* Refresh Button */}
        {/* <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshTranslations}
          disabled={refreshing}
        >
          <RefreshCw 
            size={20} 
            color={refreshing ? Colors.gray600 : Colors.primary} 
          />
          <Text style={[styles.refreshButtonText, refreshing && styles.refreshingText]}>
            {refreshing ? 'Refreshing...' : 'Update Translations'}
          </Text>
        </TouchableOpacity> */}
      </View>

      <FlatList
        data={languages}
        keyExtractor={(item) => item.code}
        renderItem={renderLanguageItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefreshTranslations}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            title="Pull to refresh translations"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No languages available</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.autoLanguageButton}
            onPress={handleUseDeviceLanguage}
          >
            <Smartphone size={20} color={Colors.primary} />
            <Text style={styles.autoLanguageButtonText}>
              📱 Follow Device Language Automatically
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

export { LanguageSettingsScreen };
