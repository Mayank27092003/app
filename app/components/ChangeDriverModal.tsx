/**
 * Change Driver Modal Component
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
import { X, AlertCircle, User, RefreshCw } from 'lucide-react-native';
import { Colors } from '@app/styles';
import { ScaledSheet } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

interface ChangeDriverModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  currentDriverName: string;
  newDriverName: string;
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
      fontWeight: 'bold',
      color: Colors.white,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    driverInfoContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    driverChangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    driverChangeRowLast: {
      marginBottom: 0,
    },
    driverIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary + '20',
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
    arrowContainer: {
      alignItems: 'center',
      marginVertical: 12,
    },
    arrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reasonLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 12,
    },
    reasonInput: {
      backgroundColor: Colors.backgroundCard,
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
      marginTop: 8,
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
      borderColor: Colors.primary,
      backgroundColor: 'transparent',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.primary,
      // marginLeft: 8,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    confirmButtonDisabled: {
      opacity: 0.6,
      backgroundColor: Colors.textMuted,


    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginLeft: 8,

    },
    loadingText: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginLeft: 8,
    },
  });
};

export const ChangeDriverModal: React.FC<ChangeDriverModalProps> = ({
  visible,
  onClose,
  onConfirm,
  currentDriverName,
  newDriverName,
  loading = false,
}) => {
  const { t } = useTranslation();
  const styles = getStyles();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  console.log('ChangeDriverModal props:', {
    visible,
    currentDriverName,
    newDriverName,
    loading
  });
  
  console.log('ChangeDriverModal currentDriverName value:', currentDriverName);
  console.log('ChangeDriverModal currentDriverName type:', typeof currentDriverName);
  console.log('ChangeDriverModal currentDriverName length:', currentDriverName?.length);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(t("common.provideReasonForChange"));
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("common.changeDriver")}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.driverInfoContainer}>
              <View style={styles.driverChangeRow}>
                <View style={styles.driverIcon}>
                  <User size={16} color={Colors.primary} />
                </View>
                <Text style={styles.driverName}>{currentDriverName || t("common.currentDriver")}</Text>
              </View>

              <View style={styles.arrowContainer}>
                <View style={styles.arrow}>
                  <RefreshCw size={16} color={Colors.white} />
                </View>
              </View>

              <View style={[styles.driverChangeRow, styles.driverChangeRowLast]}>
                <View style={styles.driverIcon}>
                  <User size={16} color={Colors.success} />
                </View>
                <Text style={styles.driverName}>{newDriverName}</Text>
              </View>
            </View>

            <Text style={styles.reasonLabel}>{t("common.reasonForChange")}</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder={t("common.provideReasonForChangePlaceholder")}
              placeholderTextColor={Colors.gray400}
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                if (error) setError('');
              }}
              multiline
              maxLength={500}
            />

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
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} color={Colors.white} />
                  <Text style={styles.loadingText}>{t("common.changing")}</Text>
                </>
              ) : (
                <>
                <RefreshCw size={16} color={Colors.white} />

                <Text style={styles.confirmButtonText}>{t("common.change")}</Text>
                </>
           )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
