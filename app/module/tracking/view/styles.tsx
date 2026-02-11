/**
 * Tracking Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    mainContent: {
      flex: 1,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
    },
    permissionIcon: {
      marginBottom: '16@ms',
    },
    permissionTitle: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '8@ms',
      textAlign: 'center',
    },
    permissionText: {
      fontSize: '16@ms',
      color: Colors.gray600,
      textAlign: 'center',
      marginBottom: '24@ms',
    },
    permissionButton: {
      width: '200@ms',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
    },
    emptyIcon: {
      marginBottom: '16@ms',
    },
    emptyTitle: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '8@ms',
    },
    emptyText: {
      fontSize: '16@ms',
      color: Colors.gray600,
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: '20@ms',
      paddingBottom: '100@ms'
    },
    jobSelectorContainer: {
      paddingHorizontal: '16@ms',
      paddingTop: '16@ms',
      paddingBottom: '8@ms',
    },
    jobSelectorScrollView: {
      maxHeight: '80@ms',
    },
    jobSelectorContent: {
      paddingRight: '16@ms',
      gap: '12@ms',
    },
    jobSelectorItem: {
      backgroundColor: Colors.white,
      borderRadius: '8@ms',
      padding: '12@ms',
      width: '160@ms',
      height: '60@ms',
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
    },
    jobSelectorItemActive: {
      borderColor: Colors.primary,
    },
    jobSelectorTitle: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '4@ms',
    },
    jobSelectorTitleActive: {
      color: Colors.primary,
    },
    jobSelectorStatus: {
      fontSize: '12@ms',
      color: Colors.gray500,
    },
    jobSelectorStatusActive: {
      color: Colors.primary,
    },
    trackingContainer: {
      backgroundColor: Colors.background,
      borderRadius: '12@ms',
      paddingVertical: '20@ms',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statusContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20@ms',
    },
    statusBadge: {
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderRadius: '16@ms',
    },
    statusText: {
      color: Colors.white,
      fontWeight: '600',
      fontSize: '14@ms',
    },
    updateButton: {
      paddingHorizontal: '16@ms',
    },
    communicationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '20@ms',
    },
    communicationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary + '10',
      paddingVertical: '12@ms',
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
      backgroundColor: Colors.backgroundCard,
      borderRadius: '8@ms',
      padding: '16@ms',
      marginBottom: '20@ms',
    },
    verificationTitle: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '12@ms',
    },
    verificationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '12@ms',
    },
    verificationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary,
      paddingVertical: '12@ms',
      paddingHorizontal: '16@ms',
      borderRadius: '8@ms',
      flex: 0.48,
    },
    verificationIcon: {
      marginRight: '8@ms',
    },
    verificationButtonText: {
      color: Colors.white,
      fontWeight: '500',
    },
    locationContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: '8@ms',
      padding: '16@ms',
      marginBottom: '20@ms',
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '12@ms',
    },
    locationTitle: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.text,
      marginLeft: '8@ms',
    },
    currentLocationInfo: {
      marginBottom: '8@ms',
    },
    coordinatesText: {
      fontSize: '14@ms',
      color: Colors.text,
      marginBottom: '4@ms',
    },
    updatedText: {
      fontSize: '12@ms',
      color: Colors.gray500,
      marginBottom: '12@ms',
    },
    trackingStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trackingIndicator: {
      width: '8@ms',
      height: '8@ms',
      borderRadius: '4@ms',
      backgroundColor: Colors.success,
      marginRight: '8@ms',
    },
    trackingText: {
      fontSize: '14@ms',
      color: Colors.success,
      fontWeight: '500',
    },
    startTrackingButton: {
      marginTop: '8@ms',
    },
    noLocationText: {
      fontSize: '14@ms',
      color: Colors.gray500,
      fontStyle: 'italic',
    },
    routeContainer: {
      marginBottom: '20@ms',
      backgroundColor:Colors.backgroundCard,
      padding:20,borderRadius:10

    },
    routePoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    routeMarker: {
      width: '32@ms',
      height: '32@ms',
      borderRadius: '16@ms',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12@ms',
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
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '4@ms',
    },
    routeAddress: {
      fontSize: '16@ms',
      color: Colors.text,
      marginBottom: '2@ms',
    },
    routeCity: {
      fontSize: '14@ms',
      color: Colors.gray600,
      marginBottom: '2@ms',
    },
    routeTime: {
      fontSize: '14@ms',
      color: Colors.gray500,
    },
    routeConnector: {
      width: '2@ms',
      height: '30@ms',
      backgroundColor: Colors.primary + '30',
      marginLeft: '15@ms',
      marginVertical: '4@ms',
    },
    detailsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '20@ms',
      backgroundColor:Colors.backgroundCard,
      padding:10
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    detailIcon: {
      marginRight: '8@ms',
      marginTop: '2@ms',
    },
    detailLabel: {
      fontSize: '12@ms',
      color: Colors.gray500,
      marginBottom: '2@ms',
    },
    detailValue: {
      fontSize: '14@ms',
      fontWeight: '500',
      color: Colors.text,
      // maxWidth:'96%'

    },
    requirementsContainer: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: '8@ms',
      padding: '16@ms',
    },
    requirementsTitle: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '8@ms',
    },
    requirementsText: {
      fontSize: '14@ms',
      color: Colors.gray500,
      lineHeight: '20@ms',
    },
    mockDataIndicator: {
      backgroundColor: Colors.warning,
      padding: '8@ms',
      alignItems: 'center',
    },
    mockDataText: {
      fontSize: '12@ms',
      color: Colors.white,
      fontWeight: '600',
    },
    dummyDataIndicator: {
      position: 'absolute',
      top: '16@ms',
      left: '16@ms',
      right: '16@ms',
      backgroundColor: Colors.primary,
      padding: '8@ms',
      borderRadius: '6@ms',
      alignItems: 'center',
      zIndex: 1000,
    },
    dummyDataText: {
      fontSize: '12@ms',
      color: Colors.white,
      fontWeight: '600',
    },
    mapLoadingContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -50 }, { translateY: -50 }],
      backgroundColor: Colors.primary,
      padding: '16@ms',
      borderRadius: '8@ms',
      zIndex: 1001,
    },
    mapLoadingText: {
      fontSize: '16@ms',
      color: Colors.white,
      fontWeight: '600',
    },
    mapFallback: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: Colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 500,
    },
    mapFallbackTitle: {
      fontSize: '18@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginTop: '16@ms',
      marginBottom: '8@ms',
    },
    mapFallbackText: {
      fontSize: '14@ms',
      color: Colors.gray600,
      textAlign: 'center',
    },
    // Map View Styles
    mapViewContainer: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
      width: '100%',
      height: '100%',
      minHeight: '400@ms',
    },
    mapControls: {
      position: 'absolute',
      right: '16@ms',
      top: '16@ms',
      flexDirection: 'column',
      gap: '8@ms',
    },
    mapControlButton: {
      backgroundColor: Colors.primary,
      width: '44@ms',
      height: '44@ms',
      borderRadius: '22@ms',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    mapInfo: {
      position: 'absolute',
      bottom: '20@ms',
      left: '16@ms',
      right: '16@ms',
      backgroundColor: Colors.white,
      borderRadius: '12@ms',
      padding: '16@ms',
      flexDirection: 'row',
      justifyContent: 'space-between',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    mapInfoItem: {
      flex: 1,
      alignItems: 'center',
    },
    mapInfoLabel: {
      fontSize: '12@ms',
      color: Colors.gray500,
      marginBottom: '4@ms',
      fontWeight: '500',
    },
    mapInfoValue: {
      fontSize: '18@ms',
      color: Colors.text,
      fontWeight: 'bold',
      marginBottom: '2@ms',
    },
    mapInfoEta: {
      fontSize: '12@ms',
      color: Colors.gray600,
    },
    // View Toggle Styles
    viewToggleContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '8@ms',
      marginHorizontal: '16@ms',
      marginVertical: '8@ms',
      padding: '4@ms',
    },
    viewToggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: '12@ms',
      paddingHorizontal: '16@ms',
      borderRadius: '6@ms',
    },
    viewToggleButtonActive: {
      backgroundColor: Colors.primary,
    },
    viewToggleText: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.primary,
      marginLeft: '8@ms',
    },
    viewToggleTextActive: {
      color: Colors.white,
    },
    tripTrackingButton: {
      backgroundColor: Colors.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: '12@ms',
      paddingHorizontal: '16@ms',
      borderRadius: '6@ms',
      marginLeft: '8@ms',
    },
    tripTrackingButtonText: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.white,
      marginLeft: '8@ms',
    },
    // Contract Jobs List Styles
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: '16@ms',
      paddingVertical: '12@ms',
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.gray500,
    },
    headerTitle: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.text,
    },
    refreshButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: '16@ms',
      paddingVertical: '8@ms',
      borderRadius: '6@ms',
    },
    refreshButtonText: {
      color: Colors.white,
      fontSize: '14@ms',
      fontWeight: '600',
    },
    listContainer: {
      padding: '16@ms',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background,
    },
    loadingText: {
      marginTop: '16@ms',
      fontSize: '16@ms',
      color: Colors.text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40@ms',
    },
    emptyTitle: {
      fontSize: '18@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '8@ms',
    },
    emptySubtitle: {
      fontSize: '14@ms',
      color: Colors.gray600,
      textAlign: 'center',
      marginBottom: '24@ms',
    },
  });
