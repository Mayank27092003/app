// components/CustomHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Bell, Menu } from "lucide-react-native";
import { Colors } from "@app/styles";
import { ms } from "react-native-size-matters";
import { Routes } from "@app/navigator";
import { httpRequest, endPoints } from "@app/service";

type Props = {
  title: string;
};

const DrawerHeader: React.FC<Props> = ({ title }) => {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Fetch unread notification count from API
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response: any = await httpRequest.get(endPoints.getUnreadNotificationCount);
      console.log('DrawerHeader - Unread count API response:', response);
      
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
      
      setUnreadCount(count);
    } catch (error: any) {
      console.error('Error fetching unread count in DrawerHeader:', error);
      // Don't show error to user, just log it
    }
  }, []);

  // Fetch unread count when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Menu size={ms(30)} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(Routes.NotificationScreen);
        }}
        style={styles.bellContainer}
      >
        <Bell size={ms(30)} color={Colors.primary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ms(20),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    // backgroundColor: Colors.primary,
    // top:ms(10)
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
  },
  bellContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default DrawerHeader;
