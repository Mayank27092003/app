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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: Colors.backgroundLight,
      },
      backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.white,
      },
      headerRight: {
        width: 40,
      },
      scrollView: {
        flex: 1,
      },
      scrollContent: {
        padding: 20,
        paddingBottom: '100@ms',
      },
      transactionHeader: {
        alignItems: 'center',
        marginBottom: 24,
      },
      transactionIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
      },
      transactionType: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.white,
        marginBottom: 8,
      },
      transactionAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.white,
        marginBottom: 12,
      },
      amountPositive: {
        color: Colors.success,
      },
      amountNegative: {
        color: Colors.error,
      },
      statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
      },
      statusText: {
        fontSize: 12,
        fontWeight: '600',
      },
      detailsCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
      },
      detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      },
      detailLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
      },
      detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.white,
        maxWidth: '60%',
        textAlign: 'right',
      },
      detailValueLink: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary,
        textDecorationLine: 'underline',
      },
      totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      paymentMethodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      paymentMethodIcon: {
        marginRight: 6,
      },
      receiptActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
      },
      receiptAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary + '10',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 6,
      },
      receiptActionIcon: {
        marginRight: 8,
      },
      receiptActionText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary,
      },
      pendingMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.warning + '10',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
      },
      pendingIcon: {
        marginRight: 12,
      },
      pendingText: {
        flex: 1,
        fontSize: 14,
        color: Colors.warning,
        lineHeight: 20,
      },
      failedMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.error + '10',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
      },
      failedIcon: {
        marginRight: 12,
      },
      failedText: {
        flex: 1,
        fontSize: 14,
        color: Colors.error,
        lineHeight: 20,
      },
      retryButton: {
        marginBottom: 24,
      },
      supportButton: {
        alignItems: 'center',
        paddingVertical: 12,
      },
      supportButtonText: {
        fontSize: 14,
        color: Colors.primary,
        textDecorationLine: 'underline',
      },
      errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      },
      errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.white,
        marginTop: 16,
        marginBottom: 8,
      },
      errorDescription: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
      },
      errorButton: {
        width: 200,
      },
  });