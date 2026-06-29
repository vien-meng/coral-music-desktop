import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { observer } from 'mobx-react-lite';
import { useEffect, type PropsWithChildren } from 'react';
import { createCoralAntdTheme } from '@shared/theme/antdTheme';
import { rootStore } from '../stores/rootStore';

export const AppProviders = observer(({ children }: PropsWithChildren) => {
  useEffect(() => {
    rootStore.initialize();
  }, []);

  return (
    <ConfigProvider locale={zhCN} theme={createCoralAntdTheme(rootStore.theme.themeMode)}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
});
