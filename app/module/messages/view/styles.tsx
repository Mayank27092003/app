/**
 * Message Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';
import { StyleSheet } from 'react-native';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background,
    },
    header: {
      paddingTop: '20@ms',
      paddingBottom: '20@ms',
      paddingHorizontal: '20@ms',
      backgroundColor: Colors.background,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20@ms',
    },
    headerTitle: {
      fontSize: '28@ms',
      fontWeight: 'bold',
      color: Colors.white,
    },
    headerActions: {
      flexDirection: 'row',
      gap: '16@ms',
    },
    headerButton: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '20@ms',
      gap: '12@ms',
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      paddingHorizontal: '16@ms',
      height: '44@ms',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchInput: {
      flex: 1,
      color: Colors.white,
      marginLeft: '12@ms',
      fontSize: '16@ms',
    },
    filterButton: {
      width: '44@ms',
      height: '44@ms',
      borderRadius: '12@ms',
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingHorizontal: '20@ms',
      // backgroundColor: 'red',
    },
    tab: {
      paddingVertical: '4@ms',
      paddingHorizontal: '20@ms',
      marginRight: '24@ms',
      position: 'relative',
    },
    activeTab: {
      borderBottomWidth: 3,
      borderBottomColor: Colors.primary,
    },
    tabText: {
      fontSize: '16@ms',
      fontWeight: '500',
      color: Colors.textSecondary,
    },
    activeTabText: {
      color: Colors.primary,
      fontWeight: '600',
    },
    conversationsList: {
      paddingVertical: '8@ms',
      paddingHorizontal: '20@ms',
      paddingBottom: '100@ms',
    },
    conversationItem: {
      flexDirection: 'row',
      paddingVertical: '12@ms',
      paddingRight: '16@ms',

      // borderBottomWidth: 1,
      // borderBottomColor: Colors.border,
    },
    pinnedConversation: {
      backgroundColor: Colors.backgroundLight + '30',
    },
    avatarContainer: {
      position: 'relative',
      marginRight: '16@ms',
    },
    avatar: {
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
    },
    avatarFallback: {
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.white,
    },
    unreadBadge: {
      position: 'absolute',
      top: '-5@ms',
      right: '-5@ms',
      backgroundColor: Colors.primary,
      borderRadius: '10@ms',
      minWidth: '20@ms',
      height: '20@ms',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: '4@ms',
    },
    unreadText: {
      color: Colors.white,
      fontSize: '10@ms',
      fontWeight: 'bold',
    },
    conversationContent: {
      flex: 1,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '4@ms',
    },
    conversationName: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.white,
      flex: 0.9,
    },
    conversationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaIcon: {
      marginRight: '4@ms',
    },
    timeText: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
    },
    messagePreviewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    messagePreview: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      flex: 1,
    },
    typingMessage: {
      color: Colors.primary,
    },
    unreadMessage: {
      color: Colors.white,
      fontWeight: '500',
    },
    messageStatus: {
      marginLeft: '4@ms',
    },
    jobTag: {
      backgroundColor: Colors.primary + '20',
      paddingHorizontal: '8@ms',
      paddingVertical: '2@ms',
      borderRadius: '4@ms',
      alignSelf: 'flex-start',
      marginTop: '6@ms',
    },
    jobTagText: {
      fontSize: '10@ms',
      color: Colors.primary,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: '40@ms',
      paddingVertical: '20@ms',
    },
    emptyTitle: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.white,
      marginTop: '16@ms',
      marginBottom: '8@ms',
      textAlign: 'center',
    },
    emptyText: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: '24@ms',
      lineHeight: '20@ms',
    },
    emptyButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: '24@ms',
      paddingVertical: '12@ms',
      borderRadius: '8@ms',
    },
    emptyButtonText: {
      color: Colors.white,
      fontWeight: '600',
      fontSize: '14@ms',
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    optionsContainer: {
      width: '80%',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: '16@ms',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    optionText: {
      fontSize: '16@ms',
      color: Colors.white,
      marginLeft: '16@ms',
    },
    deleteOption: {
      justifyContent: 'center',
    },
    deleteText: {
      color: Colors.error,
      marginLeft: 0,
    },
    conversationNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    onlineIndicator: {
      backgroundColor: '#4CAF50', // Green color for online
      position: 'absolute',
      right: '13@ms',
      bottom: 0, 
      height: '12@ms',
      width: '12@ms',
      borderRadius: '6@ms',
    },
    offlineIndicator: {
      // backgroundColor: '#9E9E9E', // Gray color for offline
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusLabel: {
      fontSize: '10@ms',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    onlineLabel: {
      color: '#4CAF50',
    },
    offlineLabel: {
      color: '#9E9E9E',
    },
  });
