/**
 * Flash Message
 * @format
 */

import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNFlashMessage, { showMessage } from 'react-native-flash-message';

import { moderateScale } from '@app/styles';

const FlashMessage = () => {
  const insets = useSafeAreaInsets();

  /**
   * Flash message title style
   */
  const styles = {
    fontSize: moderateScale(11),
    fontWeight: 'bold',
  };

  return (
    <RNFlashMessage
      statusBarHeight={insets.top}
      floating
      titleStyle={styles}
      duration={3000}
      type={'success'}
    />
  );
};

export { FlashMessage, showMessage };
