import React, { useState, useEffect } from "react";
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
  Mail,
  Lock,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";

import { Colors, useThemedStyle } from "@app/styles";
import { createLoader, selectLoader } from "@app/module/common";
import { Input } from "@app/components/Input";
import { Button } from "@app/components/Button";
import { SafeText } from "@app/components/SafeText";
import { getStyles } from "./loginStyle";
import { login, roles } from "../slice";
import { useAuthStore } from "@app/store/authStore";
import { Routes } from "@app/navigator";
import { useTranslation } from "react-i18next";
const loader = createLoader();

function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();

  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const { login: mockLogin } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const loading = useSelector(selectLoader);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t("auth.login.errors.fillFields"));

      return;
    }
    setError("");
    const payload = {
      email: email.toLowerCase().trim(),
      password: password,
    };

    // Call the actual login API - saga will handle loading state
    dispatch(login(payload));
  };
  // useEffect(() => {
  //   dispatch(roles());
  // }, [dispatch]);

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
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/logisticLogo.jpeg")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <SafeText style={styles.title}>{t("auth.login.title")}</SafeText>

            <SafeText style={styles.subtitle}>{t("auth.login.subtitle")}</SafeText>

            {error ? (
              <View style={styles.errorContainer}>
                <AlertCircle
                  size={18}
                  color={Colors.error}
                  style={styles.errorIcon}
                />
                <SafeText style={styles.errorText}>{error}</SafeText>
              </View>
            ) : null}

            <Input
              label={t("auth.login.email")}
              placeholder={t("auth.login.emailPlaceholder")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={Colors.gray400} />}
            />

            <Input
              label={t("auth.login.password")}
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Lock size={20} color={Colors.gray400} />}
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                {rememberMe ? (
                  <CheckSquare size={20} color={Colors.primary} />
                ) : (
                  <Square size={20} color={Colors.gray400} />
                )}
                <SafeText style={styles.rememberMeText}>
                  {t("auth.login.rememberMe")}
                </SafeText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate(Routes.ForgetPassword)}
                style={styles.forgotPasswordContainer}
              >
                <SafeText style={styles.forgotPasswordText}>
                  {t("auth.login.forgotPassword")}?
                </SafeText>
              </TouchableOpacity>
            </View>

            <Button
              title={t("auth.login.signIn")}
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            />

            <View style={styles.registerContainer}>
              <SafeText style={styles.registerText}>
                {t("auth.login.noAccount")}{" "}
                <SafeText
                  style={styles.registerLink}
                  onPress={() => navigation.navigate(Routes.RoleSelectScreen)}
                >
                  {t("auth.login.register")}
                </SafeText>
              </SafeText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

export { LoginScreen };
