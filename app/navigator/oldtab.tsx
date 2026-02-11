import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
    import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Briefcase, MapPin, MessageCircle, User } from 'lucide-react-native';

import { JobsScreen } from '@app/module/jobs';
import { TrackingScreen } from '@app/module/tracking';
import { MessagesScreen } from '@app/module/messages';
import { ProfileScreen } from '@app/module/profile';
import { useChatStore } from '@app/store/chatStore';
import { useAuthStore } from '@app/store/authStore';
import { Routes } from './constants';
import { Colors } from '@app/styles';
import { HomeScreen } from '@app/module/home';
import { PaymentsScreen } from '@app/module/payments';
import { NotificationsScreen } from '@app/module/notification';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BottomTab = () => {
  const conversations = useChatStore((state) => state.conversations);
  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  const { userRole } = useAuthStore();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.backgroundLight,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height:80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.backgroundLight,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: Colors.white,
        },
        headerTintColor: Colors.white,
        animation: 'none',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name={Routes.HomeScreen}
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: any) => (
            <Home size={size} color={color} />
          ),
        }}
      />
    <Tab.Screen
        name={Routes.JobsScreen}
        component={JobsScreen}
        options={{
          title: userRole === 'driver' ? 'Find Jobs' : 'My Jobs',
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