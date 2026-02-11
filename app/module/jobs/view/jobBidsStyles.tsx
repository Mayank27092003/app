/**
 * Job Bids Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet, Typography } from '@app/styles';
import { Platform } from 'react-native';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      color: Colors.textSecondary,
      marginBottom: 20,
    },
    
    // Job Header
    jobHeader: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    jobTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors.primary,
      marginBottom: 8,
    },
    jobRoute: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    jobRouteText: {
      fontSize: 16,
      color: Colors.textSecondary,
      marginLeft: 6,
    },
    jobRateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    originalRateLabel: {
      fontSize: 16,
      color: Colors.textSecondary,
      marginRight: 8,
    },
    originalRateAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.success,
    },
    bidCount: {
      fontSize: 14,
      color: Colors.textMuted,
    },

    // Filter Tabs
    filterContainer: {
      marginBottom: 20,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: Colors.gray800,
    },
    filterTabActive: {
      backgroundColor: Colors.primary,
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.textSecondary,
    },
    filterTabTextActive: {
      color: Colors.white,
    },

    // Bids List
    bidsList: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: Colors.textSecondary,
      textAlign: 'center',
    },

    // Bid Card
    bidCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    bidCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    bidCardHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    bidCompanyName: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.primary,
      marginRight: 8,
    },
    bidRoleTag: {
      backgroundColor: Colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    bidRoleText: {
      fontSize: 10,
      fontWeight: '600',
      color: Colors.primary,
    },
    bidCardHeaderRight: {
      alignItems: 'flex-end',
    },
    bidRating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    bidRatingText: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginLeft: 4,
    },
    bidStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    bidStatusText: {
      fontSize: 10,
      fontWeight: '500',
      marginLeft: 4,
    },

    // Bid Amount
    bidAmountContainer: {
      marginBottom: 12,
    },
    bidAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors.success,
      marginBottom: 4,
    },
    bidDifference: {
      fontSize: 14,
      color: Colors.textSecondary,
    },

    // Bid Details
    bidDetails: {
      marginBottom: 12,
    },
    bidDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    bidDetailText: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginLeft: 8,
      flex: 1,
    },

    // Bid Footer
    bidFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bidDate: {
      fontSize: 12,
      color: Colors.textMuted,
      flex: 1,
    },
    bidActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rejectButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 6,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.error,
    },
    rejectButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.error,
    },
    acceptButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: Colors.primary,
    },
    acceptButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.white,
    },
  });
