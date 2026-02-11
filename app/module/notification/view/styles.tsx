/**
 * Notification Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent:'flex-end',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: Colors.background  ,
      // borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.white,
    },
    badgeContainer: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: 8,
    },
    badgeText: {
      color: Colors.black,
      fontSize: 12,
      fontWeight: '600',
    },
    markAllText: {
      color: Colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    listContent: {
      padding: 16,
      paddingBottom: '100@ms',
    },
    notificationItem: {
      flexDirection: 'row',
      backgroundColor: Colors.backgroundCard,
      alignItems: 'center',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    notificationTouchable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationUnread: {
      borderLeftWidth: 4,
      borderLeftColor: Colors.primary,
    },
    notificationRead: {
      opacity: 0.8,
    },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary + '10',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.text,
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    notificationTime: {
      fontSize: 12,
      color: Colors.gray500,
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.primary,
      marginLeft: 8,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      marginTop: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: Colors.gray600,
      textAlign: 'center',
      lineHeight: 20,
    },
    headerBack: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: '20@ms',
      paddingTop: '20@ms',
      paddingBottom: '5@ms',
      // backgroundColor: Colors.backgroundLight,
    },
    backButton: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
    },
    filterButton: {
      width: '40@ms',
      height: '40@ms',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: Colors.textSecondary,
    },
    footerLoader: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    topLoader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,

    },
    topLoaderText: {
      marginLeft: 12,
      fontSize: 14,
      color: Colors.text,
      fontWeight: '500',
    },
  });
