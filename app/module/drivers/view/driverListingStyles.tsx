/**
 * Driver Listing Styles
 * @format
 */

import { ScaledSheet } from 'react-native-size-matters';
import { Colors } from '@app/styles';

export const getStyles = () =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      minWidth: 80,
      height: 36,
    },
    activeTab: {
      backgroundColor: 'rgba(230, 121, 50, 0.3)',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.textSecondary,
    },
    activeTabText: {
      color: Colors.primary,
      fontWeight: '600',
    },
    filterToggleContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.backgroundCard,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    filterToggleContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    filterToggleLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.text,
      flex: 1,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.background,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: Colors.text,
      paddingVertical: 4,
    },
    locationFilterContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: Colors.background,
      position: 'relative',
      zIndex: 1000,
    },
    locationInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    clearButton: {
      padding: 4,
      marginLeft: 4,
    },
    locationDropdown: {
      position: 'absolute',
      top: 56,
      left: 16,
      right: 16,
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      maxHeight: 200,
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      zIndex: 2000,
    },
    dropdownScroll: {
      maxHeight: 200,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    currentLocationItem: {
      backgroundColor: Colors.success + '10',
      borderBottomWidth: 2,
      borderBottomColor: Colors.success + '30',
    },
    predictionTextContainer: {
      flex: 1,
      marginLeft: 8,
    },
    locationItemText: {
      fontSize: 14,
      color: Colors.text,
      fontWeight: '500',
    },
    currentLocationText: {
      color: Colors.success,
      fontWeight: '600',
    },
    locationSecondaryText: {
      fontSize: 12,
      color: Colors.gray400,
      marginTop: 2,
    },
    activeFilterContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      backgroundColor: Colors.background,
    },
    filterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      alignSelf: 'flex-start',
      gap: 6,
    },
    filterBadgeText: {
      fontSize: 13,
      color: Colors.white,
      fontWeight: '500',
      marginHorizontal: 4,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    driverCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    driverInfoSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    profileIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    profileImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    driverDetails: {
      flex: 1,
    },
    driverName: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.text,
      marginBottom: 4,
    },
    ratingSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    ratingText: {
      fontSize: 14,
      color: Colors.text,
      marginLeft: 4,
      fontWeight: '500',
    },
    separator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.gray400,
      marginHorizontal: 8,
    },
    jobsText: {
      fontSize: 14,
      color: Colors.text,
    },
    vehicleType: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 2,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    location: {
      fontSize: 12,
      color: Colors.gray400,
      flex: 1,
    },
    distanceText: {
      fontSize: 12,
      color: Colors.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
    actionButtonSection: {
      alignItems: 'center',
    },
    assignButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.success,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 24,
      minWidth: 250,
    },
    removeButton: {
      backgroundColor: Colors.error,
    },
    disabledButton: {
      backgroundColor: Colors.gray300,
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.white,
      marginLeft: 6,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 32,
    },
  });
