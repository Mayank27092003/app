import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { Truck, Users, Globe, Shield } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@app/styles";
import { Button } from "@app/components/Button";
import { LanguageSelector } from "@app/components/LanguageSelector";
import { useAuthStore } from "@app/store/authStore";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { Routes } from "@app/navigator";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

function WelcomeScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundLight, Colors.background]}
        style={styles.background}
      >
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1287&q=80",
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)", Colors.background]}
          style={styles.overlay}
        />

        <View style={styles.languageContainer}>
          <LanguageSelector />
        </View>
      </LinearGradient>

      <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logisticLogo.jpeg')} // ✅ Your image path here
              style={styles.logo}
              resizeMode="center"
            />
        {/* <View style={styles.logoCircle}>
          <Truck size={screenWidth * 0.15} color={Colors.primary} />
        </View> */}
        <Text style={styles.appName}>{t("welcome.appName")}</Text>
        <Text style={styles.tagline}>{t("welcome.tagline")}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.tagline}>{t("welcome.tagline")}</Text>
        <Text style={styles.welcomeText}>{t("welcome.description")}</Text>

        <View style={styles.featuresContainer}>
          {["findJobs", "connect", "multiLanguage", "securePayments"].map((key, index) => {
            const icons = [Truck, Users, Globe, Shield];
            const IconComponent = icons[index];
            return (
              <View key={key} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <IconComponent size={24} color={Colors.primary} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{t(`welcome.features.${key}.title`)}</Text>
                  <Text style={styles.featureDescription}>{t(`welcome.features.${key}.description`)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={t("welcome.signIn")}
          variant="primary"
          fullWidth
          style={styles.signInButton}
          onPress={() => navigation.navigate(Routes.LoginScreen)}
        />

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate(Routes.RoleSelectScreen)}
        >
          <Text style={styles.registerText}>
            {t("auth.login.noAccount")} <Text style={styles.registerTextBold}> {t("auth.login.register")}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export { WelcomeScreen };