/**
 * App themes
 * @format
 */

import * as colors from './colors';

const defaultTheme = {
  key: 'default',
  variant: 'light',
  colors: {
    primary: colors.brightRed,
    white: colors.pureWhite,
    black: colors.charcoal,
    gray: colors.semiTransparentCharcoal,
    background: colors.lightGray,
    transparent: colors.transparent,
    disableButton: colors.disableButton,
    shadow: colors.pureBlack,
  },
};

const darkTheme = {
  ...defaultTheme,
  variant: 'dark',
  key: 'dark',
  colors: {
    ...defaultTheme.colors,
  },
};

export const Themes = { defaultTheme, darkTheme };

export type ITheme = typeof defaultTheme;
