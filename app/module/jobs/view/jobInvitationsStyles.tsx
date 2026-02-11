/**
 * Job Invitations Styles
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: Colors.backgroundCard,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: Colors.white,
      opacity: 0.8,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    invitationCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    companyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    companyLogo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    companyDetails: {
      flex: 1,
    },
    companyName: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 2,
    },
    invitationText: {
      fontSize: 14,
      color: Colors.gray400,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
    },
    jobDetails: {
      marginBottom: 16,
    },
    jobTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 8,
    },
    jobDescription: {
      fontSize: 14,
      color: Colors.white,
      lineHeight: 20,
      marginBottom: 12,
    },
    jobInfoRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    jobInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    jobInfoText: {
      fontSize: 14,
      color: Colors.white,
      marginLeft: 6,
      fontWeight: '500',
    },
    routeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    routeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    routeText: {
      fontSize: 14,
      color: Colors.white,
      marginLeft: 6,
    },
    routeArrow: {
      marginHorizontal: 8,
      transform: [{ rotate: '90deg' }],
    },
    messageContainer: {
      marginBottom: 12,
    },
    messageLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 4,
    },
    messageText: {
      fontSize: 14,
      color: Colors.white,
      lineHeight: 20,
    },
    datesContainer: {
      // flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateItem: {
      // marginTop: 10,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 12,
      color: Colors.gray400,
      marginLeft: 6,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      marginHorizontal: 4,
    },
    acceptButton: {
      backgroundColor: Colors.success,
    },
    declineButton: {
      backgroundColor: Colors.error,
    },
    acceptButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.white,
      marginLeft: 6,
    },
    declineButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.white,
      marginLeft: 6,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 16,
      color: Colors.gray400,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
