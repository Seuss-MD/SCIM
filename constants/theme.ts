/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */
// constants/theme.ts
import { Platform } from 'react-native';


export const Colors = {
  light: {
    text: '#2B2118',
    textMuted: '#6B625A',
    textSoft: '#8E908F',

    background: '#F7F3E3',
    surface: '#FFFDF8',
    surfaceAlt: '#F1EBDD',

    border: '#D6D0C7',
    borderStrong: '#B3B6B7',

    tint: '#AF9164',
    tintStrong: '#96794F',

    icon: '#2B2118',
    tabIconDefault: '#9A948C',
    tabIconSelected: '#AF9164',

    primary: '#AF9164',
    primaryPressed: '#96794F',
    primaryText: '#FFFDF8',

    secondary: '#EFE7D4',
    secondaryText: '#2B2118',

    danger: '#6F1A07',
    dangerPressed: '#581405',
    dangerText: '#FFF8F6',

    success: '#6E8B5B',
    successText: '#FFFDF8',

    shadow: '#2B2118',
  },

  dark: {
    text: '#F7F3E3',
    textMuted: '#D0C7B8',
    textSoft: '#B3B6B7',

    background: '#1F1813',
    surface: '#2B2118',
    surfaceAlt: '#382C22',

    border: '#4B4036',
    borderStrong: '#6A5C50',

    tint: '#AF9164',
    tintStrong: '#C2A77E',

    icon: '#F7F3E3',
    tabIconDefault: '#9C8F80',
    tabIconSelected: '#AF9164',

    primary: '#AF9164',
    primaryPressed: '#C2A77E',
    primaryText: '#2B2118',

    secondary: '#3A3028',
    secondaryText: '#F7F3E3',

    danger: '#A63A24',
    dangerPressed: '#8A2F1D',
    dangerText: '#FFF8F6',

    success: '#7C9A68',
    successText: '#1C140F',

    shadow: '#000000',
  },
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  card: {
    shadowColor: '#2B2118',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#2B2118',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};