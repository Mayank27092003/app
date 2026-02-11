/**
 * Setting Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    // Language screen style
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      padding: '20@ms',
      borderBottomWidth: 1,
      borderBottomColor: Colors.gray200,
      backgroundColor: Colors.background,
    },
    title: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      // marginBottom: '8@ms',
    },
    subtitle: {
      fontSize: '16@ms',
      color: Colors.gray600,
      marginBottom: '12@ms',
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.backgroundCard,
      paddingHorizontal: '16@ms',
      paddingVertical: '10@ms',
      borderRadius: '8@ms',
      borderWidth: 1,
      borderColor: Colors.primary,
      marginTop: '8@ms',
    },
    refreshButtonText: {
      fontSize: '14@ms',
      color: Colors.primary,
      fontWeight: '600',
      marginLeft: '8@ms',
    },
    refreshingText: {
      color: Colors.gray600,
    },
    listContent: {
      padding: '20@ms',
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '12@ms',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    selectedLanguage: {
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    languageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageFlag: {
      fontSize: '24@ms',
      marginRight: '16@ms',
    },
    languageFlagImage: {
      width: '32@ms',
      height: '24@ms',
      marginRight: '16@ms',
      borderRadius: '4@ms',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40@ms',
    },
    loadingText: {
      marginTop: '16@ms',
      fontSize: '16@ms',
      color: Colors.gray600,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40@ms',
    },
    errorText: {
      fontSize: '16@ms',
      color: Colors.error,
      textAlign: 'center',
      marginBottom: '20@ms',
    },
    retryButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: '24@ms',
      paddingVertical: '12@ms',
      borderRadius: '8@ms',
    },
    retryButtonText: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: '600',
    },
    emptyContainer: {
      padding: '40@ms',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: '16@ms',
      color: Colors.gray600,
    },
    languageName: {
      fontSize: '16@ms',
      color: Colors.white,
    },
    selectedLanguageText: {
      fontWeight: '600',
      color: Colors.primary,
    },

    // Terms screen style
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: '20@ms',
      paddingBottom: '40@ms',
    },
    date: {
      fontSize: '14@ms',
      color: Colors.gray500,
      marginBottom: '24@ms',
    },
    section: {
      marginBottom: '24@ms',
    },
    sectionTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '12@ms',
    },
    paragraph: {
      fontSize: '16@ms',
      color: Colors.gray500,
      lineHeight: '24@ms',
      marginBottom: '12@ms',
    },
    listItem: {
      fontSize: '16@ms',
      color: Colors.gray800,
      lineHeight: '24@ms',
      marginBottom: '8@ms',
      paddingLeft: '16@ms',
    },
    bold: {
      fontWeight: '600',
    },
    headerBack: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: '20@ms',
      paddingTop: '40@ms',
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
    debugButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.error,
      paddingHorizontal: '20@ms',
      paddingVertical: '16@ms',
      borderRadius: '12@ms',
      marginTop: '20@ms',
      marginBottom: '20@ms',
      marginHorizontal: '20@ms',
    },
    debugButtonText: {
      fontSize: '16@ms',
      color: Colors.white,
      fontWeight: '600',
      marginLeft: '10@ms',
    },
    autoLanguageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.backgroundCard,
      paddingHorizontal: '20@ms',
      paddingVertical: '16@ms',
      borderRadius: '12@ms',
      marginTop: '20@ms',
      marginBottom: '20@ms',
      marginHorizontal: '20@ms',
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    autoLanguageButtonText: {
      fontSize: '16@ms',
      color: Colors.primary,
      fontWeight: '600',
      marginLeft: '10@ms',
    },
  });
