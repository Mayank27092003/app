/**
 * Bottom Tab Navigator
 */

import React from "react";
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const focusedIndex = state.index;

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity onPress={() => navigation.navigate(Routes.HomeScreen)}>
        <Home color={focusedIndex === 0 ? Colors.primary : "#fff"} size={28} />
      </TouchableOpacity>

      {/* Jobs */}
      <TouchableOpacity
        style={{ left: -20 }}
        onPress={() => navigation.navigate(Routes.JobsScreen)}
      >
        <Briefcase
          color={focusedIndex === 1 ? Colors.primary : "#fff"}
          size={28}
        />
      </TouchableOpacity>

      {/* FAB Center Action */}

      <TouchableOpacity
        onPress={() => navigation.navigate(Routes.TrackingScreen)}
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
        onPress={() => navigation.navigate(Routes.MessagesScreen)}
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
        onPress={() => navigation.navigate(Routes.ProfileScreen)}
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
  const unreadCount = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0
  );
  const { userRole } = useAuthStore();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      id={undefined}
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
      tabBar={CustomTabBar}
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
            <Feather name="briefcase" size={size} color={color} />
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
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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
          tabBarIcon: ({ color, size }: any) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export { BottomTab };
