/**
 * Driver Assignment Screen Styles
 * @format
 */

import { ScaledSheet } from 'react-native-size-matters';
import { Colors } from '@app/styles';

export const getStyles = () => {
  return ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    jobTitleContainer: {
      marginTop: 20,
      marginBottom: 10,
    },
    jobTitle: {
      fontSize: 16,
      color: Colors.textSecondary,
      fontWeight: '400',
    },
    currentAssignmentCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    currentAssignmentTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 15,
    },
    noDriverContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    noDriverText: {
      fontSize: 16,
      color: Colors.textSecondary,
      marginBottom: 5,
    },
    noDriverSubtext: {
      fontSize: 14,
      color: Colors.textMuted,
    },
    driverInfoContainer: {
      gap: 15,
    },
    driverProfileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    driverAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    driverInitial: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.white,
    },
    driverDetails: {
      flex: 1,
    },
    driverName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 4,
    },
    assignmentDetails: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 4,
    },
    driverInfo: {
      fontSize: 12,
      color: Colors.textMuted,
    },
    statusContainer: {
      alignItems: 'flex-end',
    },
    activeStatusBadge: {
      backgroundColor: Colors.success,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    activeStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: Colors.white,
    },
    mainContentArea: {
      flex: 1,
      minHeight: 200,
    },
    jobDetailsCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    jobDetailsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 15,
    },
    jobInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    jobInfoLabel: {
      fontSize: 14,
      color: Colors.textSecondary,
      flex: 1,
    },
    jobInfoValue: {
      fontSize: 14,
      color: Colors.white,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
    },
    bottomActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: 30,
      gap: 15,
      backgroundColor: Colors.background,
    },
    inviteDriverButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: Colors.backgroundCard,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 8,
    },
    inviteDriverText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
    },
    assignDriverButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: Colors.primary,
      gap: 8,
    },
    assignDriverText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
    },
    disabledButton: {
      backgroundColor: Colors.textMuted,
      opacity: 0.6,
    },
    // Assigned Drivers Styles
    assignedDriversCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    assignedDriversTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 15,
    },
    driverItem: {
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    driverItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    driverEmail: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    driverPhone: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    assignmentDate: {
      fontSize: 12,
      color: Colors.textMuted,
      marginTop: 4,
      fontStyle: 'italic',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    // Change Driver Button in Driver Items
    changeDriverButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: Colors.primary,
      shadowColor: Colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    changeDriverText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.white,
      marginLeft: 6,
    },
    removeDriverButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: Colors.error,
      shadowColor: Colors.error,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    removeDriverText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.white,
      marginLeft: 6,
    },
  });
};
