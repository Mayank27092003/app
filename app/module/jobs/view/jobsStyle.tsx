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
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: '20@ms',
        paddingBottom: '10@ms',
        gap: '12@ms',
      },
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
      tabsScrollContainer: {
        marginTop: '10@ms',
        borderBottomWidth: 2,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
        height: 60, // Fixed height to prevent cropping
        flexGrow: 0, // Prevent vertical expansion
        flexShrink: 0, // Prevent shrinking
      },
      tabsContainer: {
        flexDirection: 'row',
        paddingLeft: '20@ms',
        paddingRight: '20@ms',
        paddingVertical: '15@ms', // Increased vertical padding
        justifyContent: 'flex-start',
        alignItems: 'center',
        height: 60, // Match the container height
        flexGrow: 0, // Prevent vertical expansion
        flexShrink: 0, // Prevent shrinking
      },
      tab: {
        paddingVertical: '6@ms',
        paddingHorizontal: '16@ms',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '8@ms',
        minWidth: 80,
        height: 36, // Fixed height for tabs
      },
      activeTab: {
        backgroundColor:'rgba(230, 121, 50, 0.3)', // Orange color like in the image
      },
      tabText: {
        fontSize: '14@ms',
        fontWeight: '500',
        color: Colors.white, // White text for inactive tabs
      },
      activeTabText: {
        color: Colors.primary, // Light orange text for active tab
        fontWeight: '600',
      },
      filtersContainer: {
        backgroundColor: Colors.backgroundLight,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        maxHeight: '60%', // Limit the height so it doesn't take up the whole screen
      },
      filtersScrollView: {
        maxHeight: '70%', // Allow scrolling within the container
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
        color: Colors.white,
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
        color: Colors.white,
        fontWeight: '600',
      },
      loadingText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontStyle: 'italic',
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
      headerBack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: '20@ms',
        paddingTop: '20@ms',
        paddingBottom: '10@ms',
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
        fontSize: 18,
        fontWeight: '600',
        color: Colors.white,
      },
      applyJobsHeade:{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: '10@ms',
        paddingBottom: 16,
        gap: '12@ms',
      },
      // Distance Slider Styles
      distanceContainer: {
        paddingVertical: '10@ms',
      },
      distanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15@ms',
      },
      distanceValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
      },
      sliderContainer: {
        marginVertical: '10@ms',
      },
      slider: {
        width: '100%',
        height: '40@ms',
        marginBottom: '15@ms',
      },
      sliderButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '10@ms',
      },
      sliderButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: '12@ms',
        paddingVertical: '6@ms',
        borderRadius: '15@ms',
        minWidth: '40@ms',
        alignItems: 'center',
      },
      sliderButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.text,
      },
      distanceLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: '5@ms',
      },
      distanceLabel: {
        fontSize: 12,
        color: Colors.gray500,
      },
  });
