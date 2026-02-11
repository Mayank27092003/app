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
} from "react-native"; // ✅ Added ImageBackground
import {
  ArrowLeft,
  Mail,
  Lock,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react-native";
import { useDispatch } from "react-redux";

import { Colors } from "@app/styles";
import { createLoader } from "@app/module/common";
import { Input } from "@app/components/Input";
import { Button } from "@app/components/Button";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./loginStyle";
import { forgotPassword, login } from "../slice";
import { useAuthStore } from "@app/store/authStore";
import { Routes } from "@app/navigator";
import { useTranslation } from "react-i18next";
const loader = createLoader();

function ForgetPassword({ navigation }: any) {
  const { t } = useTranslation();

  console.log(t("auth.login.title"), "translationnnn");
  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const { login: mockLogin } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleForgotPassword = () => {
    const normalizedEmail = email.toLowerCase().trim();
    const payload = {
      email: normalizedEmail,
      onSuccess: () => {
        // Navigate to OTP screen for password reset
        navigation.navigate(Routes.OTPScreen, {
          email: normalizedEmail,
          phone: normalizedEmail, // Using email as phone for demo
          purpose: 'password_reset'
        });
      },
      onError: (error: any) => {
        setError(error?.message || 'Failed to send reset email');
      }
    };

    dispatch(forgotPassword(payload));
  };

  return (
    <ImageBackground
      source={require("../../../assets/bg1.jpeg")} // ✅ Your image path here
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
                source={require("../../../assets/logisticLogo.jpeg")} // ✅ Your image path here
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>{t("auth.login.forgotPassword")}</Text>

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
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={20} color={Colors.gray400} />}
              />
            </View>

            <Button
              title={t("buttons.submit")}
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleForgotPassword}
              style={styles.loginButton}
            />

            {/* {demoHelperText()} */}

            {/* <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                {t("auth.login.noAccount")}{" "}
                <Text
                  style={styles.registerLink}
                  onPress={() => navigation.navigate(Routes.RoleSelectScreen)}
                >
                  {t("auth.login.register")}
                </Text>
              </Text>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

export { ForgetPassword };
