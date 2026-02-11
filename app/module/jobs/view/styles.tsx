/**
 * Jobs Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet, Typography } from '@app/styles';
import { Platform } from 'react-native';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    //Create Screen Styles
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: '20@ms',
      paddingBottom: '40@vs',
    },
    title: {
      fontSize: '24@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '20@vs',
    },
    section: {
      marginBottom: '24@vs',
    },
    sectionTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '16@vs',
    },
    label: {
      fontSize: '14@ms',
      fontWeight: '500',
      marginBottom: '6@vs',
      color: Colors.text,
    },
    textAreaContainer: {
      marginBottom: '16@vs',
    },
    textArea: {
      borderWidth: 1,
      borderColor: Colors.gray300,
      borderRadius: '8@ms',
      padding: '12@ms',
      fontSize: '16@ms',
      color: Colors.text,
      backgroundColor: Colors.white,
      minHeight: '100@vs',
    },
    rowInputs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: '8@ms',
    },
    rowInput: {
      flex: 1,
    },
    dateInput: {
      flex: 1,
    },
    timeInput: {
      flex: 1,
    },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24@vs',
    },
    advancedToggleText: {
      fontSize: '16@ms',
      fontWeight: '500',
      color: Colors.primary,
      marginRight: '8@ms',
    },
    termsContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.warning + '10',
      borderRadius: '8@ms',
      padding: '12@ms',
      marginBottom: '24@vs',
    },
    termsIcon: {
      marginRight: '8@ms',
      marginTop: '2@ms',
    },
    termsText: {
      flex: 1,
      fontSize: '14@ms',
      color: Colors.gray700,
      lineHeight: '20@vs',
    },
    submitButton: {
      marginBottom: '20@vs',
    },
    jobCard: {
      backgroundColor: Colors.white,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '24@vs',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    jobTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '12@vs',
    },
    jobDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '8@vs',
    },
    jobIcon: {
      marginRight: '8@ms',
    },
    jobText: {
      fontSize: '14@ms',
      color: Colors.gray700,
    },
    compensationText: {
      fontWeight: '600',
      color: Colors.success,
    },
    messageSection: {
      marginBottom: '24@vs',
    },
    messageLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '8@vs',
    },
    messageIcon: {
      marginRight: '8@ms',
    },
    messageLabel: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.text,
    },
    messageInput: {
      backgroundColor: Colors.white,
      borderRadius: '12@ms',
      padding: '16@ms',
      fontSize: '16@ms',
      color: Colors.text,
      minHeight: '150@vs',
      borderWidth: 1,
      borderColor: Colors.gray300,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors.white,
      padding: '20@ms',
      borderTopWidth: 1,
      borderTopColor: Colors.gray200,
    },
    //JobDetails Screen Styles

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16@ms',
    },

    statusBadge: {
      paddingHorizontal: '12@ms',
      paddingVertical: '6@vs',
      borderRadius: '16@ms',
    },
    statusText: {
      color: Colors.white,
      fontWeight: '600',
      fontSize: '12@ms',
    },
    description: {
      fontSize: '16@ms',
      color: Colors.gray700,
      lineHeight: '24@vs',
      marginBottom: '20@vs',
    },
    communicationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '20@vs',
    },
    communicationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary + '10',
      paddingVertical: '12@vs',
      paddingHorizontal: '20@ms',
      borderRadius: '8@ms',
      flex: 0.48,
    },
    communicationButtonText: {
      color: Colors.primary,
      fontWeight: '600',
      marginLeft: '8@ms',
    },
    verificationContainer: {
      backgroundColor: Colors.white,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '20@vs',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    verificationTitle: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '12@vs',
    },
    verificationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '12@vs',
    },
    verificationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.background,
      paddingVertical: '12@vs',
      paddingHorizontal: '16@ms',
      borderRadius: '8@ms',
      flex: 0.48,
    },
    verificationIcon: {
      marginRight: '8@ms',
    },
    verificationButtonText: {
      color: Colors.text,
      fontWeight: '500',
    },
    paymentContainer: {
      backgroundColor: Colors.success + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors.success + '30',
    },
    paymentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    paymentIcon: {
      marginRight: 8,
    },
    paymentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.success,
    },
    paymentDescription: {
      fontSize: 14,
      color: Colors.gray700,
      lineHeight: 20,
      marginBottom: 16,
    },
    paymentDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: Colors.white,
      borderRadius: 8,
    },
    paymentLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.gray600,
    },
    paymentAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.success,
    },
    compensationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.success + '10',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 24,
    },
    compensationIcon: {
      marginRight: 8,
    },

    routeContainer: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    routePoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    routeMarker: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    pickupMarker: {
      backgroundColor: Colors.primary,
    },
    deliveryMarker: {
      backgroundColor: Colors.secondary,
    },
    routeInfo: {
      flex: 1,
    },
    routeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text,
      marginBottom: 4,
    },
    routeAddress: {
      fontSize: 16,
      color: Colors.text,
      marginBottom: 2,
    },
    routeCity: {
      fontSize: 14,
      color: Colors.gray600,
      marginBottom: 2,
    },
    routeTime: {
      fontSize: 14,
      color: Colors.gray500,
    },
    routeConnector: {
      width: 2,
      height: 30,
      backgroundColor: Colors.gray300,
      marginLeft: 15,
      marginVertical: 4,
    },
    detailsContainer: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailIcon: {
      marginRight: 8,
    },
    detailLabel: {
      fontSize: 12,
      color: Colors.gray500,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.text,
    },
    requirementsContainer: {
      backgroundColor: Colors.warning + '10',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    requirementsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    requirementsIcon: {
      marginRight: 8,
    },
    requirementsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.text,
    },
    requirementsText: {
      fontSize: 14,
      color: Colors.gray700,
      lineHeight: 20,
    },
    merchantContainer: {
      marginBottom: 24,
    },

    merchantCard: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      padding: 16,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    merchantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    merchantAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    merchantInfo: {
      flex: 1,
    },
    merchantName: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.text,
      marginBottom: 4,
    },
    merchantRating: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    merchantRatingText: {
      fontSize: 14,
      color: Colors.text,
      marginLeft: 4,
    },
    merchantContact: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.primary,
      borderRadius: 8,
      minWidth: 100,
    },
    contactButtonText: {
      color: Colors.primary,
      fontWeight: '500',
      marginLeft: 8,
    },

    //Jobs Screen Styles

    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: '100%',
      fontSize: 16,
      color: Colors.white,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    filterButtonActive: {
      backgroundColor: Colors.primary,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filtersContainer: {
      backgroundColor: Colors.backgroundLight,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    filtersTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 16,
    },
    filterSection: {
      marginBottom: 16,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: Colors.backgroundCard,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    filterChipActive: {
      backgroundColor: Colors.primary + '30',
      borderColor: Colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    filterChipTextActive: {
      color: Colors.primary,
      fontWeight: '500',
    },
    resetButton: {
      marginTop: 8,
    },
    listContent: {
      padding: 20,
      paddingBottom: '100@ms',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      marginTop: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyButton: {
      width: 200,
    },
    
  });
