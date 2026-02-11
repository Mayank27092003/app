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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: '20@ms',
      paddingTop: '60@ms',
      paddingBottom: '20@ms',
      backgroundColor: Colors.backgroundLight,
    },
    backButton: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.white,
    },
    headerRight: {
      width: '40@ms',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: '20@ms',
      paddingBottom: '40@ms',
    },
    methodSelector: {
      flexDirection: 'row',
      marginBottom: '24@ms',
      gap: '12@ms',
    },
    methodOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '16@ms',
      borderWidth: 1,
      borderColor: Colors.border,
      gap: '8@ms',
    },
    selectedMethodOption: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primary + '10',
    },
    methodOptionText: {
      fontSize: '14@ms',
      fontWeight: '500',
      color: Colors.textSecondary,
    },
    selectedMethodOptionText: {
      color: Colors.primary,
    },
    formContainer: {
      marginBottom: '24@ms',
    },
    rowInputs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: '12@ms',
    },
    halfInput: {
      flex: 1,
    },
    inputLabel: {
      fontSize: '14@ms',
      fontWeight: '500',
      color: Colors.white,
      marginBottom: '8@ms',
    },
    accountTypeSelector: {
      flexDirection: 'row',
      marginBottom: '16@ms',
      gap: '12@ms',
    },
    accountTypeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '8@ms',
      padding: '12@ms',
      borderWidth: 1,
      borderColor: Colors.border,
      gap: '8@ms',
    },
    selectedAccountType: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primary + '10',
    },
    accountTypeText: {
      fontSize: '14@ms',
      fontWeight: '500',
      color: Colors.textSecondary,
    },
    selectedAccountTypeText: {
      color: Colors.primary,
    },
    defaultOption: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '24@ms',
    },
    checkbox: {
      width: '24@ms',
      height: '24@ms',
      borderRadius: '4@ms',
      borderWidth: 1,
      borderColor: Colors.border,
      marginRight: '12@ms',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkedCheckbox: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    defaultOptionText: {
      fontSize: '16@ms',
      color: Colors.white,
    },
    submitButton: {
      marginTop: '8@ms',
    },
    balanceContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '24@ms',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    balanceLabel: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      marginBottom: '8@ms',
    },
    balanceAmount: {
      fontSize: '28@ms',
      fontWeight: 'bold',
      color: Colors.white,
    },
    sectionTitle: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.white,
      marginBottom: '16@ms',
    },
    amountInputContainer: {
      flexDirection: 'row',
      // marginBottom: '16@ms',
    },
    currencyContainer: {
      width: '50@ms',
      height: '50@ms',
      backgroundColor: Colors.backgroundCard,
      borderTopLeftRadius: '8@ms',
      borderBottomLeftRadius: '8@ms',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      borderRightWidth: 0,
    },
    currencySymbol: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.white,
    },
    amountInput: {
      // flex: 1,
      height: '48@ms',
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      fontSize: '20@ms',
      color: Colors.white,

    },
    quickAmounts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '24@ms',
    },
    quickAmountButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.backgroundCard,
      paddingVertical: '10@ms',
      marginHorizontal: '4@ms',
      borderRadius: '8@ms',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    quickAmountText: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.white,
    },
    paymentMethodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '12@ms',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    selectedPaymentMethod: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primary + '10',
    },
    paymentMethodIconContainer: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '8@ms',
      backgroundColor: Colors.backgroundLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12@ms',
    },
    cardTypeIcon: {
      width: '32@ms',
      height: '20@ms',
      resizeMode: 'contain',
    },
    paymentMethodInfo: {
      flex: 1,
    },
    paymentMethodTitle: {
      fontSize: '16@ms',
      fontWeight: '500',
      color: Colors.white,
      marginBottom: '4@ms',
    },
    paymentMethodSubtitle: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
    },
    checkmarkContainer: {
      width: '32@ms',
      height: '32@ms',
      borderRadius: '16@ms',
      backgroundColor: Colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    noMethodsContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '24@ms',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    noMethodsText: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: '16@ms',
    },
    addMethodButton: {
      width: '200@ms',
    },
    depositButton: {
      marginTop: '24@ms',
      marginBottom: '16@ms',
    },
    depositNote: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: '18@ms',
    },

    //PaymentHistory Screen Style
    filterButton: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filtersContainer: {
      backgroundColor: Colors.backgroundLight,
      padding: '20@ms',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    filterSection: {
      marginBottom: '16@ms',
    },
    filterSectionTitle: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.white,
      marginBottom: '8@ms',
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '8@ms',
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '16@ms',
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderWidth: 1,
      borderColor: Colors.border,
      gap: '6@ms',
    },
    filterChipText: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
    },
    resetFiltersButton: {
      alignSelf: 'center',
      paddingVertical: '8@ms',
      paddingHorizontal: '16@ms',
      borderRadius: '8@ms',
      borderWidth: 1,
      borderColor: Colors.primary,
      marginTop: '8@ms',
    },
    resetFiltersText: {
      fontSize: '14@ms',
      color: Colors.primary,
      fontWeight: '500',
    },
    listContent: {
      padding: '20@ms',
      paddingBottom: '40@ms',
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '12@ms',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    transactionIconContainer: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12@ms',
    },
    transactionTitle: {
      fontSize: '16@ms',
      fontWeight: '500',
      color: Colors.white,
      marginBottom: '4@ms',
    },
    transactionDate: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
    },
    transactionInfo:{
      flex:1
    },
    transactionAmountText: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.white,
      marginBottom: '4@ms',
    },
    statusBadge: {
      paddingHorizontal: '8@ms',
      paddingVertical: '2@ms',
      borderRadius: '12@ms',
    },
    statusText: {
      fontSize: '10@ms',
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20@ms',
      marginTop: '40@ms',
    },
    emptyStateTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.white,
      marginTop: '16@ms',
      marginBottom: '8@ms',
    },
    emptyStateDescription: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: '20@ms',
    },
    defaultBadge: {
      backgroundColor: Colors.primary + '20',
      paddingHorizontal: '8@ms',
      paddingVertical: '2@ms',
      borderRadius: '12@ms',
      marginRight: '8@ms',
    },
    defaultText: {
      fontSize: '10@ms',
      fontWeight: '500',
      color: Colors.primary,
    },
    actionButton: {
      width: '36@ms',
      height: '36@ms',
      borderRadius: '18@ms',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: '8@ms',
    },
    addButton: {
      marginTop: '16@ms',
    },
    balanceCard: {
      padding: '20@ms',
      paddingTop: '40@ms',
      borderBottomLeftRadius: '24@ms',
      borderBottomRightRadius: '24@ms',
    },
    balanceHeader: {
      marginBottom: '8@ms',
    },
    historyButton: {
      paddingHorizontal: '10@ms',
      paddingVertical: '4@ms',
      borderRadius: '16@ms',
    },
    historyText: {
      fontSize: '12@ms',
    },
    pendingContainer: {
      marginBottom: '16@ms',
    },
    pendingLabel: {
      fontSize: '14@ms',
    },
    pendingAmount: {
      fontSize: '14@ms',
    },
    balanceActions: {
      marginTop: '8@ms',
    },
    balanceActionButton: {
      paddingVertical: '8@ms',
      paddingHorizontal: '16@ms',
      borderRadius: '8@ms',
      minWidth: '140@ms',
    },
    tabsContainer: {
      paddingHorizontal: '20@ms',
      marginTop: '20@ms',
      marginBottom: '16@ms',
    },
    tabButton: {
      paddingVertical: '10@ms',
    },
    tabButtonText: {
      fontSize: '16@ms',
    },
    seeAllText: {
      fontSize: '14@ms',
    },
    addButtonText: {
      fontSize: '12@ms',
      marginLeft: '4@ms',
    },
    emptyStateButton: {
      paddingHorizontal: '20@ms',
      paddingVertical: '12@ms',
      borderRadius: '8@ms',
    },
    transactionType: {
      fontSize: '16@ms',
      marginBottom: '8@ms',
    },
    detailsCard: {
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '24@ms',
    },
    detailRow: {
      paddingVertical: '12@ms',
    },
    detailLabel: {
      fontSize: '14@ms',
    },
    detailValue: {
      fontSize: '14@ms',
    },
    detailValueLink: {
      fontSize: '14@ms',
    },
    totalValue: {
      fontSize: '16@ms',
    },
    receiptAction: {
      paddingVertical: '12@ms',
      paddingHorizontal: '16@ms',
      borderRadius: '8@ms',
      marginHorizontal: '6@ms',
    },
    receiptActionText: {
      fontSize: '14@ms',
    },
    pendingMessage: {
      borderRadius: '8@ms',
      padding: '12@ms',
      marginBottom: '24@ms',
    },
    pendingText: {
      fontSize: '14@ms',
      lineHeight: '20@ms',
    },
    failedMessage: {
      borderRadius: '8@ms',
      padding: '12@ms',
      marginBottom: '24@ms',
    },
    failedText: {
      fontSize: '14@ms',
      lineHeight: '20@ms',
    },
    supportButton: {
      paddingVertical: '12@ms',
    },
    supportButtonText: {
      fontSize: '14@ms',
    },
    errorContainer: {
      padding: '20@ms',
    },
    errorTitle: {
      fontSize: '20@ms',
      marginTop: '16@ms',
      marginBottom: '8@ms',
    },
    errorDescription: {
      fontSize: '14@ms',
      marginBottom: '24@ms',
    },
    errorButton: {
      width: '200@ms',
    },
    maxButton: {
      paddingVertical: '4@ms',
      paddingHorizontal: '8@ms',
      borderRadius: '4@ms',
      marginBottom: '24@ms',
    },
    maxButtonText: {
      fontSize: '12@ms',
    },
    withdrawButton: {
      marginTop: '24@ms',
      marginBottom: '16@ms',
    },
    withdrawalNote: {
      fontSize: '12@ms',
      lineHeight: '18@ms',
      color: Colors.gray500,
    },
  });