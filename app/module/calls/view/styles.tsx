/**
 * Call Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet, Typography } from '@app/styles';
import { Platform } from 'react-native';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingTop: Platform.OS === 'ios' ? '60@ms' : '40@ms',
    },
    videoContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    },
    remoteVideo: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: Colors.black,
    },
    audioView: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      // Hidden but still plays audio - use height/width instead of opacity
      height: 1,
      width: 1,
      opacity: 0.01, // Very low opacity but not 0 to ensure audio playback
    },
    localVideo: {
      position: 'absolute',
      top: '100@ms',
      right: '20@ms',
      width: '120@ms',
      height: '160@ms',
      borderRadius: '8@ms',
      backgroundColor: Colors.black,
      borderWidth: 2,
      borderColor: Colors.white,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: '20@ms',
    },
    backButton: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    jobBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderRadius: '16@ms',
    },
    jobBadgeText: {
      color: Colors.white,
      fontWeight: '600',
      fontSize: '14@ms',
    },
    contactContainer: {
      alignItems: 'center',
      marginTop: '60@ms',
    },
    avatarContainer: {
      width: '120@ms',
      height: '120@ms',
      borderRadius: '60@ms',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '20@ms',
    },
    avatar: {
      width: '100@ms',
      height: '100@ms',
      borderRadius: '50@ms',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactName: {
      fontSize: '24@ms',
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: '8@ms',
    },
    callStatus: {
      fontSize: '16@ms',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '8@ms',
    },
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderRadius: '16@ms',
    },
    durationIcon: {
      marginRight: '6@ms',
    },
    duration: {
      fontSize: '16@ms',
      color: Colors.white,
      fontWeight: '600',
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: '60@ms',
    },
    actionButton: {
      width: '80@ms',
      height: '80@ms',
      borderRadius: '40@ms',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: '20@ms',
    },
    actionButtonActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    actionText: {
      color: Colors.white,
      marginTop: '8@ms',
      fontSize: '12@ms',
    },
    callButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: '60@ms',
    },
    callButton: {
      width: '70@ms',
      height: '70@ms',
      borderRadius: '35@ms',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: '20@ms',
    },
    answerButton: {
      backgroundColor: Colors.success,
    },
    declineButton: {
      backgroundColor: Colors.error,
    },
    endButton: {
      backgroundColor: Colors.error,
    },
    recordingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingHorizontal: '16@ms',
      paddingVertical: '12@ms',
      position: 'absolute',
      bottom: '40@ms',
      left: '20@ms',
      right: '20@ms',
      borderRadius: '8@ms',
    },
    recordingIndicator: {
      width: '8@ms',
      height: '8@ms',
      borderRadius: '4@ms',
      backgroundColor: Colors.error,
      marginRight: '8@ms',
    },
    recordingText: {
      color: Colors.white,
      fontSize: '12@ms',
      flex: 1,
    },

    // HistoryScreen
    listContent: {
      padding: '16@ms',
      paddingBottom: '40@ms',
    },
    callItem: {
      flexDirection: 'row',
      backgroundColor: Colors.white,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '12@ms',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    callIconContainer: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: Colors.gray100,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12@ms',
    },
    callInfo: {
      flex: 1,
    },
    callHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '4@ms',
    },
    callTimestamp: {
      fontSize: '12@ms',
      color: Colors.gray500,
    },
    callDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '8@ms',
    },
    callTypeContainer: {
      marginRight: '12@ms',
    },
    callType: {
      fontSize: '14@ms',
      color: Colors.gray600,
    },
    callDurationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: '12@ms',
    },
    callDuration: {
      fontSize: '14@ms',
      color: Colors.gray600,
    },
    recordingBadge: {
      backgroundColor: Colors.primary + '10',
      paddingHorizontal: '8@ms',
      paddingVertical: '2@ms',
      borderRadius: '4@ms',
    },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20@ms',
      marginTop: '40@ms',
    },
    emptyIcon: {
      marginBottom: '16@ms',
    },
    emptyTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '8@ms',
    },
    emptyText: {
      fontSize: '14@ms',
      color: Colors.gray600,
      textAlign: 'center',
      lineHeight: '20@ms',
    },
    connectingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20@ms',
    },
    connectingText: {
      fontSize: '16@ms',
      color: Colors.white,
      fontWeight: '500',
    },
  });
