/**
 * Bottom Tab Navigator
 */

import React, { useCallback, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Home,
  Briefcase,
  MapPin,
  MessageCircle,
  User,
  Search,
  Bell,
  Feather,
} from "lucide-react-native";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import { ms, ScaledSheet } from "react-native-size-matters";

import { JobsScreen } from "@app/module/jobs";
import { TrackingScreen } from "@app/module/tracking";
import { MessagesScreen } from "@app/module/messages";
import { ProfileScreen } from "@app/module/profile";
import { useChatStore } from "@app/store/chatStore";
import { useAuthStore } from "@app/store/authStore";
import { Routes } from "./constants";
import { Colors } from "@app/styles";
import { HomeScreen } from "@app/module/home";
import { PaymentsScreen } from "@app/module/payments";
import { NotificationsScreen } from "@app/module/notification";
// import { Avatar } from '@app/components/Avatar';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectProfile } from "@app/module/common";
import { showMessage } from "react-native-flash-message";
import { httpRequest, endPoints } from "@app/service";
import { useFocusEffect } from "@react-navigation/native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export function CustomTabBar({ state, descriptors, navigation, isFullyVerified = true, userRole, t }: any) {
  const focusedIndex = state.index;

  // Handle tab navigation with verification check
  const handleTabPress = (routeName: string, routeKey: string) => {
    // Always allow navigation to Profile screen
    if (routeName === Routes.ProfileScreen) {
      navigation.navigate(routeName);
      return;
    }

    // Block navigation to other tabs if not verified
    if (!isFullyVerified && userRole !== 'driver') {
      showMessage({
        message: t("common.profileNotVerified"),
        description: t("common.profileNotVerifiedDescription"),
        type: "danger",
        icon: "warning",
        duration: 4000,
      });
      // Navigate to Profile screen instead
      navigation.navigate(Routes.ProfileScreen);
      return;
    }

    // Allow navigation if verified
    navigation.navigate(routeName);
  };

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity
        onPress={() => handleTabPress(Routes.HomeScreen, 'Home')}
      >
        <Home color={focusedIndex === 0 ? Colors.primary : "#fff"} size={28} />
      </TouchableOpacity>

      {/* Jobs */}
      <TouchableOpacity
        style={{ left: -20 }}
        onPress={() => handleTabPress(Routes.JobsScreen, 'Jobs')}
      >
        <Briefcase
          color={focusedIndex === 1 ? Colors.primary : "#fff"}
          size={28}
        />
      </TouchableOpacity>

      {/* FAB Center Action */}
      <TouchableOpacity
        onPress={() => handleTabPress(Routes.TrackingScreen, 'Tracking')}
        style={styles.fab}
      >
        <View style={styles.fabGlow}>
          <View style={styles.fabInner}>
            <MapPin color="#fff" size={28} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Messages */}
      <TouchableOpacity
        onPress={() => handleTabPress(Routes.MessagesScreen, 'Messages')}
        style={{ right: -20 }}
      >
        <MessageCircle
          color={focusedIndex === 3 ? Colors.primary : "#fff"}
          size={28}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>0</Text>
        </View>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        onPress={() => handleTabPress(Routes.ProfileScreen, 'Profile')}
      >
        <User color={focusedIndex === 4 ? Colors.primary : "#fff"} size={28} />
      </TouchableOpacity>
    </View>
  );
}
const styles = ScaledSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 40,
    marginHorizontal: 16,
    marginBottom: Platform.OS === "ios" ? '2@ms' : '16@ms',
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 24,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  fab: {
    position: "absolute",
    alignSelf: "center",
    bottom: ms(25),
    zIndex: 10,
    // Remove manual left offset!
    // left: ms(135),
    // Instead, use this to truly center:
    left: "45%",
    // transform: [{ translateX: -32 }], // Half of width (64/2)
  },
  fabGlow: {
    borderRadius: 50,

    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
    borderColor: Colors.background,
  },
  fabInner: {
    backgroundColor: Colors.primary, // use your brand color or orange here
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary, // glow color same as background
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10, // Android shadow
  },
  plus: {
    width: 32,
    height: 4,
    backgroundColor: "#fff",
    borderRadius: 2,
    position: "absolute",
  },
  bellContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

