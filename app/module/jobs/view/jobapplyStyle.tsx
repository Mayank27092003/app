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
        paddingTop: Platform.OS === 'ios' ? '0@ms' : '40@ms',

      },
      scrollView: {
        flex: 1,
      },
      scrollContent: {
        padding: 20,
        paddingBottom: 100,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 20,
      },
      jobCard: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      jobTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
      },
      jobDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      jobIcon: {
        marginRight: 8,
      },
      jobText: {
        fontSize: 14,
        color: Colors.gray500,
      },
      compensationText: {
        fontWeight: '600',
        color: Colors.success,
      },
      messageSection: {
        marginBottom: 24,
      },
      messageLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      messageIcon: {
        marginRight: 8,
      },
      messageLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
      },
      messageInput: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        minHeight: 150,
        borderWidth: 1,
        borderColor: Colors.primary,
      },
      termsContainer: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: 12,
        padding: 16,
      },
      termsText: {
        fontSize: 14,
        color: Colors.gray600,
        lineHeight: 20,
      },
      footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        // backgroundColor: Colors.backgroundCard,
        padding: 20,
        borderTopWidth: 1,
        // borderTopColor: Colors.gray200,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      loadingText: {
        fontSize: 16,
        color: Colors.gray500,
        textAlign: 'center',
      },
  });
