/**
 * Update Modal Component
 * Shows popup when app update is available
 * @format
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Download, X } from 'lucide-react-native';
import { Colors, useThemedStyle } from '@app/styles';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  latestVersion?: string;
  currentVersion?: string;
  forceUpdate?: boolean;
  releaseNotes?: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
  onUpdate,
  latestVersion,
  currentVersion,
  forceUpdate = false,
  releaseNotes,
}) => {
  const styles = useThemedStyle(getStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Download size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Update Available</Text>
            {!forceUpdate && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              A new version of the app is available. Please update to continue
              using the latest features and improvements.
            </Text>

            {latestVersion && currentVersion && (
              <View style={styles.versionContainer}>
                <Text style={styles.versionText}>
                  Current Version: <Text style={styles.versionValue}>{currentVersion}</Text>
                </Text>
                <Text style={styles.versionText}>
                  Latest Version: <Text style={styles.versionValue}>{latestVersion}</Text>
                </Text>
              </View>
            )}

            {releaseNotes && (
              <View style={styles.releaseNotesContainer}>
                <Text style={styles.releaseNotesTitle}>What's New:</Text>
                <Text style={styles.releaseNotesText}>{releaseNotes}</Text>
              </View>
            )}
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {!forceUpdate && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Later</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={onUpdate}
            >
              <Download size={20} color={Colors.white} />
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
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
      backgroundColor: Colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: Colors.white,
      flex: 1,
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
    message: {
      fontSize: 16,
      color: Colors.textSecondary,
      lineHeight: 24,
      marginBottom: 16,
    },
    versionContainer: {
      backgroundColor: Colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    versionText: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 4,
    },
    versionValue: {
      color: Colors.white,
      fontWeight: '600',
    },
    releaseNotesContainer: {
      marginTop: 8,
    },
    releaseNotesTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 8,
    },
    releaseNotesText: {
      fontSize: 14,
      color: Colors.textSecondary,
      lineHeight: 20,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    cancelButton: {
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    updateButton: {
      backgroundColor: Colors.primary,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.textSecondary,
    },
    updateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
    },
  });

