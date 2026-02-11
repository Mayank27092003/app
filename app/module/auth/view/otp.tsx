import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@app/components/Button';
import { SafeText } from '@app/components/SafeText';
import { Routes } from '../../../navigator';
import { useThemedStyle } from '@app/styles';
import { getStyles } from './otpStyle';
import { Colors } from '@app/styles';
import { showMessage } from 'react-native-flash-message';
import { verifyOTP, resendOTP } from '../slice';
import { selectLoader } from '@app/module/common';
import Header from '@app/components/Header';

function OTPScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60); // 60 seconds timer
  const [canResend, setCanResend] = useState(false);

  const loading = useSelector(selectLoader);

  const inputRefs = useRef<TextInput[]>([]);

  // Get email/phone, purpose, and source from route params
  const { email, phone, purpose, source } = route?.params as any || {};

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus next input
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      Alert.alert(t('common.error'), t('common.enterAll6Digits') || 'Please enter all 6 digits');
      return;
    }

    // Call the actual OTP verification API with purpose and source from route params
    dispatch(verifyOTP({
      email: email || phone,
      otp: otpString,
      purpose: purpose || 'email_verification',
      source: source,
      onSuccess: (response: any) => {
        if (purpose === 'password_reset') {
          // For password reset, navigate to reset password screen with token
          const token = response?.resetToken || response?.token || response?.data?.token;
          if (token) {
            (navigation as any).navigate(Routes.ResetPasswordScreen, { token });
          } else {
            Alert.alert(
              t('common.error'),
              t('common.failedToGetResetToken') || 'Failed to get reset token. Please try again.',
              [{ text: t('common.ok') }]
            );
          }
        } else {
          // Handle different sources for email verification
          if (source === 'signup') {
            // From signup: navigate to login screen
            showMessage({
              message: t("common.emailVerifiedSuccess") || "Email Verified Successfully",
              description: t("common.emailVerifiedDesc") || "Your email has been verified. Please login to continue.",
              type: "success",
              duration: 3000,
            });
            (navigation as any).navigate(Routes.LoginScreen);
          } else {
            // From login or other sources: let saga handle navigation (auto-login)
            showMessage({
              message: "Email Verified Successfully",
              description: "Your email has been verified.",
              type: "success",
              duration: 3000,
            });
            // Don't navigate here - let the saga handle it
          }
        }
      },
      onError: (error: any) => {
        Alert.alert(t('common.error'), error?.message || t('auth.otpVerificationFailed'));
      }
    }));
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setCanResend(false);
    setTimer(60);
    setOtp(['', '', '', '', '', '']);

    // Call the actual resend OTP API with purpose from route params
    dispatch(resendOTP({
      email: email || phone,
      purpose: purpose || 'email_verification'
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.verifyOTP')}</Text>
        <View style={styles.placeholder} />
      </View> */}
      <Header title={t('auth.verifyOTP')} />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Clock size={64} color={Colors.primary} />
          </View>

          <SafeText style={styles.title}>{t('auth.enterOTP')}</SafeText>
          <SafeText style={styles.subtitle}>
            {purpose === 'password_reset'
              ? `We've sent a verification code to ${email || phone} for password reset`
              : `${t('auth.otpSentTo')} ${email || phone}`
            }
          </SafeText>

          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <SafeText style={styles.timerText}>
              {t('auth.resendIn')} {formatTime(timer)}
            </SafeText>
          </View>

          {/* Resend Button */}
          <TouchableOpacity
            style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled,
            ]}
            onPress={handleResendOTP}
            disabled={!canResend || loading}
          >
            <SafeText
              style={[
                styles.resendButtonText,
                !canResend && styles.resendButtonTextDisabled,
              ]}
            >
              {t('auth.resendOTP')}
            </SafeText>
          </TouchableOpacity>

          {/* Verify Button */}
          <Button
            title={t('auth.verifyOTP')}
            variant="primary"
            onPress={handleVerifyOTP}
            loading={loading}
            disabled={otp.join('').length !== 6}
            style={styles.verifyButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export { OTPScreen };
