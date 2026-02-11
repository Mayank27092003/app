/**
 * Notification Screen
 * @format
 */

import * as React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import {
  Bell,
  CheckCircle,
  Info,
  Truck,
  DollarSign,
  ArrowLeft,
  Trash2,
} from "lucide-react-native";

//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { httpRequest, endPoints } from "@app/service";
import { showMessage } from "react-native-flash-message";
import { NotificationSkeleton } from "@app/components/SkeletonLoader";

// Notification type based on API response
interface Notification {
  id: string | number;
  type?: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  createdAt?: string;
  [key: string]: any; // Allow additional fields from API
}

function NotificationsScreen() {
  const { t } = useTranslation();

  const styles = useThemedStyle(getStyles);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const navigation = useNavigation();
  const limit = 50;

  // Fetch unread notification count from API
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response: any = await httpRequest.get(endPoints.getUnreadNotificationCount);
      console.log('Unread count API response:', response);
      
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
      console.error('Error fetching unread count:', error);
      // Don't show error to user, just log it
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = React.useCallback(async (reset: boolean = false) => {
    const currentOffset = reset ? 0 : offset;
    
    try {
      if (reset) {
        setOffset(0);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      const response: any = await httpRequest.get(
        endPoints.getNotifications(limit, currentOffset, unreadOnly)
      );

      console.log('Notifications API response:', response);

      // Handle different response formats
      let notificationsData: Notification[] = [];
      
      if (response?.success && response?.data) {
        // Response format: { success: true, data: [...] }
        notificationsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        // Response format: [...]
        notificationsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        // Response format: { data: [...] }
        notificationsData = response.data;
      }

      // Transform API data to match our notification structure
      const transformedNotifications = notificationsData.map((notif: any) => ({
        id: notif.id || notif.notificationId || `notif_${Date.now()}_${Math.random()}`,
        type: notif.type || notif.notificationType || 'system',
        title: notif.title || notif.subject || 'Notification',
        message: notif.message || notif.body || notif.content || '',
        read: notif.read || notif.isRead || false,
        timestamp: notif.timestamp || notif.createdAt || notif.created_at || new Date().toISOString(),
        ...notif, // Include any additional fields
      }));

      if (reset) {
        setNotifications(transformedNotifications);
        setHasMore(transformedNotifications.length === limit);
        setOffset(transformedNotifications.length);
      } else {
        setNotifications((prev) => [...prev, ...transformedNotifications]);
        setHasMore(transformedNotifications.length === limit);
        setOffset((prev) => prev + transformedNotifications.length);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      showMessage({
        message: t("common.error"),
        description: error?.message || t("common.failedToLoadNotifications"),
        type: 'danger',
        duration: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offset, limit, unreadOnly]);

  // Fetch notifications on mount and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Set loading state for initial load
      setLoading(true);
      fetchNotifications(true);
      fetchUnreadCount(); // Also fetch unread count
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unreadOnly])
  );

  // Load more notifications (pagination)
  const loadMore = () => {
    if (!loading && hasMore && !refreshing) {
      fetchNotifications(false);
    }
  };

  // Refresh notifications
  const onRefresh = React.useCallback(() => {
    console.log('🔄 onRefresh called');
    setRefreshing(true);
    console.log('🔄 Set refreshing to true');
    
    // Use setTimeout to ensure state update is processed
    setTimeout(() => {
      fetchNotifications(true).then(() => {
        fetchUnreadCount();
      }).catch((error) => {
        console.error('Error in onRefresh:', error);
        setRefreshing(false);
      });
    }, 100);
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = async (id: string | number) => {
    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Call API to mark notification as read
    try {
      const response: any = await httpRequest.patch(endPoints.markNotificationAsRead(id));
      
      if (response?.success === false) {
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, read: false } : notification
          )
        );
        showMessage({
          message: t("common.error"),
          description: response?.message || t("common.failedToMarkAsRead"),
          type: 'danger',
          duration: 2000,
        });
      } else {
        console.log('Notification marked as read successfully:', id);
        // State already updated optimistically
        // Refresh unread count after marking as read
        fetchUnreadCount();
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: false } : notification
        )
      );
      showMessage({
        message: t("common.error"),
        description: error?.message || t("common.failedToMarkAsReadRetry"),
        type: 'danger',
        duration: 2000,
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
    // TODO: Call API to mark all notifications as read
  };

  const deleteNotification = async (id: string | number) => {
    try {
      // Optimistically remove from UI
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));

      // Call API to delete notification
      const response: any = await httpRequest.delete(endPoints.deleteNotification(id));
      
      if (response?.success === false) {
        // Revert optimistic update on error
        if (deletedNotification) {
          setNotifications((prev) => [...prev, deletedNotification].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ));
        }
        showMessage({
          message: t("common.error"),
          description: response?.message || t("common.failedToDeleteNotification"),
          type: 'danger',
          duration: 2000,
        });
      } else {
        console.log('Notification deleted successfully:', id);
        
        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        showMessage({
          message: t("common.success"),
          description: t("common.notificationDeleted"),
          type: 'success',
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      // Revert optimistic update on error
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification) {
        setNotifications((prev) => [...prev, deletedNotification].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
      showMessage({
        message: t("common.error"),
        description: error?.message || t("common.failedToDeleteNotificationRetry"),
        type: 'danger',
        duration: 2000,
      });
    }
  };

  const confirmDelete = (id: string | number) => {
    // Show confirmation dialog
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    Alert.alert(
      t("common.deleteNotification") || "Delete Notification",
      t("common.deleteNotificationConfirm") || "Are you sure you want to delete this notification?",
      [
        {
          text: t("common.cancel") || "Cancel",
          style: "cancel"
        },
        {
          text: t("common.delete") || "Delete",
          style: "destructive",
          onPress: () => {
            void deleteNotification(id);
          }
        }
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return t("common.recently");
      }
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) {
        return t("common.justNow");
      } else if (diffMins < 60) {
        return diffMins === 1 
          ? t("common.minutesAgo", { count: diffMins })
          : t("common.minutesAgoPlural", { count: diffMins });
      } else if (diffHours < 24) {
        return diffHours === 1
          ? t("common.hoursAgo", { count: diffHours })
          : t("common.hoursAgoPlural", { count: diffHours });
      } else if (diffDays < 7) {
        return diffDays === 1
          ? t("common.daysAgo", { count: diffDays })
          : t("common.daysAgoPlural", { count: diffDays });
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch (e) {
      return t("common.recently");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_assigned":
      case "job_completed":
      case "new_job":
        return <Truck size={24} stroke={Colors.primary} />;
      case "payment_received":
        return <DollarSign size={24} stroke={Colors.success} />;
      case "document_verified":
        return <CheckCircle size={24} stroke={Colors.success} />;
      case "system":
        return <Info size={24} stroke={Colors.warning} />;
      default:
        return <Bell size={24} stroke={Colors.primary} />;
    }
  };

  const renderNotificationItem = ({
    item,
  }: {
    item: Notification;
  }) => (
    <View
      style={[
        styles.notificationItem,
        item.read ? styles.notificationRead : styles.notificationUnread,
      ]}
    >
      <TouchableOpacity
        style={styles.notificationTouchable}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.notificationIcon}>
          {getNotificationIcon(item.type)}
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>

        {!item.read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Bell size={40} stroke={Colors.gray400} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{t("common.noNotifications")}</Text>
      <Text style={styles.emptyText}>
        {t("common.noNotificationsDescription")}
      </Text>
    </View>
  );

  // Use API unread count, but also calculate from local notifications as fallback
  const localUnreadCount = notifications.filter((n) => !n.read).length;
  const displayUnreadCount = unreadCount > 0 ? unreadCount : localUnreadCount;

  return (
    <View style={styles.container}>
      <View style={styles.headerBack}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t("navigation.notification")}</Text>
          {displayUnreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{displayUnreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[styles.filterButton]}></TouchableOpacity>
      </View>
      {/* {unreadCount > 0 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {loading && !refreshing && notifications.length === 0 ? (
        <NotificationSkeleton count={6} />
      ) : (
        <View style={{ flex: 1 }}>
          {refreshing && (
            <View style={styles.topLoader}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.topLoaderText}>{t("common.refreshing")}</Text>
            </View>
          )}
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderNotificationItem}
            contentContainerStyle={[
              styles.listContent,
              notifications.length === 0 && { flexGrow: 1, minHeight: '100%' },
              refreshing && { paddingTop: 60 }
            ]}
            style={{ flex: 1 }}
            ListEmptyComponent={refreshing ? null : renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
                progressBackgroundColor={Colors.backgroundCard}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={true}
            bounces={true}
            scrollEnabled={true}
            // ListFooterComponent={
            //   loading && notifications.length > 0 && !refreshing ? (
            //     <View style={styles.footerLoader}>
            //       <ActivityIndicator size="small" color={Colors.primary} />
            //     </View>
            //   ) : null
            // }
          />
        </View>
      )}
    </View>
  );
}

export { NotificationsScreen };
