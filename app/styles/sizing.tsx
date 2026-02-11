/**
 * Sizing
 * @format
 */

import { Dimensions } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('screen');

export const screen = {
  width: screenWidth,
  height: screenHeight,
};

export const vp = {
  vw: screenWidth / 100,
  vh: screenHeight / 100,
};
