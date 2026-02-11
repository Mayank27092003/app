/**
 * Delete Account Modal Component
 * Shows modal to confirm account deletion with password
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { X, AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import { Colors, useThemedStyle } from '@app/styles';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  loading?: boolean;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError(t("common.pleaseEnterPassword"));
      return;
    }

    setError('');
    try {
      await onConfirm(password);
      // Reset form on success
      setPassword('');
      setError('');
    } catch (err) {
      // Error handling is done in parent component
      console.error('Delete account error:', err);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
  
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={32} color={Colors.error} />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{t("common.deleteAccount")}</Text>
            <Text style={styles.warningText}>
              {t("common.deleteAccountWarning")}
            </Text>

            <Text style={styles.message}>
              {t("common.enterPasswordToConfirm")}
            </Text>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder={t("common.enterPassword")}
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <Button
              title={t("common.deleteAccount")}
              variant="primary"
              onPress={handleConfirm}
              loading={loading}
              style={[styles.button, styles.deleteButton]}
              textStyle={styles.deleteButtonText}
            />
          </View>
        </View>
       
      </View>
     
    </Modal>
  );
};

const getStyles = () =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      paddingBottom: 16,
      position: 'relative',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: Colors.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 4,
    },
    content: {
      padding: 20,
      paddingTop: 0,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: Colors.white,
      textAlign: 'center',
      marginBottom: 16,
    },
    warningText: {
      fontSize: 15,
      color: Colors.error,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
      paddingHorizontal: 10,
    },
    message: {
      fontSize: 15,
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 22,
    },
    inputContainer: {
      position: 'relative',
      marginBottom: 8,
    },
    input: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingRight: 50,
      paddingVertical: 14,
      fontSize: 16,
      color: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    inputError: {
      borderColor: Colors.error,
    },
    eyeButton: {
      position: 'absolute',
      right: 16,
      top: 14,
      padding: 4,
    },
    errorText: {
      fontSize: 14,
      color: Colors.error,
      marginTop: 4,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      paddingTop: 0,
      gap: 12,
    },
    button: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    deleteButton: {
      backgroundColor: Colors.error,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.textSecondary,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
    },
  });

