import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { createCoralAntdTheme } from '@shared/theme/antdTheme';
import { rootStore } from '../stores/rootStore';

export const AppProviders = observer(({ children }: PropsWithChildren) => {
  const appliedThemeKeysRef = useRef<string[]>([]);

  useEffect(() => {
    rootStore.initialize();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    for (const key of appliedThemeKeysRef.current) {
      root.style.removeProperty(key);
    }

    const colors = rootStore.theme.activeThemeColors;
    const entries = Object.entries(colors);
    for (const [key, value] of entries) {
      root.style.setProperty(key, value);
    }
    appliedThemeKeysRef.current = entries.map(([key]) => key);
  }, [rootStore.theme.activeThemeColors]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={createCoralAntdTheme(
        rootStore.theme.themeMode,
        rootStore.theme.activeThemePrimaryColor,
      )}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
});
