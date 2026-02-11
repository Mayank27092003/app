/**
 * Socket Debug Styles
 * @format
 */

import { ScaledSheet } from 'react-native-size-matters';
import { Colors } from '@app/styles';

export const getStyles = () =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.text,
      marginBottom: 12,
    },
    statusCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: Colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: Colors.text,
      flex: 2,
      textAlign: 'right',
    },
    testResultCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    testResultText: {
      fontSize: 16,
      color: Colors.text,
      textAlign: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: Colors.primary,
    },
    secondaryButton: {
      backgroundColor: Colors.secondary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.white,
      marginLeft: 8,
    },
    logsContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      maxHeight: 200,
    },
    logText: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginBottom: 4,
      fontFamily: 'monospace',
    },
    emptyLogsText: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