const BottomTab = () => {
  const conversations = useChatStore((state) => state.conversations);
  const messageUnreadCount = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0
  );
  const [notificationUnreadCount, setNotificationUnreadCount] = React.useState(0);
  // const { userRole } = useAuthStore();
  const { t } = useTranslation();

  // Get user profile from Redux store in parent component
  const userProfile = useSelector(selectProfile);
  console.log('userProfile', userProfile);
  const isFullyVerified = userProfile?.verification?.isFullyVerified === true;
  const userRole = userProfile?.roles?.[0]?.role?.name;

  // Fetch unread notification count from API
  const fetchUnreadNotificationCount = React.useCallback(async () => {
    try {
      const response: any = await httpRequest.get(endPoints.getUnreadNotificationCount);
      console.log('Unread notification count API response:', response);

      // Handle different response formats
      let count = 0;
      if (typeof response === 'number') {
        count = response;
      } else if (response?.count !== undefined) {
        count = response.count;
      } else if (response?.data?.count !== undefined) {
        count = response.data.count;
      } else if (response?.success && response?.data !== undefined) {
        count = typeof response.data === 'number' ? response.data : (response.data.count || 0);
      }

      setNotificationUnreadCount(count);
    } catch (error: any) {
      console.error('Error fetching unread notification count:', error);
      // Don't show error to user, just log it
    }
  }, []);

  // Fetch unread count when tab navigator is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadNotificationCount();
    }, [fetchUnreadNotificationCount])
  );

  // Create custom tab bar with verification status using useCallback
  const CustomTabBarWithVerification = useCallback(
    (props: any) => <CustomTabBar {...props} isFullyVerified={isFullyVerified} userRole={userRole} t={t} />,
    [isFullyVerified, userRole, t]
  );

  // Set initial route to Profile if not verified, otherwise default to Home
  const initialRouteName = isFullyVerified ? Routes.HomeScreen : Routes.ProfileScreen;
  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName={initialRouteName}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.backgroundLight,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: Colors.backgroundLight,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
          color: Colors.white,
        },
        headerTintColor: Colors.white,
        animation: "none",
        headerShown: false,
      }}
      tabBar={CustomTabBarWithVerification}
    >
      <Tab.Screen
        name={Routes.HomeScreen}
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: any) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.JobsScreen}
        component={JobsScreen}
        options={{
          title: userRole === "driver" ? "Find Jobs" : "My Jobs",
          tabBarIcon: ({ color, size }: any) => (
            <Briefcase size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name={Routes.TrackingScreen}
        component={TrackingScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={Routes.MessagesScreen}
        component={MessagesScreen}
        options={{
          tabBarBadge: messageUnreadCount > 0 ? messageUnreadCount : undefined,
          tabBarIcon: ({ color, size }: any) => (
            <MessageCircle size={size} color={color} />
          ),
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            fontSize: 10,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 16,
          },
        }}
      />
      <Tab.Screen
        name={Routes.ProfileScreen}
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => (
            <User size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name={Routes.PaymentScreen}
        component={PaymentsScreen}
        options={{
          tabBarIcon: ({ color, size }: any) => (
            <User size={size} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name={Routes.NotificationScreen}
        component={NotificationsScreen}
        options={{
          tabBarBadge: notificationUnreadCount > 0 ? notificationUnreadCount : undefined,
          tabBarIcon: ({ color, size }: any) => (
            <Bell size={size} color={color} />
          ),
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            fontSize: 10,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 16,
          },
        }}
      />
    </Tab.Navigator>
  );
};

export { BottomTab };
