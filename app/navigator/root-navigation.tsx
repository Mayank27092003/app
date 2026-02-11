/**
 * App navigator
 * @format
 */

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { StatusBar, View, Text } from "react-native";

import { FlashMessage, Loader } from "@app/global";
import { NavigationService } from "@app/helpers";
import { AppBootstrapGate } from "@app/module/app-bootstrap";
import { selectActiveSection } from "@app/module/common";
import { AppSection, Routes } from "./constants";

// Screen
import {
  ForgetPassword,
  LoginScreen,
  OTPScreen,
  RegisterScreen,
  RoleSelectScreen,
  ResetPasswordScreen,
} from "@app/module/auth";
import { Colors } from "@app/styles";
import { AppIntro, WelcomeScreen } from "@app/module/welcome";
import { TermsScreen } from "@app/module/settings";
import { hasSeenIntro } from "@app/utils/welcomeUtils";
import PrivacyPolicyScreen from "@app/module/settings/view/PrivacyPolicyScreen";
import AppNavigator from "./appNavigator";

const Stack = createNativeStackNavigator();

/**
 * Screens stack related to Auth section
 * @returns
 */

const AuthStack = () => {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIntroStatus = async () => {
      const hasSeen = await hasSeenIntro();
      setShowIntro(!hasSeen); // Show intro if user hasn't seen it
    };
    checkIntroStatus();
  }, []);

  // Show loading while checking intro status
  if (showIntro === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ color: Colors.white }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName={showIntro ? Routes.AppIntro : Routes.LoginScreen}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen component={AppIntro} name={Routes.AppIntro} />
      <Stack.Screen component={WelcomeScreen} name={Routes.WelcomeScreen} />

      <Stack.Screen component={LoginScreen} name={Routes.LoginScreen} />
      <Stack.Screen component={OTPScreen} name={Routes.OTPScreen} />
      <Stack.Screen component={ResetPasswordScreen} name={Routes.ResetPasswordScreen} />
      <Stack.Screen component={ForgetPassword} name={Routes.ForgetPassword} />

      <Stack.Screen component={RegisterScreen} name={Routes.RegisterScreen} />
      <Stack.Screen
        component={RoleSelectScreen}
        name={Routes.RoleSelectScreen}
      />
      <Stack.Screen name={Routes.TermsScreen} component={TermsScreen} />
      <Stack.Screen
        name={Routes.PrivacyPolicyScreen}
        component={PrivacyPolicyScreen}
      />
    </Stack.Navigator>
  );
};

// App Navigator
const Navigator = () => {
  const activeSection = useSelector(selectActiveSection);

  useEffect(() => {
    return () => {
      NavigationService.setNavigationReady(false);
    };
  }, []);

  console.log("🔍 Navigator - activeSection:", activeSection);

  const linking = {
    prefixes: [
      'gofrts://open',
      'GOFRTS://open',
      'https://gofrts.com',
      'https://*.gofrts.com',
    ],
    config: {
      screens: {
        CustomDrawer: {
          screens: {
            BottomTab: {
              screens: {
                ProfileScreen: {
                  path: 'profile',
                  parse: {
                    deepLink: (value: string) => value,
                    timestamp: Number,
                  },
                },
                HomeScreen: {
                  path: 'home',
                },
              },
            },
          },
        },
        CreateJobScreen: {
          path: 'createjob',
          parse: {
            paymentSuccess: (value: string) => value === 'true' || value === 'success',
            deepLink: (value: string) => value,
            timestamp: Number,
          },
        },
        JobDetailsScreen: {
          path: 'job/:jobId',
          parse: {
            jobId: (value: string) => Number.parseInt(value, 10),
            paymentSuccess: (value: string) => value === 'true' || value === 'success',
            deepLink: (value: string) => value,
            timestamp: Number,
          },
        },
        LoginScreen: 'login',
      },
    },
  } as const;

  return (
    <NavigationContainer
      linking={linking}
      onReady={() => {
        NavigationService.setNavigationReady(true);
      }}
      ref={NavigationService.navigationRef}
    >
      <AppBootstrapGate>
        <StatusBar
          backgroundColor={Colors.backgroundLight}
          barStyle="light-content"
        />
        {/* Fixed: Always show AuthStack when activeSection is null or not MainSection */}
        {activeSection === AppSection.MainSection ? <AppNavigator /> : <AuthStack />}
      </AppBootstrapGate>
      <FlashMessage />
      <Loader />
    </NavigationContainer>
  );
};

export { Navigator };
