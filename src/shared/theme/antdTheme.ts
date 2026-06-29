import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

export type CoralThemeMode = 'light' | 'dark';

export const coralColors = {
  coral: '#f0645a',
  reef: '#1f8a8a',
  ink: '#20242a',
  mist: '#f6f8fb',
  amber: '#d89614',
} as const;

export const createCoralAntdTheme = (mode: CoralThemeMode = 'light'): ThemeConfig => ({
  algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: coralColors.coral,
    colorInfo: coralColors.reef,
    colorWarning: coralColors.amber,
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: mode === 'dark' ? '#15181d' : coralColors.mist,
      headerBg: mode === 'dark' ? '#1f232b' : '#ffffff',
      siderBg: mode === 'dark' ? '#1f232b' : '#ffffff',
    },
    Menu: {
      itemBorderRadius: 6,
    },
    Card: {
      borderRadiusLG: 8,
    },
  },
});
