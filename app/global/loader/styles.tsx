/**
 * Styles
 * @format
 */

import { StyleSheet } from 'react-native';

import { ScaledSheet } from '@app/styles';

export const getStyles = () =>
  ScaledSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      height: '100%',
      width: '100%',
      elevation: 1000,
      zIndex: 10000,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      position: 'absolute',
    },
    loaderContent: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(62, 59, 59, 0.9)',
      padding: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '500',
      color: '#FFFFFF',
    },
  });
