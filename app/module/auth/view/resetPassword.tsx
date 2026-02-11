import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

// Components
import { Input } from "@app/components/Input";
import { Button } from "@app/components/Button";

// Styles
import { useThemedStyle, Colors } from "@app/styles";
import { getStyles } from "./resetPasswordStyle";

// Redux
import { resetPassword } from "../slice";
import { selectLoader } from "@app/module/common";

// Navigation
import { Routes } from "@app/navigator";

const ResetPasswordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const styles = useThemedStyle(getStyles);
  const loading = useSelector(selectLoader);

  // Get token from route params
  const { token } = (route?.params as any) || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = () => {
    // Validation
    if (!password.trim()) {
      setError(t("common.pleaseEnterPassword") || "Please enter a password");
      return;
    }

    if (password.length < 6) {
      setError(t("common.passwordMinLength") || "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError(t("common.passwordsDoNotMatch") || "Passwords do not match");
      return;
    }

    if (!token) {
      setError(t("common.invalidResetToken") || "Invalid reset token. Please try again.");
      return;
    }

    setError("");

    // Call reset password API
    dispatch(
      resetPassword({
        token,
        newPassword: password,
        onSuccess: (response: any) => {
          Alert.alert(
            t("common.passwordResetSuccessful") || "Password Reset Successful",
            t("common.passwordResetSuccessMessage") || "Your password has been reset successfully. You can now login with your new password.",
            [
              {
                text: t("common.ok"),
                onPress: () => navigation.navigate(Routes.LoginScreen as never),
              },
            ]
          );
        },
        onError: (error: any) => {
          setError(
            error?.message || t("common.failedToResetPassword") || "Failed to reset password. Please try again."
          );
        },
      })
    );
  };

  return (
    <ImageBackground
      source={require("../../../assets/bg1.jpeg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/logisticLogo.jpeg")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>{t("common.resetPassword") || "Reset Password"}</Text>
            <Text style={styles.subtitle}>{t("common.enterNewPasswordBelow") || "Enter your new password below"}</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <AlertCircle
                  size={18}
                  color={Colors.error}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginVertical: 40 }}>
              {/* <Input
                label="New Password"
                placeholder="Enter your new password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={20} color={Colors.gray400} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color={Colors.gray400} />
                    ) : (
                      <Eye size={20} color={Colors.gray400} />
                    )}
                  </TouchableOpacity>
                }
              /> */}
                   <Input
                label={t("common.newPassword") || "New Password"}
                placeholder={t("common.enterNewPassword") || "Enter your new password"}
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={<Lock size={20} color={Colors.gray400} />}
              />
              <Input
                label={t("common.confirmPassword") || "Confirm Password"}
                placeholder={t("common.confirmNewPassword") || "Confirm your new password"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                leftIcon={<Lock size={20} color={Colors.gray400} />}
              />
              {/* <Input
                label="Confirm Password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                leftIcon={<Lock size={20} color={Colors.gray400} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={Colors.gray400} />
                    ) : (
                      <Eye size={20} color={Colors.gray400} />
                    )}
                  </TouchableOpacity>
                }
                style={{ marginTop: 20 }}
              /> */}
            </View>

            <Button
              title={t("common.resetPassword") || "Reset Password"}
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleResetPassword}
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ResetPasswordScreen;
