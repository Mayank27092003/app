/**
 * LanguageSelector Screen
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Check, Globe } from 'lucide-react-native';
import i18n from '@app/language/i18n'; // ✅ Ensure correct path

//Screens
import { Colors, ScaledSheet } from '@app/styles';
import { languages } from '@app/constants/languages';
import { useAuthStore } from '@app/store/authStore';
import { useLanguageStore, Language } from '@app/store/languageStore';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = true,
}) => {
  // const languages = languages;
  const [modalVisible, setModalVisible] = useState(false);
  const { currentLanguage, setLanguage } = useLanguageStore();

  const { preferredLanguage, setPreferredLanguage } = useAuthStore();
  const currentLang = languages.find(lang => lang.code === currentLanguage);



  const handleLanguageSelect = (language: Language) => {
    console.log(language, 'languageeeee');
    setLanguage(language);
    i18n.changeLanguage(language); // ✅ Tell i18n to switch language
    setModalVisible(false);
  };
  const renderLanguageItem = ({ item }: { item: typeof languages[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === currentLanguage && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageSelect(item.code as Language)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={[
        styles.languageName,
        item.code === currentLanguage && styles.selectedLanguageName
      ]}>
        {item.name}
      </Text>
      {item.code === currentLanguage && (
        <Check size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );


  return (
    <>
      <TouchableOpacity
        style={[styles.selector, compact && styles.selectorCompact]}
        onPress={() => setModalVisible(true)}
      >
        <Globe
          size={compact ? 16 : 20}
          color={Colors.primary}
          style={styles.icon}
        />
        <Text style={styles.languageText}>{currentLang?.flag || ""}</Text>
      </TouchableOpacity>

      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={languages}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    item.code === preferredLanguage && styles.selectedLanguage,
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <Text style={styles.languageFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      item.code === preferredLanguage &&
                        styles.selectedLanguageText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.code === preferredLanguage && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal> */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={languages}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = ScaledSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: '12@ms',
    paddingVertical: '8@ms',
    borderRadius: '8@ms',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  selectorCompact: {
    padding: '8@ms',
  },
  icon: {
    marginRight: '8@ms',
  },
  languageText: {
    fontSize: '14@ms',
    color: Colors.black,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: '12@ms',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: Colors.gray700
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16@ms',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: '18@ms',
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    fontSize: '18@ms',
    color: Colors.gray500,
    padding: 4,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '16@ms',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  selectedLanguage: {
    backgroundColor: Colors.gray50,
  },
  languageFlag: {
    fontSize: '20@ms',
    marginRight: '12@ms',
  },
  languageName: {
    fontSize: '16@ms',
    color: Colors.text,
    flex: 1,
  },
  selectedLanguageText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  checkmark: {
    width: '24@ms',
    height: '24@ms',
    borderRadius: '12@ms',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },

  selectedLanguageName: {
    color: Colors.primary,
    fontWeight: '600',
  },
  languageList: {
    maxHeight: 400,
  },
  buttonText: {
    color: Colors.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedLanguageItem: {
    backgroundColor: Colors.primary + '20',
  },
});
