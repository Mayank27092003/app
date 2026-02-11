/**
 * Remove Driver Modal Component
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, AlertCircle, Trash2 } from 'lucide-react-native';
import { Colors } from '@app/styles';
import { ScaledSheet } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

interface RemoveDriverModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  driverName: string;
  loading?: boolean;
}

const getStyles = () => {
  return ScaledSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 20,
      width: '100%',
      maxWidth: 400,
      maxHeight: '85%',
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.white,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 20,
    },
    driverInfoContainer: {
      backgroundColor: Colors.background,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
    },
    driverIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    driverName: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.white,
      flex: 1,
    },
    reasonLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 12,
    },
    reasonInput: {
      backgroundColor: Colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 20,
      fontSize: 16,
      color: Colors.white,
      textAlignVertical: 'top',
      minHeight: 120,
    },
    reasonPlaceholder: {
      color: Colors.white,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    errorText: {
      fontSize: 14,
      color: Colors.error,
      marginLeft: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 24,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: Colors.border,
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.textSecondary,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: Colors.error,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    confirmButtonDisabled: {
      backgroundColor: Colors.textMuted,
      opacity: 0.6,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginLeft: 8,
    },
  });
};

export const RemoveDriverModal: React.FC<RemoveDriverModalProps> = ({
  visible,
  onClose,
  onConfirm,
  driverName,
  loading = false,
}) => {
  const { t } = useTranslation();
  const styles = getStyles();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(t("common.provideReasonForRemove"));
      return;
    }

    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
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
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("common.removeDriver")}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
            >
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Driver Info */}
            <View style={styles.driverInfoContainer}>
              <View style={styles.driverIcon}>
                <Trash2 size={20} color={Colors.error} />
              </View>
              <Text style={styles.driverName}>{driverName}</Text>
            </View>

            {/* Reason Input */}
            <Text style={styles.reasonLabel}>{t("common.reasonForChange")}</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder={t("common.provideReasonForRemovePlaceholder")}
              placeholderTextColor={Colors.gray400}
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                if (error) setError('');
              }}
              multiline
              numberOfLines={4}
            />

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                loading && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <Text style={styles.confirmButtonText}>{t("common.removing")}</Text>
              ) : (
                <>
                  <Trash2 size={16} color={Colors.white} />
                  <Text style={styles.confirmButtonText}>{t("common.removeDriver")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
