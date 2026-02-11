/**
 * OTP Screen Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: '40@ms',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: '60@ms',
      paddingBottom: '20@ms',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.backgroundCard,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      color: Colors.white,
      fontWeight: '600',
    },
    placeholder: {
      width: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: '40@ms',
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: '30@ms',
    },
    title: {
      fontSize: 24,
      color: Colors.white,
      textAlign: 'center',
      marginBottom: '10@ms',
      fontWeight: '600',
    },
    subtitle: {
      fontSize: 16,
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: '40@ms',
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '30@ms',
      paddingHorizontal: '10@ms',
    },
    otpInput: {
      width: '50@ms',
      height: '60@ms',
      borderRadius: 12,
      backgroundColor: Colors.backgroundCard,
      borderWidth: 2,
      borderColor: Colors.border,
      fontSize: 24,
      fontWeight: '600',
      color: Colors.white,
      textAlign: 'center',
    },
    otpInputFilled: {
      borderColor: Colors.primary,
      backgroundColor: Colors.backgroundLight,
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: '20@ms',
    },
    timerText: {
      fontSize: 16,
      color: Colors.textSecondary,
    },
    resendButton: {
      alignItems: 'center',
      marginBottom: '30@ms',
    },
    resendButtonDisabled: {
      opacity: 0.5,
    },
    resendButtonText: {
      fontSize: 16,
      color: Colors.primary,
      fontWeight: '600',
    },
    resendButtonTextDisabled: {
      color: Colors.textSecondary,
    },
    verifyButton: {
      marginTop: '20@ms',
    },
  });
