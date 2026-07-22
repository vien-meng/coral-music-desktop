import {
  BgColorsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  KeyOutlined,
  LinkOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tabs,
  Typography,
} from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TRAY_AUTO_ID } from '@common/constants';
import { isUrl, sizeFormate } from '@common/utils/common';
import { coralProjectLinks } from '@shared/brand';
import {
  type ExclusiveAudioDevice,
  type ExclusiveAudioOutputProbeResult,
} from '@shared/playbackCapabilities';
import { audioOutputService } from '../../services/audioOutputService';
import { PlainList, PlainListItem, PlainListMeta } from '../../components/base';
import { appService } from '../../services/appService';
import { backupService } from '../../services/backupService';
import { cacheService } from '../../services/cacheService';
import { listService } from '../../services/listService';
import { basename, joinPath, readFile } from '../../services/nodeBridgeService';
import { rootStore } from '../../stores/rootStore';
import { DislikeListModal } from './DislikeListModal';
import { HotKeySection } from './HotKeySection';
import { PlayTimeoutModal } from './PlayTimeoutModal';
import { ThemeEditModal } from './ThemeEditModal';

const { Text } = Typography;

const toLocalFileUrl = (filePath: string): string => {
  const encodedPath = encodeURI(filePath).replace(/#/g, '%23');
  return `file://${encodedPath.startsWith('/') ? '' : '/'}${encodedPath}`;
};

const unwrapCssUrl = (value: string): string =>
  value
    .trim()
    .replace(/^url\((.*)\)$/i, '$1')
    .replace(/^['"]|['"]$/g, '');

const getThemeBackgroundPreviewUrl = (
  themeInfo: Coral.ThemeInfo | null,
  theme: Coral.Theme,
): string | null => {
  if (!theme.isCustom) return null;

  const backgroundImage = theme.config.extInfo?.['--background-image'];
  if (!backgroundImage || backgroundImage === 'none') return null;

  const imagePath = unwrapCssUrl(backgroundImage);
  if (!imagePath || imagePath === 'none') return null;
  if (isUrl(imagePath) || imagePath.startsWith('file://')) return imagePath;
  if (!themeInfo?.dataPath) return null;

  return toLocalFileUrl(joinPath(themeInfo.dataPath, basename(imagePath)));
};

type BooleanSettingKey = {
  [Key in keyof Coral.AppSetting]: Coral.AppSetting[Key] extends boolean ? Key : never;
}[keyof Coral.AppSetting];

interface SettingSectionProps {
  children: ReactNode;
  hidden?: boolean;
  title: string;
}

type SettingTabKey = 'general' | 'playback' | 'download' | 'services' | 'data';

interface SettingSwitchProps {
  appSetting: Coral.AppSetting;
  disabled?: boolean;
  label: string;
  settingKey: BooleanSettingKey;
  updateSetting: (setting: Partial<Coral.AppSetting>) => void;
}

const playQualityOptions: Array<{ label: string; value: Coral.Quality }> = [
  { label: 'Master', value: 'master' },
  { label: 'Atmos Plus', value: 'atmos_plus' },
  { label: 'Atmos', value: 'atmos' },
  { label: 'Hi-Res', value: 'hires' },
  { label: 'FLAC Hi-Res', value: 'flac24bit' },
  { label: 'FLAC', value: 'flac' },
  { label: '320k', value: '320k' },
  { label: '128k', value: '128k' },
];

const qualityNameMap: Partial<Record<Coral.Quality, string>> = {
  '128k': '128k',
  '192k': '192k',
  '320k': '320k',
  ape: 'APE',
  atmos: 'Atmos',
  atmos_plus: 'Atmos Plus',
  flac: 'FLAC',
  flac24bit: 'FLAC Hi-Res',
  hires: 'Hi-Res',
  master: 'Master',
  wav: 'WAV',
};

const formatQualityName = (quality: Coral.Quality): string => qualityNameMap[quality] ?? quality;

const getUserApiQualityNames = (apiInfo?: Coral.UserApi.UserApiInfo | null): string[] => {
  const qualities = new Set<Coral.Quality>();

  Object.values(apiInfo?.sources ?? {}).forEach((sourceInfo) => {
    if (sourceInfo.type !== 'music' || !sourceInfo.actions.includes('musicUrl')) return;
    sourceInfo.qualitys.forEach((quality) => {
      qualities.add(quality);
    });
  });

  return Array.from(qualities).map(formatQualityName);
};

const hasUserApiSourceInfo = (apiInfo?: Coral.UserApi.UserApiInfo | null): boolean =>
  Object.keys(apiInfo?.sources ?? {}).length > 0;

const maxDownloadOptions = [1, 2, 3, 4, 5, 6].map((value) => ({
  label: `${value}`,
  value,
}));

const lyricAlignOptions = [
  { label: '左侧', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧', value: 'right' },
];

const settingTabs: Array<{ key: SettingTabKey; label: string }> = [
  { key: 'general', label: '常规' },
  { key: 'playback', label: '播放' },
  { key: 'download', label: '下载' },
  { key: 'services', label: '网络与服务' },
  { key: 'data', label: '快捷键与数据' },
];

const SettingSection = ({ children, hidden, title }: SettingSectionProps) =>
  hidden ? null : (
    <section className="coral-settings-section">
      <h2>{title}</h2>
      <Form layout="vertical">{children}</Form>
    </section>
  );

const SettingSwitch = ({
  appSetting,
  disabled,
  label,
  settingKey,
  updateSetting,
}: SettingSwitchProps) => (
  <Form.Item label={label}>
    <Switch
      checked={appSetting[settingKey]}
      disabled={disabled}
      onChange={(checked) => {
        const nextSetting: Partial<Coral.AppSetting> = {
          [settingKey]: checked,
        };
        updateSetting(nextSetting);
      }}
    />
  </Form.Item>
);

interface OnlineImportModalProps {
  loading: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void | Promise<void>;
  open: boolean;
}

const OnlineImportModal = ({ loading, onClose, onSubmit, open }: OnlineImportModalProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!/^https?:\/\//.test(trimmed)) return;
    onSubmit(trimmed);
  };

  return (
    <Modal
      open={open}
      title="在线导入"
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={!url.trim()}
          onClick={handleSubmit}
        >
          导入
        </Button>,
      ]}
    >
      <Input
        autoFocus
        allowClear
        placeholder="输入脚本 URL（http:// 或 https://）"
        value={url}
        onChange={(event) => {
          setUrl(event.target.value);
        }}
        onPressEnter={handleSubmit}
      />
    </Modal>
  );
};

interface ThemeSelectorModalProps {
  appSetting: Coral.AppSetting;
  darkThemes: Coral.Theme[];
  lightThemes: Coral.Theme[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSelectDark: (id: string) => void;
  onSelectLight: (id: string) => void;
  open: boolean;
  themeInfo: Coral.ThemeInfo | null;
}

const ThemeSwatch = ({
  active,
  name,
  onClick,
  onEdit,
  previewUrl,
  primaryColor,
  onRemove,
}: {
  active: boolean;
  name: string;
  onClick: () => void;
  onEdit?: () => void;
  previewUrl?: string | null;
  primaryColor: string;
  onRemove?: () => void;
}) => {
  const [isPreviewAvailable, setIsPreviewAvailable] = useState(Boolean(previewUrl));

  useEffect(() => {
    setIsPreviewAvailable(Boolean(previewUrl));
  }, [previewUrl]);

  return (
    <div
      className={`coral-theme-swatch${active ? ' coral-theme-swatch-active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="coral-theme-swatch-bg" style={{ backgroundColor: primaryColor }}>
        {previewUrl && isPreviewAvailable ? (
          <img
            className="coral-theme-swatch-image"
            src={previewUrl}
            alt=""
            draggable={false}
            onError={() => {
              setIsPreviewAvailable(false);
            }}
          />
        ) : null}
        {onEdit ? (
          <EditOutlined
            className="coral-theme-swatch-edit"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          />
        ) : null}
        {onRemove ? (
          <DeleteOutlined
            className="coral-theme-swatch-remove"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          />
        ) : null}
      </div>
      <div className="coral-theme-swatch-label">{name}</div>
    </div>
  );
};

const ThemeSelectorModal = ({
  appSetting,
  darkThemes,
  lightThemes,
  onClose,
  onEdit,
  onRemove,
  onSelectDark,
  onSelectLight,
  open,
  themeInfo,
}: ThemeSelectorModalProps) => (
  <Modal open={open} title="主题选择" onCancel={onClose} footer={null} width={520}>
    <div className="coral-theme-selector">
      <div className="coral-theme-selector-group">
        <h3>浅色主题</h3>
        <div className="coral-theme-selector-list">
          {lightThemes.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              active={appSetting['theme.lightId'] === theme.id}
              name={theme.isCustom ? theme.name : theme.name}
              previewUrl={getThemeBackgroundPreviewUrl(themeInfo, theme)}
              primaryColor={theme.config.themeColors['--color-theme']}
              onClick={() => {
                onSelectLight(theme.id);
              }}
              onEdit={
                theme.isCustom
                  ? () => {
                      onEdit(theme.id);
                    }
                  : undefined
              }
              onRemove={
                theme.isCustom
                  ? () => {
                      onRemove(theme.id);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
      <div className="coral-theme-selector-group">
        <h3>深色主题</h3>
        <div className="coral-theme-selector-list">
          {darkThemes.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              active={appSetting['theme.darkId'] === theme.id}
              name={theme.isCustom ? theme.name : theme.name}
              previewUrl={getThemeBackgroundPreviewUrl(themeInfo, theme)}
              primaryColor={theme.config.themeColors['--color-theme']}
              onClick={() => {
                onSelectDark(theme.id);
              }}
              onEdit={
                theme.isCustom
                  ? () => {
                      onEdit(theme.id);
                    }
                  : undefined
              }
              onRemove={
                theme.isCustom
                  ? () => {
                      onRemove(theme.id);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  </Modal>
);

export const SettingsRoutePanel = observer(() => {
  const { settings, sync, openApi, theme, userApi, dislike, list, ui } = rootStore;
  const appSetting = settings.appSetting;
  const [isOnlineImportOpen, setIsOnlineImportOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isDislikeListOpen, setIsDislikeListOpen] = useState(false);
  const [isPlayTimeoutOpen, setIsPlayTimeoutOpen] = useState(false);
  const [isThemeEditOpen, setIsThemeEditOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | undefined>();
  const [cacheSize, setCacheSize] = useState(0);
  const [otherSourceCount, setOtherSourceCount] = useState(0);
  const [musicUrlCount, setMusicUrlCount] = useState(0);
  const [lyricRawCount, setLyricRawCount] = useState(0);
  const [lyricEditedCount, setLyricEditedCount] = useState(0);
  const [exclusiveDevices, setExclusiveDevices] = useState<ExclusiveAudioDevice[]>([]);
  const [exclusiveProbeResult, setExclusiveProbeResult] =
    useState<ExclusiveAudioOutputProbeResult | null>(null);
  const [isLoadingExclusiveDevices, setIsLoadingExclusiveDevices] = useState(false);
  const [isProbingExclusiveOutput, setIsProbingExclusiveOutput] = useState(false);
  const [syncAuthCode, setSyncAuthCode] = useState('');
  const [activeTab, setActiveTab] = useState<SettingTabKey>('general');
  const externalDecoderSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (appSetting?.['player.audioOutput.mode'] !== 'exclusive') return;
    loadExclusiveDevices();
  }, [appSetting?.['player.audioOutput.mode']]);

  useEffect(() => {
    if (!appSetting) return;

    if (
      ui.consumeQuickAction('configureLocalAudioImport') ||
      ui.consumeQuickAction('configureExternalDecoder')
    ) {
      setActiveTab('playback');
      requestAnimationFrame(() => {
        externalDecoderSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
      return;
    }

    if (ui.consumeQuickAction('importUserApiOnline')) {
      setActiveTab('services');
      setIsOnlineImportOpen(true);
      return;
    }

    if (!ui.consumeQuickAction('importUserApiFile')) return;

    setActiveTab('services');
    (async () => {
      if (userApi.userApis.length > 20) {
        Modal.warning({ title: '提示', content: '最多支持 20 个自定义源' });
        return;
      }

      const result = await appService.showSelectDialog({
        title: '导入文件',
        properties: ['openFile'],
        filters: [
          { name: 'Coral API File', extensions: ['js'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (result.canceled || !result.filePaths.length) return;

      const buffer = await readFile(result.filePaths[0]);
      const apiInfo = await userApi.importUserApi(buffer.toString());
      if (apiInfo) await activateUserApi(apiInfo);
    })();
  }, [appSetting, ui.pendingQuickAction]);

  if (!appSetting) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="设置尚未加载" />;
  }

  const applySetting = (setting: Partial<Coral.AppSetting>): void => {
    settings.updateAppSetting(setting);
  };

  const syncServerDevices = sync.serverDevices ?? [];

  const activateUserApi = async (apiInfo: Coral.UserApi.UserApiInfo): Promise<boolean> => {
    await userApi.setUserApi(apiInfo.id);

    const runtimeApiInfo =
      userApi.status?.apiInfo?.id === apiInfo.id ? userApi.status.apiInfo : apiInfo;
    if (!userApi.canPlay(runtimeApiInfo)) {
      Modal.warning({
        title: '音源不可用于播放',
        content:
          userApi.status?.message ||
          '该 User API 没有声明任何平台的 musicUrl 能力，可以保留用于查看，但不会设为当前播放音源。',
      });
      return false;
    }

    await settings.updateAppSetting({ 'common.apiSource': apiInfo.id });
    return true;
  };

  const removeUserApi = async (api: Coral.UserApi.UserApiInfo): Promise<void> => {
    if (api.id === appSetting['common.apiSource']) {
      const fallbackApiId =
        userApi.playableUserApis.find((userApiInfo) => userApiInfo.id !== api.id)?.id ?? '';
      await settings.updateAppSetting({ 'common.apiSource': fallbackApiId });
    }

    await userApi.removeUserApis([api.id]);
  };

  const handleImportFile = async (): Promise<void> => {
    if (userApi.userApis.length > 20) {
      Modal.warning({ title: '提示', content: '最多支持 20 个自定义源' });
      return;
    }

    const result = await appService.showSelectDialog({
      title: '导入文件',
      properties: ['openFile'],
      filters: [
        { name: 'Coral API File', extensions: ['js'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled || !result.filePaths.length) return;

    const buffer = await readFile(result.filePaths[0]);
    const apiInfo = await userApi.importUserApi(buffer.toString());
    if (apiInfo) await activateUserApi(apiInfo);
  };

  const handleImportOnline = async (url: string): Promise<void> => {
    if (!/^https?:\/\//.test(url)) return;

    let script: string;
    try {
      const response = await fetch(url);
      script = await response.text();
    } catch (error) {
      userApi.actionError = error instanceof Error ? error.message : String(error);
      return;
    }

    if (script.length > 9_000_000) {
      Modal.error({ title: '导入失败', content: '脚本文件过大' });
      return;
    }

    const apiInfo = await userApi.importUserApi(script);
    if (apiInfo) await activateUserApi(apiInfo);
  };

  const handleSetCurrentApi = async (api: Coral.UserApi.UserApiInfo): Promise<void> => {
    if (api.id === appSetting['common.apiSource']) return;
    await activateUserApi(api);
  };

  const updateSetting = <Key extends keyof Coral.AppSetting>(
    key: Key,
    value: Coral.AppSetting[Key],
  ): void => {
    const nextSetting: Partial<Coral.AppSetting> = {
      [key]: value,
    };
    applySetting(nextSetting);
  };

  const handleSyncEnabledChange = async (enabled: boolean): Promise<void> => {
    if (!enabled) {
      if (appSetting['sync.mode'] === 'client') await sync.disconnectClient();
      else {
        await sync.sendAction({
          action: 'enable_server',
          data: { enable: false, port: appSetting['sync.server.port'] },
        });
      }
      await settings.updateAppSetting({ 'sync.enable': false });
      return;
    }

    if (appSetting['sync.mode'] === 'server') {
      const port = Number(appSetting['sync.server.port']);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        Modal.error({ title: '端口无效', content: '端口必须在 1 到 65535 之间' });
        return;
      }
      await sync.sendAction({
        action: 'enable_server',
        data: { enable: true, port: appSetting['sync.server.port'] },
      });
      await settings.updateAppSetting({ 'sync.enable': true });
      return;
    }

    const host = appSetting['sync.client.host'].trim();
    if (!/^https?:\/\//.test(host)) {
      Modal.error({ title: '地址无效', content: '请输入以 http:// 或 https:// 开头的同步地址' });
      return;
    }
    await sync.connectClient(host, syncAuthCode.trim());
    setSyncAuthCode('');
    await settings.updateAppSetting({ 'sync.enable': true });
  };

  const handleOpenApiConfig = async (
    nextSetting: Partial<
      Pick<Coral.AppSetting, 'openAPI.enable' | 'openAPI.port' | 'openAPI.bindLan'>
    >,
  ): Promise<void> => {
    const enable = nextSetting['openAPI.enable'] ?? appSetting['openAPI.enable'];
    const port = nextSetting['openAPI.port'] ?? appSetting['openAPI.port'];
    const bindLan = nextSetting['openAPI.bindLan'] ?? appSetting['openAPI.bindLan'];
    if (enable && !(await openApi.configure(true, port, bindLan))) return;
    if (!enable) await openApi.configure(false, port, bindLan);
    await settings.updateAppSetting(nextSetting);
  };

  const loadExclusiveDevices = async (): Promise<void> => {
    setIsLoadingExclusiveDevices(true);
    try {
      const devices = await audioOutputService.listExclusiveAudioDevices();
      setExclusiveDevices(devices);
    } finally {
      setIsLoadingExclusiveDevices(false);
    }
  };

  const handleProbeExclusiveOutput = async (): Promise<void> => {
    setIsProbingExclusiveOutput(true);
    try {
      const result = await audioOutputService.probeExclusiveAudioOutput({
        backend: appSetting['player.audioOutput.exclusiveBackend'],
        bufferMs: appSetting['player.audioOutput.exclusiveBufferMs'],
        deviceId: appSetting['player.audioOutput.exclusiveDeviceId'],
        sampleRatePolicy: appSetting['player.audioOutput.exclusiveSampleRatePolicy'],
      });
      setExclusiveProbeResult(result);
    } finally {
      setIsProbingExclusiveOutput(false);
    }
  };

  const currentUserApi = userApi.userApis.find((api) => api.id === appSetting['common.apiSource']);
  const currentUserApiSourceNames = userApi.getPlayableSourceNames(currentUserApi);
  const currentUserApiQualityNames = getUserApiQualityNames(currentUserApi);
  const canPlayCurrentUserApi = currentUserApiSourceNames.length > 0;

  return (
    <Spin
      spinning={settings.isHydrating || settings.isSaving}
      classNames={{ root: 'coral-settings-spin' }}
    >
      <Space orientation="vertical" size="middle" className="coral-wide coral-settings-panel">
        {settings.hydrateError ? (
          <Alert showIcon type="error" title={settings.hydrateError} />
        ) : null}
        {settings.saveError ? <Alert showIcon type="error" title={settings.saveError} /> : null}

        <Tabs
          activeKey={activeTab}
          className="coral-settings-tabs"
          items={settingTabs}
          onChange={(key) => {
            setActiveTab(key as SettingTabKey);
          }}
        />

        <SettingSection title="主题" hidden={activeTab !== 'general'}>
          {theme.hydrateError ? (
            <Alert
              showIcon
              type="error"
              title={theme.hydrateError}
              className="coral-settings-wide-item"
            />
          ) : null}
          <Form.Item label="主题模式">
            <Radio.Group
              value={theme.themePreference}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '跟随系统', value: 'system' },
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
              ]}
              onChange={(event) => {
                theme.setThemeMode(event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="主题选择">
            <Space wrap>
              <Button
                icon={<BgColorsOutlined />}
                onClick={() => {
                  setIsThemeSelectorOpen(true);
                }}
              >
                选择主题
              </Button>
              <Button
                onClick={() => {
                  setEditingThemeId(undefined);
                  setIsThemeEditOpen(true);
                }}
              >
                新增主题
              </Button>
              <Text type="secondary">
                亮色 {theme.lightThemes.length} · 深色 {theme.darkThemes.length}
              </Text>
            </Space>
          </Form.Item>
        </SettingSection>

        <SettingSection title="基础" hidden={activeTab !== 'general'}>
          <SettingSwitch
            appSetting={appSetting}
            label="界面动画"
            settingKey="common.isShowAnimation"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            disabled={!appSetting['common.isShowAnimation']}
            label="随机动画"
            settingKey="common.randomAnimate"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="启动时全屏"
            settingKey="common.startInFullscreen"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="托盘"
            settingKey="tray.enable"
            updateSetting={applySetting}
          />
          <Form.Item label="控制按钮位置">
            <Radio.Group
              value={appSetting['common.controlBtnPosition']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '左侧', value: 'left' },
                { label: '右侧', value: 'right' },
              ]}
              onChange={(event) => {
                updateSetting('common.controlBtnPosition', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="播放栏进度条">
            <Radio.Group
              value={appSetting['common.playBarProgressStyle']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '迷你', value: 'mini' },
                { label: '中等', value: 'middle' },
                { label: '完整', value: 'full' },
              ]}
              onChange={(event) => {
                updateSetting('common.playBarProgressStyle', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="字体大小">
            <InputNumber
              min={12}
              max={24}
              value={appSetting['common.fontSize']}
              onChange={(value) => {
                if (value != null) updateSetting('common.fontSize', value);
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="播放" hidden={activeTab !== 'playback'}>
          <SettingSwitch
            appSetting={appSetting}
            label="启动时自动播放"
            settingKey="player.startupAutoPlay"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="播放时阻止休眠"
            settingKey="player.powerSaveBlocker"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="保存播放进度"
            settingKey="player.isSavePlayTime"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="错误时自动跳过"
            settingKey="player.autoSkipOnError"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="歌词翻译"
            settingKey="player.isShowLyricTranslation"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="罗马音歌词"
            settingKey="player.isShowLyricRoma"
            updateSetting={applySetting}
          />
          <Form.Item label="定时停止">
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => {
                setIsPlayTimeoutOpen(true);
              }}
            >
              设置定时停止
            </Button>
          </Form.Item>
          <Form.Item label="优先音质">
            <Select
              value={appSetting['player.playQuality']}
              options={playQualityOptions}
              className="coral-settings-select"
              onChange={(value) => {
                updateSetting('player.playQuality', value);
              }}
            />
          </Form.Item>
          <Form.Item label="音频输出模式">
            <Radio.Group
              value={appSetting['player.audioOutput.mode']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '系统输出', value: 'system' },
                { label: 'USB 独占输出', value: 'exclusive' },
              ]}
              onChange={(event) => {
                const mode = event.target.value;
                applySetting({
                  'player.audioOutput.mode': mode,
                });
                setExclusiveProbeResult(null);
                if (mode === 'exclusive') loadExclusiveDevices();
              }}
            />
          </Form.Item>
          {appSetting['player.audioOutput.mode'] === 'exclusive' ? (
            <>
              <Form.Item label="独占输出状态" className="coral-settings-wide-item">
                <Alert
                  showIcon
                  type="warning"
                  title="USB 独占输出第一版仅面向 Windows WASAPI；当前不保留均衡器、声像、变调和可视化效果。"
                  description="普通音频输出设备选择仍属于系统输出模式；独占模式会尝试接管所选 DAC 设备，失败时可自动回落到系统输出。"
                />
              </Form.Item>
              <Form.Item label="独占设备" className="coral-settings-wide-item">
                <Space wrap>
                  <Select
                    value={appSetting['player.audioOutput.exclusiveDeviceId']}
                    placeholder="选择 USB / DAC 输出设备"
                    className="coral-settings-select"
                    loading={isLoadingExclusiveDevices}
                    options={[
                      ...(appSetting['player.audioOutput.exclusiveDeviceId'] &&
                      !exclusiveDevices.some(
                        (device) =>
                          device.id === appSetting['player.audioOutput.exclusiveDeviceId'],
                      )
                        ? [
                            {
                              label: appSetting['player.audioOutput.exclusiveDeviceId'],
                              value: appSetting['player.audioOutput.exclusiveDeviceId'],
                            },
                          ]
                        : []),
                      ...exclusiveDevices.map((device) => ({
                        label: `${device.name}${device.isDefault ? '（默认）' : ''}`,
                        value: device.id,
                      })),
                    ]}
                    onChange={(value) => {
                      updateSetting('player.audioOutput.exclusiveDeviceId', value);
                      setExclusiveProbeResult(null);
                    }}
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    loading={isLoadingExclusiveDevices}
                    onClick={() => {
                      loadExclusiveDevices();
                    }}
                  >
                    刷新设备
                  </Button>
                  <Button
                    icon={<CheckCircleOutlined />}
                    loading={isProbingExclusiveOutput}
                    onClick={() => {
                      handleProbeExclusiveOutput();
                    }}
                  >
                    探测独占
                  </Button>
                </Space>
              </Form.Item>
              <Form.Item label="缓冲时长">
                <Space.Compact>
                  <InputNumber
                    min={20}
                    max={500}
                    value={appSetting['player.audioOutput.exclusiveBufferMs']}
                    onChange={(value) => {
                      if (value != null) {
                        updateSetting('player.audioOutput.exclusiveBufferMs', value);
                        setExclusiveProbeResult(null);
                      }
                    }}
                  />
                  <Button disabled>ms</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item label="采样率策略">
                <Radio.Group
                  value={appSetting['player.audioOutput.exclusiveSampleRatePolicy']}
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { label: '跟随源', value: 'source' },
                    { label: '设备默认', value: 'deviceDefault' },
                    { label: '重采样', value: 'resample' },
                  ]}
                  onChange={(event) => {
                    updateSetting(
                      'player.audioOutput.exclusiveSampleRatePolicy',
                      event.target.value,
                    );
                    setExclusiveProbeResult(null);
                  }}
                />
              </Form.Item>
              <SettingSwitch
                appSetting={appSetting}
                label="失败时回落到系统输出"
                settingKey="player.audioOutput.exclusiveFallbackToSystem"
                updateSetting={applySetting}
              />
              {exclusiveProbeResult ? (
                <Form.Item label="独占探测结果" className="coral-settings-wide-item">
                  <Alert
                    showIcon
                    type={exclusiveProbeResult.canUseExclusive ? 'success' : 'warning'}
                    title={
                      exclusiveProbeResult.canUseExclusive ? '独占输出可用' : '独占输出暂不可用'
                    }
                    description={[
                      `平台 ${exclusiveProbeResult.platform}`,
                      `helper ${exclusiveProbeResult.helperAvailable ? '可用' : '不可用'}`,
                      ...exclusiveProbeResult.errors,
                      ...exclusiveProbeResult.warnings,
                    ].join(' · ')}
                  />
                </Form.Item>
              ) : null}
            </>
          ) : null}
        </SettingSection>

        <div ref={externalDecoderSectionRef}>
          <SettingSection title="本地解码" hidden={activeTab !== 'playback'}>
            <SettingSwitch
              appSetting={appSetting}
              label="本地音频导入"
              settingKey="player.localAudio.enabled"
              updateSetting={applySetting}
            />
            <Form.Item label="运行状态" className="coral-settings-wide-item">
              <Alert
                showIcon
                type="info"
                title="内置解码能力会自动处理 DSF/DFF/AC3/ALAC/APE 等格式；APE 优先使用随应用打包的原生解码器，其余格式按需流式解码，用户无需配置。"
              />
            </Form.Item>
          </SettingSection>
        </div>

        <SettingSection title="播放详情" hidden={activeTab !== 'playback'}>
          <SettingSwitch
            appSetting={appSetting}
            label="当前歌词缩放"
            settingKey="playDetail.isZoomActiveLrc"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="延迟滚动"
            settingKey="playDetail.isDelayScroll"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="歌词进度调整"
            settingKey="playDetail.isShowLyricProgressSetting"
            updateSetting={applySetting}
          />
          <Form.Item label="歌词对齐">
            <Radio.Group
              value={appSetting['playDetail.style.align']}
              optionType="button"
              buttonStyle="solid"
              options={lyricAlignOptions}
              onChange={(event) => {
                updateSetting('playDetail.style.align', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="歌词字号">
            <InputNumber
              min={80}
              max={220}
              value={appSetting['playDetail.style.fontSize']}
              onChange={(value) => {
                if (value != null) {
                  updateSetting('playDetail.style.fontSize', value);
                }
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="桌面歌词" hidden={activeTab !== 'playback'}>
          <SettingSwitch
            appSetting={appSetting}
            label="启用桌面歌词"
            settingKey="desktopLyric.enable"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="锁定"
            settingKey="desktopLyric.isLock"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="全屏时隐藏"
            settingKey="desktopLyric.fullscreenHide"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="暂停时隐藏"
            settingKey="desktopLyric.pauseHide"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="音频可视化"
            settingKey="desktopLyric.audioVisualization"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="延迟滚动"
            settingKey="desktopLyric.isDelayScroll"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="置顶"
            settingKey="desktopLyric.isAlwaysOnTop"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="显示任务栏"
            settingKey="desktopLyric.isShowTaskbar"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="置顶刷新"
            settingKey="desktopLyric.isAlwaysOnTopLoop"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="限制在屏幕内"
            settingKey="desktopLyric.isLockScreen"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="悬停隐藏"
            settingKey="desktopLyric.isHoverHide"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="允许换行"
            settingKey="desktopLyric.style.ellipsis"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="当前歌词缩放"
            settingKey="desktopLyric.style.isZoomActiveLrc"
            updateSetting={applySetting}
          />
          <Form.Item label="方向">
            <Radio.Group
              value={appSetting['desktopLyric.direction']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '横向', value: 'horizontal' },
                { label: '纵向', value: 'vertical' },
              ]}
              onChange={(event) => {
                updateSetting('desktopLyric.direction', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="滚动位置">
            <Radio.Group
              value={appSetting['desktopLyric.scrollAlign']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '顶部', value: 'top' },
                { label: '居中', value: 'center' },
              ]}
              onChange={(event) => {
                updateSetting('desktopLyric.scrollAlign', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="歌词对齐">
            <Radio.Group
              value={appSetting['desktopLyric.style.align']}
              optionType="button"
              buttonStyle="solid"
              options={lyricAlignOptions}
              onChange={(event) => {
                updateSetting('desktopLyric.style.align', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="字号">
            <InputNumber
              min={12}
              max={80}
              value={appSetting['desktopLyric.style.fontSize']}
              onChange={(value) => {
                if (value != null) {
                  updateSetting('desktopLyric.style.fontSize', value);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="行距">
            <InputNumber
              min={0}
              max={80}
              value={appSetting['desktopLyric.style.lineGap']}
              onChange={(value) => {
                if (value != null) {
                  updateSetting('desktopLyric.style.lineGap', value);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="透明度">
            <InputNumber
              min={10}
              max={100}
              value={appSetting['desktopLyric.style.opacity']}
              onChange={(value) => {
                if (value != null) {
                  updateSetting('desktopLyric.style.opacity', value);
                }
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="列表" hidden={activeTab !== 'general'}>
          <SettingSwitch
            appSetting={appSetting}
            label="显示歌曲来源"
            settingKey="list.isShowSource"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="恢复滚动位置"
            settingKey="list.isSaveScrollLocation"
            updateSetting={applySetting}
          />
          <Form.Item label="添加歌曲位置">
            <Radio.Group
              value={appSetting['list.addMusicLocationType']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '顶部', value: 'top' },
                { label: '底部', value: 'bottom' },
              ]}
              onChange={(event) => {
                updateSetting('list.addMusicLocationType', event.target.value);
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="下载" hidden={activeTab !== 'download'}>
          <SettingSwitch
            appSetting={appSetting}
            label="启用下载"
            settingKey="download.enable"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="跳过同名文件"
            settingKey="download.skipExistFile"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="按列表名分组"
            settingKey="download.isSavePathGroupByListName"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="自动换源下载"
            settingKey="download.isUseOtherSource"
            updateSetting={applySetting}
          />
          <Form.Item label="最大并发">
            <Select
              value={appSetting['download.maxDownloadNum']}
              options={maxDownloadOptions}
              className="coral-settings-number-select"
              onChange={(value) => {
                updateSetting('download.maxDownloadNum', value);
              }}
            />
          </Form.Item>
          <Form.Item label="文件命名">
            <Radio.Group
              value={appSetting['download.fileName']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '歌名 - 歌手', value: '歌名 - 歌手' },
                { label: '歌手 - 歌名', value: '歌手 - 歌名' },
                { label: '歌名', value: '歌名' },
              ]}
              onChange={(event) => {
                updateSetting('download.fileName', event.target.value);
              }}
            />
          </Form.Item>
          <SettingSwitch
            appSetting={appSetting}
            label="下载歌词文件"
            settingKey="download.isDownloadLrc"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            disabled={!appSetting['download.isDownloadLrc']}
            label="同时写入珊瑚音乐逐字歌词"
            settingKey="download.isDownloadLxLrc"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            disabled={!appSetting['download.isDownloadLrc']}
            label="同时写入翻译歌词"
            settingKey="download.isDownloadTLrc"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            disabled={!appSetting['download.isDownloadLrc']}
            label="同时写入罗马音歌词"
            settingKey="download.isDownloadRLrc"
            updateSetting={applySetting}
          />
          <Form.Item label="歌词文件编码">
            <Radio.Group
              value={appSetting['download.lrcFormat']}
              optionType="button"
              buttonStyle="solid"
              disabled={!appSetting['download.isDownloadLrc']}
              options={[
                { label: 'UTF-8', value: 'utf8' },
                { label: 'GBK', value: 'gbk' },
              ]}
              onChange={(event) => {
                updateSetting('download.lrcFormat', event.target.value);
              }}
            />
          </Form.Item>
          <SettingSwitch
            appSetting={appSetting}
            label="嵌入封面"
            settingKey="download.isEmbedPic"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="嵌入普通歌词"
            settingKey="download.isEmbedLyric"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="嵌入珊瑚音乐逐字歌词"
            settingKey="download.isEmbedLyricLx"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="嵌入翻译歌词"
            settingKey="download.isEmbedLyricT"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="嵌入罗马音歌词"
            settingKey="download.isEmbedLyricR"
            updateSetting={applySetting}
          />
          <Form.Item label="保存路径">
            <Space wrap>
              <Text ellipsis className="coral-settings-path">
                {appSetting['download.savePath']}
              </Text>
              <Button
                icon={<FolderOpenOutlined />}
                onClick={async () => {
                  const result = await appService.showSelectDialog({
                    title: '选择下载目录',
                    defaultPath: appSetting['download.savePath'],
                    properties: ['openDirectory', 'createDirectory'],
                  });
                  if (result.canceled || !result.filePaths.length) return;
                  updateSetting('download.savePath', result.filePaths[0]);
                }}
              >
                选择目录
              </Button>
            </Space>
          </Form.Item>
        </SettingSection>

        <SettingSection title="搜索" hidden={activeTab !== 'general'}>
          <SettingSwitch
            appSetting={appSetting}
            label="显示热门搜索"
            settingKey="search.isShowHotSearch"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="显示搜索历史"
            settingKey="search.isShowHistorySearch"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="启动时聚焦搜索框"
            settingKey="search.isFocusSearchBox"
            updateSetting={applySetting}
          />
        </SettingSection>

        <SettingSection title="更新" hidden={activeTab !== 'general'}>
          <SettingSwitch
            appSetting={appSetting}
            label="尝试自动更新"
            settingKey="common.tryAutoUpdate"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="更新后显示变更日志"
            settingKey="common.showChangeLog"
            updateSetting={applySetting}
          />
        </SettingSection>

        <SettingSection title="网络" hidden={activeTab !== 'services'}>
          <SettingSwitch
            appSetting={appSetting}
            label="启用代理"
            settingKey="network.proxy.enable"
            updateSetting={applySetting}
          />
          <Form.Item label="代理主机">
            <Input
              allowClear
              defaultValue={appSetting['network.proxy.host']}
              placeholder="127.0.0.1"
              className="coral-settings-input"
              onBlur={(event) => {
                updateSetting('network.proxy.host', event.target.value.trim());
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur();
              }}
            />
          </Form.Item>
          <Form.Item label="代理端口">
            <Input
              allowClear
              defaultValue={appSetting['network.proxy.port']}
              placeholder="7890"
              className="coral-settings-number-input"
              onBlur={(event) => {
                updateSetting('network.proxy.port', event.target.value.trim());
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur();
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="ODC" hidden={activeTab !== 'services'}>
          <SettingSwitch
            appSetting={appSetting}
            label="离开时清空搜索框"
            settingKey="odc.isAutoClearSearchInput"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="离开时清空搜索列表"
            settingKey="odc.isAutoClearSearchList"
            updateSetting={applySetting}
          />
        </SettingSection>

        <SettingSection title="同步" hidden={activeTab !== 'services'}>
          {sync.actionError ? (
            <Alert
              showIcon
              type="error"
              title={sync.actionError}
              className="coral-settings-wide-item"
            />
          ) : null}
          <Form.Item label="启用同步">
            <Switch
              checked={appSetting['sync.enable']}
              loading={sync.isMutating}
              onChange={(enabled) => {
                handleSyncEnabledChange(enabled).catch(() => {});
              }}
            />
          </Form.Item>
          <Form.Item label="同步模式">
            <Radio.Group
              value={appSetting['sync.mode']}
              disabled={appSetting['sync.enable']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '服务端', value: 'server' },
                { label: '客户端', value: 'client' },
              ]}
              onChange={(event) => {
                updateSetting('sync.mode', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="服务端端口">
            <Input
              allowClear
              disabled={appSetting['sync.enable']}
              defaultValue={appSetting['sync.server.port']}
              placeholder="23332"
              className="coral-settings-number-input"
              onBlur={(event) => {
                updateSetting('sync.server.port', event.target.value.trim());
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur();
              }}
            />
          </Form.Item>
          <Form.Item label="客户端地址">
            <Input
              allowClear
              disabled={appSetting['sync.enable']}
              defaultValue={appSetting['sync.client.host']}
              placeholder="https://sync.example.com"
              className="coral-settings-input"
              onBlur={(event) => {
                updateSetting('sync.client.host', event.target.value.trim());
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur();
              }}
            />
          </Form.Item>
          {appSetting['sync.mode'] === 'client' ? (
            <>
              <Form.Item label="链接码">
                <Input.Password
                  allowClear
                  disabled={appSetting['sync.enable']}
                  placeholder="首次配对时输入；成功后不会保存"
                  value={syncAuthCode}
                  className="coral-settings-input"
                  onChange={(event) => {
                    setSyncAuthCode(event.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item label="客户端状态" className="coral-settings-wide-item">
                <Alert
                  showIcon
                  type={sync.clientStatus?.status ? 'success' : 'info'}
                  title={sync.clientStatus?.status ? '已连接' : '未连接'}
                  description={sync.clientStatus?.message || '首次连接需要输入服务提供的链接码。'}
                />
              </Form.Item>
            </>
          ) : (
            <Form.Item label="服务端状态" className="coral-settings-wide-item">
              <Alert
                showIcon
                type={sync.serverStatus?.status ? 'success' : 'info'}
                title={sync.serverStatus?.status ? '服务已启动' : '服务未启动'}
                description={
                  sync.serverStatus?.status
                    ? `${sync.serverStatus.address.join(' · ')}${sync.serverStatus.code ? ` · 配对码 ${sync.serverStatus.code}` : ''}`
                    : sync.serverStatus?.message || '启用后会生成配对码。'
                }
              />
            </Form.Item>
          )}
          <Form.Item label="最大快照数">
            <InputNumber
              min={1}
              max={30}
              disabled={appSetting['sync.enable']}
              value={appSetting['sync.server.maxSsnapshotNum']}
              onChange={(value) => {
                if (value != null) {
                  updateSetting('sync.server.maxSsnapshotNum', value);
                }
              }}
            />
          </Form.Item>
          {appSetting['sync.mode'] === 'server' ? (
            <Form.Item label="服务端设备" className="coral-settings-wide-item">
              <Space orientation="vertical" size="small" className="coral-wide">
                <Space wrap>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={sync.isHydrating}
                    onClick={() => {
                      sync.refreshServerDevices();
                    }}
                  >
                    刷新
                  </Button>
                  <Button
                    icon={<KeyOutlined />}
                    loading={sync.isMutating}
                    onClick={() => {
                      sync.generateCode();
                    }}
                  >
                    配对码
                  </Button>
                </Space>
                <PlainList
                  items={syncServerDevices}
                  empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无设备" />}
                  renderItem={(device) => (
                    <PlainListItem
                      key={device.clientId}
                      actions={[
                        <Popconfirm
                          key="remove"
                          title="移除设备"
                          description={device.deviceName}
                          okText="移除"
                          cancelText="取消"
                          onConfirm={() => {
                            sync.removeServerDevice(device.clientId);
                          }}
                        >
                          <Button
                            danger
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={sync.isMutating}
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <PlainListMeta title={device.deviceName} description={device.clientId} />
                    </PlainListItem>
                  )}
                />
              </Space>
            </Form.Item>
          ) : null}
        </SettingSection>

        <SettingSection title="OpenAPI" hidden={activeTab !== 'services'}>
          {openApi.lastError ? (
            <Alert
              showIcon
              type="error"
              title={openApi.lastError}
              className="coral-settings-wide-item"
            />
          ) : null}
          <Form.Item label="启用 OpenAPI">
            <Switch
              checked={appSetting['openAPI.enable']}
              onChange={(enabled) => {
                handleOpenApiConfig({ 'openAPI.enable': enabled }).catch(() => {});
              }}
            />
          </Form.Item>
          <Form.Item label="绑定局域网">
            <Switch
              checked={appSetting['openAPI.bindLan']}
              onChange={(bindLan) => {
                handleOpenApiConfig({ 'openAPI.bindLan': bindLan }).catch(() => {});
              }}
            />
          </Form.Item>
          <Form.Item label="端口">
            <Input
              allowClear
              defaultValue={appSetting['openAPI.port']}
              placeholder="23330"
              className="coral-settings-number-input"
              onBlur={(event) => {
                handleOpenApiConfig({ 'openAPI.port': event.target.value.trim() }).catch(() => {});
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur();
              }}
            />
          </Form.Item>
          <Form.Item label="运行状态" className="coral-settings-wide-item">
            <Alert
              showIcon
              type={openApi.status?.status ? 'success' : 'info'}
              title={openApi.status?.status ? 'OpenAPI 已启动' : 'OpenAPI 未启动'}
              description={
                openApi.status?.address ||
                openApi.status?.message ||
                '启用后可通过 HTTP 控制播放器。'
              }
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="User API" hidden={activeTab !== 'services'}>
          {userApi.hydrateError ? (
            <Alert
              showIcon
              type="error"
              title={userApi.hydrateError}
              className="coral-settings-wide-item"
            />
          ) : null}
          {userApi.actionError ? (
            <Alert
              showIcon
              type="error"
              title={userApi.actionError}
              className="coral-settings-wide-item"
            />
          ) : null}
          <Form.Item label="当前音源" className="coral-settings-wide-item">
            <Alert
              showIcon
              type={
                currentUserApi && userApi.status?.status && canPlayCurrentUserApi
                  ? 'success'
                  : 'warning'
              }
              title={currentUserApi ? currentUserApi.name : '未启用音源'}
              description={
                currentUserApi
                  ? `状态：${userApi.status?.status ? '可用' : userApi.status?.message || '未就绪'} · 平台：${currentUserApiSourceNames.length ? currentUserApiSourceNames.join('、') : '暂无可播放平台'} · 音质：${currentUserApiQualityNames.length ? currentUserApiQualityNames.join('、') : '暂无'}`
                  : '在线播放需要先导入并启用一个 User API 音源；本地文件播放不依赖音源。'
              }
              action={
                !currentUserApi ? (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      setIsOnlineImportOpen(true);
                    }}
                  >
                    在线导入
                  </Button>
                ) : undefined
              }
            />
          </Form.Item>
          <Form.Item className="coral-settings-wide-item">
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                loading={userApi.isHydrating || userApi.isMutating}
                onClick={() => {
                  const currentApiId = appSetting['common.apiSource'];
                  if (currentApiId?.startsWith('user_api')) {
                    userApi.setUserApi(currentApiId);
                  } else {
                    userApi.refreshUserApis();
                  }
                }}
              >
                重新检测
              </Button>
              <Button
                icon={<UploadOutlined />}
                loading={userApi.isMutating}
                onClick={() => {
                  handleImportFile();
                }}
              >
                导入文件
              </Button>
              <Button
                icon={<LinkOutlined />}
                loading={userApi.isMutating}
                onClick={() => {
                  setIsOnlineImportOpen(true);
                }}
              >
                在线导入
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  if (coralProjectLinks.customSourceDocs) {
                    appService.openUrl(coralProjectLinks.customSourceDocs);
                  }
                }}
                disabled={!coralProjectLinks.customSourceDocs}
              >
                自定义源文档
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="已安装 API" className="coral-settings-wide-item">
            <PlainList
              items={userApi.userApis}
              empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 API" />}
              renderItem={(api) => {
                const hasSourceInfo = hasUserApiSourceInfo(api);
                const playableSourceNames = userApi.getPlayableSourceNames(api);
                const playableQualityNames = getUserApiQualityNames(api);
                const canPlay = playableSourceNames.length > 0;

                return (
                  <PlainListItem
                    key={api.id}
                    actions={[
                      <Button
                        key="set"
                        type={api.id === appSetting['common.apiSource'] ? 'primary' : 'default'}
                        size="small"
                        disabled={
                          api.id === appSetting['common.apiSource'] || (hasSourceInfo && !canPlay)
                        }
                        loading={userApi.isMutating}
                        onClick={() => {
                          handleSetCurrentApi(api);
                        }}
                      >
                        {api.id === appSetting['common.apiSource'] ? '当前' : '设为当前'}
                      </Button>,
                      <Space key="update-alert" size={6}>
                        <Text type="secondary">提醒</Text>
                        <Switch
                          size="small"
                          checked={api.allowShowUpdateAlert}
                          loading={userApi.isMutating}
                          onChange={(checked) => {
                            userApi.setAllowUpdateAlert(api.id, checked);
                          }}
                        />
                      </Space>,
                      <Popconfirm
                        key="remove"
                        title="删除 User API"
                        description={api.name}
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => {
                          removeUserApi(api);
                        }}
                      >
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          loading={userApi.isMutating}
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <PlainListMeta
                      title={
                        <Space wrap>
                          <Text>{api.name}</Text>
                          {api.version ? <Text type="secondary">{api.version}</Text> : null}
                          <Tag color={canPlay ? 'green' : hasSourceInfo ? 'orange' : 'blue'}>
                            {canPlay ? '可播放' : hasSourceInfo ? '不可播放' : '待检测'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space orientation="vertical" size={2}>
                          {api.description ? <Text type="secondary">{api.description}</Text> : null}
                          <Space wrap size={8}>
                            {api.author ? <Text type="secondary">{api.author}</Text> : null}
                            <Text type="secondary">源 {Object.keys(api.sources ?? {}).length}</Text>
                            <Text type={canPlay || !hasSourceInfo ? 'secondary' : 'warning'}>
                              播放{' '}
                              {canPlay
                                ? playableSourceNames.join('、')
                                : hasSourceInfo
                                  ? '未声明 musicUrl'
                                  : '启用后检测'}
                            </Text>
                            {playableQualityNames.length ? (
                              <Text type="secondary">音质 {playableQualityNames.join('、')}</Text>
                            ) : null}
                          </Space>
                        </Space>
                      }
                    />
                  </PlainListItem>
                );
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="快捷键" hidden={activeTab !== 'data'}>
          <HotKeySection />
        </SettingSection>

        <SettingSection title="备份" hidden={activeTab !== 'data'}>
          <Form.Item label="部分备份" className="coral-settings-wide-item">
            <Space wrap>
              <Button
                size="small"
                onClick={async () => {
                  const result = await appService.showSelectDialog({
                    title: '导入播放列表',
                    properties: ['openFile'],
                    filters: [
                      { name: 'Play List', extensions: ['json', 'lxmc'] },
                      { name: 'All Files', extensions: ['*'] },
                    ],
                  });
                  if (result.canceled || !result.filePaths.length) return;
                  Modal.confirm({
                    title: '导入播放列表',
                    content: '将覆盖现有列表数据，是否继续？',
                    okText: '确认',
                    cancelText: '取消',
                    onOk: async () => backupService.importPlayList(result.filePaths[0]),
                  });
                }}
              >
                导入播放列表
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  const result = await cacheService.showSaveDialog({
                    title: '导出播放列表',
                    defaultPath: 'coral_list.lxmc',
                  });
                  if (result.canceled || !result.filePath) return;
                  await backupService.exportPlayList(result.filePath);
                }}
              >
                导出播放列表
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  const result = await appService.showSelectDialog({
                    title: '导入设置',
                    properties: ['openFile'],
                    filters: [
                      { name: 'Setting', extensions: ['json', 'lxmc'] },
                      { name: 'All Files', extensions: ['*'] },
                    ],
                  });
                  if (result.canceled || !result.filePaths.length) return;
                  await backupService.importSetting(result.filePaths[0]);
                }}
              >
                导入设置
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  const result = await cacheService.showSaveDialog({
                    title: '导出设置',
                    defaultPath: 'coral_setting_v2.lxmc',
                  });
                  if (result.canceled || !result.filePath) return;
                  await backupService.exportSetting(result.filePath, appSetting);
                }}
              >
                导出设置
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="全量备份" className="coral-settings-wide-item">
            <Space wrap>
              <Button
                size="small"
                onClick={async () => {
                  const result = await appService.showSelectDialog({
                    title: '导入全部数据',
                    properties: ['openFile'],
                    filters: [
                      { name: 'Setting', extensions: ['json', 'lxmc'] },
                      { name: 'All Files', extensions: ['*'] },
                    ],
                  });
                  if (result.canceled || !result.filePaths.length) return;
                  Modal.confirm({
                    title: '导入全部数据',
                    content: '将覆盖现有列表和设置数据，是否继续？',
                    okText: '确认',
                    cancelText: '取消',
                    onOk: async () => backupService.importAllData(result.filePaths[0]),
                  });
                }}
              >
                导入全部数据
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  const result = await cacheService.showSaveDialog({
                    title: '导出全部数据',
                    defaultPath: 'coral_datas_v2.lxmc',
                  });
                  if (result.canceled || !result.filePath) return;
                  await backupService.exportAllData(result.filePath, appSetting);
                }}
              >
                导出全部数据
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="其他导出" className="coral-settings-wide-item">
            <Space wrap>
              <Button
                size="small"
                onClick={async () => {
                  Modal.confirm({
                    title: '导出为文本',
                    content: '是否合并到一个文件？',
                    okText: '合并',
                    cancelText: '分开导出',
                    onOk: async () => {
                      const result = await cacheService.showSaveDialog({
                        title: '导出为文本',
                        defaultPath: 'coral_list_all.txt',
                      });
                      if (result.canceled || !result.filePath) return;
                      let path = result.filePath;
                      if (!path.endsWith('.txt')) path += '.txt';
                      await backupService.exportPlayListToText(path, true);
                    },
                    onCancel: async () => {
                      const result = await appService.showSelectDialog({
                        title: '选择导出目录',
                        properties: ['openDirectory'],
                      });
                      if (result.canceled || !result.filePaths.length) return;
                      await backupService.exportPlayListToText(result.filePaths[0], false);
                    },
                  });
                }}
              >
                导出为文本
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  Modal.confirm({
                    title: '导出为 CSV',
                    content: '是否合并到一个文件？',
                    okText: '合并',
                    cancelText: '分开导出',
                    onOk: async () => {
                      const result = await cacheService.showSaveDialog({
                        title: '导出为 CSV',
                        defaultPath: 'coral_list_all.csv',
                      });
                      if (result.canceled || !result.filePath) return;
                      let path = result.filePath;
                      if (!path.endsWith('.csv')) path += '.csv';
                      await backupService.exportPlayListToCsv(path, true, '歌曲名,歌手,专辑\n');
                    },
                    onCancel: async () => {
                      const result = await appService.showSelectDialog({
                        title: '选择导出目录',
                        properties: ['openDirectory'],
                      });
                      if (result.canceled || !result.filePaths.length) return;
                      await backupService.exportPlayListToCsv(
                        result.filePaths[0],
                        false,
                        '歌曲名,歌手,专辑\n',
                      );
                    },
                  });
                }}
              >
                导出为 CSV
              </Button>
            </Space>
          </Form.Item>
        </SettingSection>

        <SettingSection title="其他" hidden={activeTab !== 'data'}>
          <SettingSwitch
            appSetting={appSetting}
            label="透明窗口"
            settingKey="common.transparentWindow"
            updateSetting={applySetting}
          />
          <Form.Item label="托盘主题">
            <Radio.Group
              value={appSetting['tray.themeId']}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '原生', value: 0 },
                { label: '黑色', value: 2 },
                { label: '原色', value: 1 },
                { label: '跟随系统', value: TRAY_AUTO_ID },
              ]}
              onChange={(event) => {
                updateSetting('tray.themeId', event.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="资源缓存" className="coral-settings-wide-item">
            <Space>
              <Text type="secondary">{sizeFormate(cacheSize)}</Text>
              <Popconfirm
                title="清理资源缓存"
                okText="清理"
                cancelText="取消"
                onConfirm={async () => {
                  await cacheService.clearCache();
                  setCacheSize(await cacheService.getCacheSize());
                }}
              >
                <Button size="small" danger>
                  清理
                </Button>
              </Popconfirm>
              <Button
                size="small"
                onClick={async () => {
                  setCacheSize(await cacheService.getCacheSize());
                }}
              >
                刷新
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="其它来源缓存" className="coral-settings-wide-item">
            <Space>
              <Text type="secondary">{otherSourceCount} 首</Text>
              <Popconfirm
                title="清理其它来源缓存"
                okText="清理"
                cancelText="取消"
                onConfirm={async () => {
                  await cacheService.clearOtherSource();
                  setOtherSourceCount(await cacheService.getOtherSourceCount());
                }}
              >
                <Button size="small" danger>
                  清理
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
          <Form.Item label="歌曲 URL 缓存" className="coral-settings-wide-item">
            <Space>
              <Text type="secondary">{musicUrlCount} 条</Text>
              <Popconfirm
                title="清理歌曲 URL 缓存"
                okText="清理"
                cancelText="取消"
                onConfirm={async () => {
                  await cacheService.clearMusicUrl();
                  setMusicUrlCount(await cacheService.getMusicUrlCount());
                }}
              >
                <Button size="small" danger>
                  清理
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
          <Form.Item label="原始歌词缓存" className="coral-settings-wide-item">
            <Space>
              <Text type="secondary">{lyricRawCount} 首</Text>
              <Popconfirm
                title="清理原始歌词缓存"
                okText="清理"
                cancelText="取消"
                onConfirm={async () => {
                  await cacheService.clearLyricRaw();
                  setLyricRawCount(await cacheService.getLyricRawCount());
                }}
              >
                <Button size="small" danger>
                  清理
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
          <Form.Item label="已编辑歌词缓存" className="coral-settings-wide-item">
            <Space>
              <Text type="secondary">{lyricEditedCount} 首</Text>
              <Popconfirm
                title="清理已编辑歌词缓存"
                okText="清理"
                cancelText="取消"
                onConfirm={async () => {
                  await cacheService.clearLyricEdited();
                  setLyricEditedCount(await cacheService.getLyricEditedCount());
                }}
              >
                <Button size="small" danger>
                  清理
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
          <Form.Item label="不感兴趣列表" className="coral-settings-wide-item">
            <Space>
              <Text type="secondary">{dislike.ruleCount} 条规则</Text>
              <Button
                size="small"
                onClick={() => {
                  setIsDislikeListOpen(true);
                }}
              >
                编辑
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="歌单数据" className="coral-settings-wide-item">
            <Popconfirm
              title="清空所有歌单数据"
              description="此操作将清空所有播放列表，不可恢复"
              okText="清空"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={async () => {
                await listService.overwriteListFull({
                  defaultList: [],
                  loveList: [],
                  userList: list.userLists.map((info) => ({
                    ...info,
                    list: [],
                  })),
                });
                await list.hydrate();
              }}
            >
              <Button danger size="small">
                清空所有歌单
              </Button>
            </Popconfirm>
          </Form.Item>
        </SettingSection>

        <SettingSection title="关于" hidden={activeTab !== 'general'}>
          <Form.Item label="开发者">
            <Text type="secondary">vien.meng</Text>
          </Form.Item>
          <Form.Item label="项目开源地址">
            <Button
              type="link"
              onClick={() => {
                if (coralProjectLinks.projectRepository) {
                  appService.openUrl(coralProjectLinks.projectRepository);
                }
              }}
              disabled={!coralProjectLinks.projectRepository}
            >
              vien-meng/coral-music-desktop
            </Button>
          </Form.Item>
          <Form.Item label="项目最新版本">
            <Button
              type="link"
              onClick={() => {
                if (coralProjectLinks.projectReleases) {
                  appService.openUrl(coralProjectLinks.projectReleases);
                }
              }}
              disabled={!coralProjectLinks.projectReleases}
            >
              下载地址
            </Button>
          </Form.Item>
          <Form.Item label="项目常见问题">
            <Button
              type="link"
              onClick={() => {
                if (coralProjectLinks.projectFaq) {
                  appService.openUrl(coralProjectLinks.projectFaq);
                }
              }}
              disabled={!coralProjectLinks.projectFaq}
            >
              FAQ.md
            </Button>
          </Form.Item>
          <Form.Item label="项目问题反馈">
            <Button
              type="link"
              onClick={() => {
                if (coralProjectLinks.projectIssues) {
                  appService.openUrl(coralProjectLinks.projectIssues);
                }
              }}
              disabled={!coralProjectLinks.projectIssues}
            >
              提交 Issue
            </Button>
          </Form.Item>
          <Alert
            type="info"
            showIcon
            title="珊瑚音乐完全免费开源"
            description="当前迁移版仍保留部分内部兼容层；正式发布渠道请以珊瑚音乐项目配置为准。"
            className="coral-settings-wide-item"
          />
        </SettingSection>

        <OnlineImportModal
          open={isOnlineImportOpen}
          loading={userApi.isMutating}
          onClose={() => {
            setIsOnlineImportOpen(false);
          }}
          onSubmit={async (url) => {
            await handleImportOnline(url);
            if (!userApi.actionError) setIsOnlineImportOpen(false);
          }}
        />

        <ThemeSelectorModal
          appSetting={appSetting}
          darkThemes={theme.darkThemes}
          lightThemes={theme.lightThemes}
          open={isThemeSelectorOpen}
          themeInfo={theme.themeInfo}
          onClose={() => {
            setIsThemeSelectorOpen(false);
          }}
          onEdit={(id) => {
            setIsThemeSelectorOpen(false);
            setEditingThemeId(id);
            setIsThemeEditOpen(true);
          }}
          onRemove={(id) => {
            theme.removeUserTheme(id);
          }}
          onSelectDark={(id) => {
            theme.setDarkThemeId(id);
            setIsThemeSelectorOpen(false);
          }}
          onSelectLight={(id) => {
            theme.setLightThemeId(id);
            setIsThemeSelectorOpen(false);
          }}
        />

        <DislikeListModal
          open={isDislikeListOpen}
          onClose={() => {
            setIsDislikeListOpen(false);
          }}
        />

        <PlayTimeoutModal
          open={isPlayTimeoutOpen}
          onClose={() => {
            setIsPlayTimeoutOpen(false);
          }}
        />

        <ThemeEditModal
          open={isThemeEditOpen}
          themeId={editingThemeId}
          onClose={() => {
            setIsThemeEditOpen(false);
          }}
          onSaved={(savedTheme) => {
            theme.applyTheme(savedTheme);
          }}
        />
      </Space>
    </Spin>
  );
});
