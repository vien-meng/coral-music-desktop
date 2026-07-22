import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { createCoralAntdTheme } from '@shared/theme/antdTheme';
import { desktopLyricService } from '../services/desktopLyricService';
import { keyboardShortcutService } from '../services/keyboardShortcutService';
import { rootStore } from '../stores/rootStore';

export const AppProviders = observer(({ children }: PropsWithChildren) => {
  const appliedThemeKeysRef = useRef<string[]>([]);

  useEffect(() => {
    // 必须优先启动 desktopLyricService，在 rootStore.initialize() 发送
    // inited IPC 触发歌词窗口创建之前就注册好端口监听，
    // 否则歌词窗口发起的 MessageChannel 连接中 port1 会丢失。
    desktopLyricService.start(rootStore.player, rootStore.settings);
    rootStore
      .initialize()
      .then(() => keyboardShortcutService.start())
      .catch(() => {});
    return () => {
      desktopLyricService.stop();
      keyboardShortcutService.stop();
    };
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

  useEffect(() => {
    const root = document.documentElement;
    const setting = rootStore.settings.appSetting;
    const fontSize = setting?.['common.fontSize'] ?? 14;
    root.style.setProperty('--coral-font-size', `${fontSize}px`);
    root.classList.toggle('coral-reduce-motion', setting?.['common.isShowAnimation'] === false);
    return () => {
      root.style.removeProperty('--coral-font-size');
      root.classList.remove('coral-reduce-motion');
    };
  }, [
    rootStore.settings.appSetting?.['common.fontSize'],
    rootStore.settings.appSetting?.['common.isShowAnimation'],
  ]);

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
