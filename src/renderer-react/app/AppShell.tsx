import {
  CustomerServiceOutlined,
  DesktopOutlined,
  FileAddOutlined,
  LinkOutlined,
  MoonOutlined,
  SunOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Flex, Layout, Menu, Space, Spin, Typography, message } from 'antd';
import { observer } from 'mobx-react-lite';
import {
  useCallback,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { coralBrand } from '@shared/brand';
import {
  externalDecoderExtensions,
  nativeLocalAudioExtensions,
} from '@shared/playbackCapabilities';
import { SearchInput, WindowControlBtns } from '../components/layout';
import { SyncConflictModal } from '../components/layout/SyncConflictModal';
import { PlayBar } from '../components/player';
import { appService } from '../services/appService';
import { getDroppedFilePaths } from '../services/droppedFilePathService';
import { rootStore } from '../stores/rootStore';
import { RouterOutlet } from './router';
import { rendererRoutes } from './routeConfig';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

const isFileDragEvent = (event: ReactDragEvent<HTMLElement>): boolean =>
  Array.from(event.dataTransfer.types).includes('Files');

export const AppShell = observer(() => {
  const { settings, theme, ui } = rootStore;
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const controlBtnPosition = settings.appSetting?.['common.controlBtnPosition'] ?? 'right';
  const isFullscreen = false;
  let themeActionIcon = <DesktopOutlined />;
  let themeActionLabel = '跟随系统';
  if (theme.themePreference !== 'system') {
    themeActionIcon = theme.themeMode === 'light' ? <MoonOutlined /> : <SunOutlined />;
    themeActionLabel = theme.themeMode === 'light' ? '深色' : '浅色';
  }
  const handleWindowDragMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();

    const startX = event.screenX;
    const startY = event.screenY;
    const winX = window.screenX;
    const winY = window.screenY;
    appService.setWindowResizeable(false);

    const handleMouseMove = (moveEvent: globalThis.MouseEvent): void => {
      appService.moveMainWindowTo(
        winX + moveEvent.screenX - startX,
        winY + moveEvent.screenY - startY,
      );
    };

    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      appService.setWindowResizeable(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleFileDragEnter = useCallback((event: ReactDragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setIsFileDragActive(true);
  }, []);

  const handleFileDragOver = useCallback((event: ReactDragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsFileDragActive(true);
  }, []);

  const handleFileDragLeave = useCallback((event: ReactDragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsFileDragActive(false);
  }, []);

  const handleFileDrop = useCallback(
    async (event: ReactDragEvent<HTMLElement>) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setIsFileDragActive(false);

      const appSetting = settings.appSetting;
      if (appSetting && !appSetting['player.localAudio.enabled']) {
        message.warning('本地音频导入已关闭，请在“设置 > 本地解码”开启。');
        ui.setActiveRoute('setting');
        ui.requestQuickAction('configureLocalAudioImport');
        return;
      }

      const filePaths = getDroppedFilePaths(event.dataTransfer);
      if (!filePaths.length) {
        message.warning('未读取到可导入的本地文件路径');
        return;
      }

      const addMusicLocationType = appSetting?.['list.addMusicLocationType'] ?? 'top';
      const nativeExtensions =
        appSetting?.['player.localAudio.supportedExts'] ?? nativeLocalAudioExtensions;
      const externalExtensions = externalDecoderExtensions;

      ui.setActiveRoute('list');
      const importResult = await ui.withGlobalLoading(
        () =>
          rootStore.list.importLocalAudioPathsToLocalList(filePaths, addMusicLocationType, {
            externalExtensions,
            nativeExtensions,
          }),
        '导入本地音频...',
      );
      if (!importResult) return;

      if (!importResult.importedMusics.length) {
        const skippedText = importResult.skippedCount
          ? `，跳过 ${importResult.skippedCount} 个无效或不可用条目`
          : '';
        message.warning(
          importResult.candidateCount
            ? `已跳过 ${importResult.duplicateCount} 首重复本地音频${skippedText}`
            : '未发现支持的本地音频文件',
        );
        return;
      }

      const duplicateText = importResult.duplicateCount
        ? `，跳过重复 ${importResult.duplicateCount} 首`
        : '';
      const skippedText = importResult.skippedCount
        ? `，跳过 ${importResult.skippedCount} 个无效或不可用条目`
        : '';
      message.success(
        `已导入 ${importResult.importedMusics.length} 首本地音频${duplicateText}${skippedText}`,
      );
    },
    [settings.appSetting, ui],
  );

  return (
    <Layout
      className={`coral-shell is-${theme.themeMode}`}
      onDragEnter={handleFileDragEnter}
      onDragLeave={handleFileDragLeave}
      onDragOver={handleFileDragOver}
      onDrop={handleFileDrop}
    >
      <Sider width={224} className="coral-sider">
        <div
          className="coral-window-drag-zone is-left"
          aria-hidden="true"
          onMouseDown={handleWindowDragMouseDown}
        />
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
          <div
            className="coral-window-drag-zone is-top"
            aria-hidden="true"
            onMouseDown={handleWindowDragMouseDown}
          />
          <Flex align="center" justify="space-between" gap={16} className="coral-header-row">
            <div className="coral-header-search">
              <SearchInput
                onSearch={(text) => {
                  if (ui.isRouteTransitioning) return;
                  ui.setActiveRoute('search');
                  rootStore.search.setSearchText(text);
                  ui.withGlobalLoading(() => rootStore.search.submitSearch(), '搜索中...');
                }}
              />
            </div>
            <div className="coral-header-drag-spacer" aria-hidden="true" />
            <Space className="coral-header-actions" size={8}>
              <Button
                className="coral-header-action-btn"
                icon={themeActionIcon}
                onClick={() => {
                  theme.setThemeMode(theme.themeMode === 'light' ? 'dark' : 'light');
                }}
              >
                {themeActionLabel}
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
          <SyncConflictModal />
        </Footer>
      </Layout>
      {ui.isGlobalLoading ? (
        <div className="coral-global-loading" aria-live="polite" aria-busy="true">
          <Spin size="large" description={ui.globalLoadingText || '加载中...'}>
            <div className="coral-global-loading-tip" />
          </Spin>
        </div>
      ) : null}
      {isFileDragActive ? (
        <div className="coral-file-drop-overlay" aria-live="polite">
          <div className="coral-file-drop-panel">
            <FileAddOutlined />
            <span>松开导入到本地音乐</span>
          </div>
        </div>
      ) : null}
    </Layout>
  );
});
