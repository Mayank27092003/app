/**
 * ReshareJob Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet, Typography } from '@app/styles';
import { Platform } from 'react-native';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    //Create Screen Styles
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: '20@ms',
      paddingBottom: '40@vs',
    },
    title: {
      fontSize: '24@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '20@vs',
    },
    section: {
      marginBottom: '24@vs',
    },
    sectionTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '16@vs',
    },
    sectionDescription: {
      fontSize: '14@ms',
      color: Colors.gray600,
      marginBottom: '16@vs',
    },
    label: {
      fontSize: '14@ms',
      fontWeight: '500',
      marginBottom: '6@vs',
      color: Colors.text,
    },
    autoFillNote: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: '12@vs',
      marginTop: '-8@vs',
    },
    inputContainer: {
      flex: 1,
    },
    inputLabel: {
      fontSize: '14@ms',
      fontWeight: '500',
      marginBottom: '6@vs',
      color: Colors.text,
    },
    textAreaContainer: {
      marginBottom: '16@vs',
    },
    textArea: {
      borderWidth: 1,
      borderRadius: '8@ms',
      padding: '12@ms',
      fontSize: '16@ms',
      color: Colors.text,
      backgroundColor: Colors.backgroundCard,
      minHeight: '100@vs',
    },
    rowInputs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: '8@ms',
    },
    rowInput: {
      flex: 1,
    },
    dateInput: {
      flex: 1,
    },
    timeInput: {
      flex: 1,
    },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24@vs',
    },
    advancedToggleText: {
      fontSize: '16@ms',
      fontWeight: '500',
      color: Colors.primary,
      marginLeft: '8@ms',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.gray300,
      borderRadius: '8@ms',
      padding: '12@ms',
      backgroundColor: Colors.backgroundCard,
      marginTop: '6@vs',
    },
    dateButtonText: {
      fontSize: '16@ms',
      color: Colors.text,
      marginLeft: '8@ms',
    },
    footer: {
      padding: '20@ms',
      backgroundColor: Colors.background,
      borderTopWidth: 1,
      borderTopColor: Colors.gray200,
    },
    // Reshare specific styles
    reshareInfo: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '20@ms',
      marginBottom: '24@vs',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    reshareIcon: {
      width: '32@ms',
      height: '32@ms',
      borderRadius: '16@ms',
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12@ms',
    },
    reshareTitle: {
      fontSize: '18@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '4@vs',
      flex: 1,
    },
    reshareDescription: {
      fontSize: '14@ms',
      color: Colors.gray600,
      lineHeight: '20@ms',
      flex: 1,
    },
    // Disabled input styles
    disabledInput: {
      // backgroundColor: Colors.gray100,
      borderColor: Colors.gray200,
      opacity: 0.7,
      color: Colors.gray300,
      // gap: '8@ms',

      // minHeight: '100@vs',

    },
    disabledText: {
      color: Colors.gray300,
    },
    // Editable input styles
    editableInput: {
      backgroundColor: Colors.backgroundCard,
      borderColor: Colors.primary,
      color: Colors.text,
    },
    // MultiSelect disabled styles
    disabledMultiSelect: {
      opacity: 0.7,
    },
    // Address dropdown disabled styles
    disabledAddressDropdown: {
      opacity: 0.7,
    },
    // Loading styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
    },
    loadingText: {
      fontSize: '16@ms',
      color: Colors.gray600,
      textAlign: 'center',
    },
  });
