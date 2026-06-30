import {
  CustomerServiceOutlined,
  FileAddOutlined,
  LinkOutlined,
  MoonOutlined,
  SunOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Flex, Layout, Menu, Space, Spin, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { coralBrand } from '@shared/brand';
import { SearchInput, WindowControlBtns } from '../components/layout';
import { PlayBar } from '../components/player';
import { rootStore } from '../stores/rootStore';
import { RouterOutlet } from './router';
import { rendererRoutes } from './routeConfig';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export const AppShell = observer(() => {
  const { settings, theme, ui } = rootStore;
  const controlBtnPosition = settings.appSetting?.['common.controlBtnPosition'] ?? 'right';
  const isFullscreen = false;

  return (
    <Layout className="coral-shell">
      <div className="coral-window-drag-strip" aria-hidden="true" />
      <Sider width={224} className="coral-sider">
        <div className="coral-brand">
          {controlBtnPosition === 'left' ? (
            <WindowControlBtns variant="mac" isFullscreen={isFullscreen} />
          ) : (
            <CustomerServiceOutlined className="coral-brand-icon" />
          )}
          <div>
            <Text strong>{coralBrand.productName}</Text>
            <Text type="secondary" className="coral-brand-subtitle">
              {coralBrand.englishName}
            </Text>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[ui.activeRoute]}
          items={rendererRoutes.map((route) => ({
            key: route.key,
            disabled: ui.isRouteTransitioning && route.key !== ui.activeRoute,
            icon: route.icon,
            label: route.label,
          }))}
          onClick={({ key }) => {
            ui.setActiveRoute(key);
          }}
        />
      </Sider>
      <Layout>
        <Header className="coral-header">
          <Flex align="center" justify="space-between" gap={16} className="coral-header-row">
            <div className="coral-header-search">
              <SearchInput
                onSearch={(text) => {
                  if (ui.isRouteTransitioning) return;
                  ui.setActiveRoute('search');
                  rootStore.search.setSearchText(text);
                  void ui.withGlobalLoading(() => rootStore.search.submitSearch(), '搜索中...');
                }}
              />
            </div>
            <div className="coral-header-drag-spacer" aria-hidden="true" />
            <Space className="coral-header-actions" size={8}>
              <Button
                className="coral-header-action-btn"
                icon={theme.themeMode === 'light' ? <MoonOutlined /> : <SunOutlined />}
                onClick={() => {
                  theme.setThemeMode(theme.themeMode === 'light' ? 'dark' : 'light');
                }}
              >
                {theme.themeMode === 'light' ? '深色' : '浅色'}
              </Button>
              <Button
                className="coral-header-action-btn"
                icon={<FileAddOutlined />}
                disabled={ui.isRouteTransitioning}
                onClick={() => {
                  ui.setActiveRoute('list');
                  ui.requestQuickAction('importLocalAudio');
                }}
              >
                本地文件
              </Button>
              <Dropdown
                trigger={['click']}
                disabled={ui.isRouteTransitioning}
                menu={{
                  items: [
                    {
                      icon: <UploadOutlined />,
                      key: 'file',
                      label: '导入音源文件',
                    },
                    {
                      icon: <LinkOutlined />,
                      key: 'online',
                      label: '在线导入音源',
                    },
                  ],
                  onClick: ({ key }) => {
                    ui.setActiveRoute('setting');
                    ui.requestQuickAction(
                      key === 'file' ? 'importUserApiFile' : 'importUserApiOnline',
                    );
                  },
                }}
              >
                <Button
                  className="coral-header-action-btn"
                  icon={<UploadOutlined />}
                  disabled={ui.isRouteTransitioning}
                >
                  添加音源
                </Button>
              </Dropdown>
              {controlBtnPosition === 'right' ? (
                <WindowControlBtns variant="windows" isFullscreen={isFullscreen} />
              ) : null}
            </Space>
          </Flex>
        </Header>
        <Content className="coral-content">
          <RouterOutlet />
        </Content>
        <Footer className="coral-player-slot">
          <PlayBar />
        </Footer>
      </Layout>
      {ui.isGlobalLoading ? (
        <div className="coral-global-loading" aria-live="polite" aria-busy="true">
          <Spin size="large" tip={ui.globalLoadingText || '加载中...'}>
            <div className="coral-global-loading-tip" />
          </Spin>
        </div>
      ) : null}
    </Layout>
  );
});
