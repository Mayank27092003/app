/**
 * Theme provider
 * @format
 */

import { Themes, ITheme } from '@app/styles';

/*
  useTheme hook to use theme
  inside functional component
*/
export const useTheme = (): ITheme => {
  return Themes.defaultTheme;
};

/*
  useThemedStyle hook to use theme
  inside stylesheet
*/
export function useThemedStyle(styles: any) {
  const theme = useTheme();

  return styles(theme);
}

// ThemeConsumer to use inside class component
export const ThemeConsumer = ({ children }: any) => {
  const theme = useTheme();

  return children(theme);
};
