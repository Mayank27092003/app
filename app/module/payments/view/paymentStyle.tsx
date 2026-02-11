/**
 * Payments Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    //AddPayments Screen Style
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    balanceCard: {
      padding: 20,
      paddingTop: 40,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    balanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    balanceLabel: {
      fontSize: 16,
      color: Colors.white,
      opacity: 0.8,
    },
    historyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
    },
    historyIcon: {
      marginRight: 4,
    },
    historyText: {
      color: Colors.white,
      fontSize: 12,
      fontWeight: '500',
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: 'bold',
      color: Colors.white,
      marginBottom: 8,
    },
    pendingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    pendingLabel: {
      fontSize: 14,
      color: Colors.white,
      opacity: 0.8,
    },
    pendingAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.white,
    },
    balanceActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 8,
    },
    balanceActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 140,
    },
    actionIcon: {
      marginRight: 8,
    },
    actionText: {
      color: Colors.white,
      fontWeight: '500',
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginTop: 20,
      marginBottom: 16,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTabButton: {
      borderBottomColor: Colors.primary,
    },
    tabButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.textSecondary,
    },
    activeTabButtonText: {
      color: Colors.white,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingTop: 0,
      paddingBottom: '100@ms',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.white,
    },
    seeAllText: {
      fontSize: 14,
      color: Colors.primary,
      fontWeight: '500',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    addButtonText: {
      color: Colors.white,
      fontWeight: '500',
      fontSize: 12,
      marginLeft: 4,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    transactionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.white,
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    transactionAmount: {
      alignItems: 'flex-end',
    },
    transactionAmountText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 4,
    },
    amountPositive: {
      color: Colors.success,
    },
    amountNegative: {
      color: Colors.error,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '500',
    },
    paymentMethodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    paymentMethodIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: Colors.backgroundLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardTypeIcon: {
      width: 32,
      height: 20,
      resizeMode: 'contain',
    },
    paymentMethodInfo: {
      flex: 1,
    },
    paymentMethodTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.white,
      marginBottom: 4,
    },
    paymentMethodSubtitle: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    defaultBadge: {
      backgroundColor: Colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginRight: 8,
    },
    defaultText: {
      fontSize: 10,
      fontWeight: '500',
      color: Colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      marginTop: 20,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.white,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateDescription: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyStateButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyStateButtonText: {
      color: Colors.white,
      fontWeight: '600',
    },
  });