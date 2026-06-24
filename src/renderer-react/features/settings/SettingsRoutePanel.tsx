import {
  BgColorsOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LinkOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
} from 'antd'
import { observer } from 'mobx-react-lite'
import { useState, type ReactNode } from 'react'
import { TRAY_AUTO_ID } from '@common/constants'
import { sizeFormate } from '@common/utils/common'
import { readFile } from '@common/utils/nodejs'
import { appService } from '../../services/appService'
import { backupService } from '../../services/backupService'
import { cacheService } from '../../services/cacheService'
import { listService } from '../../services/listService'
import { rootStore } from '../../stores/rootStore'
import { DislikeListModal } from './DislikeListModal'
import { HotKeySection } from './HotKeySection'
import { PlayTimeoutModal } from './PlayTimeoutModal'
import { ThemeEditModal } from './ThemeEditModal'

const { Text } = Typography

type BooleanSettingKey = {
  [Key in keyof LX.AppSetting]: LX.AppSetting[Key] extends boolean
    ? Key
    : never;
}[keyof LX.AppSetting]

interface SettingSectionProps {
  children: ReactNode
  title: string
}

interface SettingSwitchProps {
  appSetting: LX.AppSetting
  disabled?: boolean
  label: string
  settingKey: BooleanSettingKey
  updateSetting: (setting: Partial<LX.AppSetting>) => void
}

const playQualityOptions: Array<{ label: string, value: LX.Quality }> = [
  { label: '128k', value: '128k' },
  { label: '320k', value: '320k' },
  { label: 'FLAC', value: 'flac' },
  { label: 'Hi-Res', value: 'flac24bit' },
]

const maxDownloadOptions = [1, 2, 3, 4, 5, 6].map((value) => ({
  label: `${value}`,
  value,
}))

const lyricAlignOptions = [
  { label: '左侧', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧', value: 'right' },
]

const SettingSection = ({ children, title }: SettingSectionProps) => (
  <section className="coral-settings-section">
    <Divider orientation="left">{title}</Divider>
    <Form layout="vertical">{children}</Form>
  </section>
)

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
        const nextSetting: Partial<LX.AppSetting> = {
          [settingKey]: checked,
        }
        updateSetting(nextSetting)
      }}
    />
  </Form.Item>
)

interface OnlineImportModalProps {
  loading: boolean
  onClose: () => void
  onSubmit: (url: string) => void | Promise<void>
  open: boolean
}

const OnlineImportModal = ({
  loading,
  onClose,
  onSubmit,
  open,
}: OnlineImportModalProps) => {
  const [url, setUrl] = useState('')

  const handleSubmit = () => {
    const trimmed = url.trim()
    if (!/^https?:\/\//.test(trimmed)) return
    void onSubmit(trimmed)
  }

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
          setUrl(event.target.value)
        }}
        onPressEnter={handleSubmit}
      />
    </Modal>
  )
}

interface ThemeSelectorModalProps {
  appSetting: LX.AppSetting
  darkThemes: LX.Theme[]
  lightThemes: LX.Theme[]
  onClose: () => void
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onSelectDark: (id: string) => void
  onSelectLight: (id: string) => void
  open: boolean
}

const ThemeSwatch = ({
  active,
  name,
  onClick,
  onEdit,
  primaryColor,
  onRemove,
}: {
  active: boolean
  name: string
  onClick: () => void
  onEdit?: () => void
  primaryColor: string
  onRemove?: () => void
}) => (
  <div
    className={`coral-theme-swatch${active ? ' coral-theme-swatch-active' : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onClick()
      }
    }}
  >
    <div
      className="coral-theme-swatch-bg"
      style={{ backgroundColor: primaryColor }}
    >
      {onEdit ? (
        <EditOutlined
          className="coral-theme-swatch-edit"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
        />
      ) : null}
      {onRemove ? (
        <DeleteOutlined
          className="coral-theme-swatch-remove"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        />
      ) : null}
    </div>
    <div className="coral-theme-swatch-label">{name}</div>
  </div>
)

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
}: ThemeSelectorModalProps) => (
  <Modal
    open={open}
    title="主题选择"
    onCancel={onClose}
    footer={null}
    width={520}
  >
    <div className="coral-theme-selector">
      <div className="coral-theme-selector-group">
        <h3>浅色主题</h3>
        <div className="coral-theme-selector-list">
          {lightThemes.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              active={appSetting['theme.lightId'] === theme.id}
              name={theme.isCustom ? theme.name : theme.name}
              primaryColor={theme.config.themeColors['--color-theme']}
              onClick={() => {
                onSelectLight(theme.id)
              }}
              onEdit={
                theme.isCustom
                  ? () => {
                      onEdit(theme.id)
                    }
                  : undefined
              }
              onRemove={
                theme.isCustom
                  ? () => {
                      onRemove(theme.id)
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
              primaryColor={theme.config.themeColors['--color-theme']}
              onClick={() => {
                onSelectDark(theme.id)
              }}
              onEdit={
                theme.isCustom
                  ? () => {
                      onEdit(theme.id)
                    }
                  : undefined
              }
              onRemove={
                theme.isCustom
                  ? () => {
                      onRemove(theme.id)
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  </Modal>
)

export const SettingsRoutePanel = observer(() => {
  const { settings, sync, theme, userApi, dislike, list } = rootStore
  const appSetting = settings.appSetting
  const [isOnlineImportOpen, setIsOnlineImportOpen] = useState(false)
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false)
  const [isDislikeListOpen, setIsDislikeListOpen] = useState(false)
  const [isPlayTimeoutOpen, setIsPlayTimeoutOpen] = useState(false)
  const [isThemeEditOpen, setIsThemeEditOpen] = useState(false)
  const [editingThemeId, setEditingThemeId] = useState<string | undefined>()
  const [cacheSize, setCacheSize] = useState(0)
  const [otherSourceCount, setOtherSourceCount] = useState(0)
  const [musicUrlCount, setMusicUrlCount] = useState(0)
  const [lyricRawCount, setLyricRawCount] = useState(0)
  const [lyricEditedCount, setLyricEditedCount] = useState(0)

  if (!appSetting) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="设置尚未加载" />
    )
  }

  const applySetting = (setting: Partial<LX.AppSetting>): void => {
    void settings.updateAppSetting(setting)
  }

  const syncServerDevices = sync.serverDevices ?? []

  const removeUserApi = async(api: LX.UserApi.UserApiInfo): Promise<void> => {
    if (api.id === appSetting['common.apiSource']) {
      const fallbackApiId =
        userApi.userApis.find((userApiInfo) => userApiInfo.id !== api.id)?.id ??
        ''
      await settings.updateAppSetting({ 'common.apiSource': fallbackApiId })
    }

    await userApi.removeUserApis([api.id])
  }

  const handleImportFile = async(): Promise<void> => {
    if (userApi.userApis.length > 20) {
      Modal.warning({ title: '提示', content: '最多支持 20 个自定义源' })
      return
    }

    const result = await appService.showSelectDialog({
      title: '导入文件',
      properties: ['openFile'],
      filters: [
        { name: 'LX API File', extensions: ['js'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    if (result.canceled || !result.filePaths.length) return

    const buffer = await readFile(result.filePaths[0])
    await userApi.importUserApi(buffer.toString())
  }

  const handleImportOnline = async(url: string): Promise<void> => {
    if (!/^https?:\/\//.test(url)) return

    let script: string
    try {
      const response = await fetch(url)
      script = await response.text()
    } catch (error) {
      userApi.actionError =
        error instanceof Error ? error.message : String(error)
      return
    }

    if (script.length > 9_000_000) {
      Modal.error({ title: '导入失败', content: '脚本文件过大' })
      return
    }

    await userApi.importUserApi(script)
  }

  const handleSetCurrentApi = async(
    api: LX.UserApi.UserApiInfo,
  ): Promise<void> => {
    if (api.id === appSetting['common.apiSource']) return
    await userApi.setUserApi(api.id)
    await settings.updateAppSetting({ 'common.apiSource': api.id })
  }

  const updateSetting = <Key extends keyof LX.AppSetting>(
    key: Key,
    value: LX.AppSetting[Key],
  ): void => {
    const nextSetting: Partial<LX.AppSetting> = {
      [key]: value,
    }
    applySetting(nextSetting)
  }

  return (
    <Spin spinning={settings.isHydrating || settings.isSaving}>
      <Space
        direction="vertical"
        size="middle"
        className="coral-wide coral-settings-panel"
      >
        {settings.hydrateError ? (
          <Alert showIcon type="error" message={settings.hydrateError} />
        ) : null}
        {settings.saveError ? (
          <Alert showIcon type="error" message={settings.saveError} />
        ) : null}

        <SettingSection title="主题">
          {theme.hydrateError ? (
            <Alert
              showIcon
              type="error"
              message={theme.hydrateError}
              className="coral-settings-wide-item"
            />
          ) : null}
          <Form.Item label="主题模式">
            <Radio.Group
              value={theme.themeMode}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
              ]}
              onChange={(event) => {
                void theme.setThemeMode(event.target.value)
              }}
            />
          </Form.Item>
          <Form.Item label="主题选择">
            <Space wrap>
              <Button
                icon={<BgColorsOutlined />}
                onClick={() => {
                  setIsThemeSelectorOpen(true)
                }}
              >
                选择主题
              </Button>
              <Button
                onClick={() => {
                  setEditingThemeId(undefined)
                  setIsThemeEditOpen(true)
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

        <SettingSection title="基础">
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
                updateSetting('common.controlBtnPosition', event.target.value)
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
                updateSetting(
                  'common.playBarProgressStyle',
                  event.target.value,
                )
              }}
            />
          </Form.Item>
          <Form.Item label="字体大小">
            <InputNumber
              min={12}
              max={24}
              value={appSetting['common.fontSize']}
              onChange={(value) => {
                if (value != null) updateSetting('common.fontSize', value)
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="播放">
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
                setIsPlayTimeoutOpen(true)
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
                updateSetting('player.playQuality', value)
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="播放详情">
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
                updateSetting('playDetail.style.align', event.target.value)
              }}
            />
          </Form.Item>
          <Form.Item label="歌词字号">
            <InputNumber
              min={80}
              max={220}
              value={appSetting['playDetail.style.fontSize']}
              onChange={(value) => {
                if (value != null) { updateSetting('playDetail.style.fontSize', value) }
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="桌面歌词">
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
                updateSetting('desktopLyric.direction', event.target.value)
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
                updateSetting('desktopLyric.scrollAlign', event.target.value)
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
                updateSetting('desktopLyric.style.align', event.target.value)
              }}
            />
          </Form.Item>
          <Form.Item label="字号">
            <InputNumber
              min={12}
              max={80}
              value={appSetting['desktopLyric.style.fontSize']}
              onChange={(value) => {
                if (value != null) { updateSetting('desktopLyric.style.fontSize', value) }
              }}
            />
          </Form.Item>
          <Form.Item label="行距">
            <InputNumber
              min={0}
              max={80}
              value={appSetting['desktopLyric.style.lineGap']}
              onChange={(value) => {
                if (value != null) { updateSetting('desktopLyric.style.lineGap', value) }
              }}
            />
          </Form.Item>
          <Form.Item label="透明度">
            <InputNumber
              min={10}
              max={100}
              value={appSetting['desktopLyric.style.opacity']}
              onChange={(value) => {
                if (value != null) { updateSetting('desktopLyric.style.opacity', value) }
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="列表">
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
                updateSetting('list.addMusicLocationType', event.target.value)
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="下载">
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
            label="换源下载"
            settingKey="download.isUseOtherSource"
            updateSetting={applySetting}
          />
          <Form.Item label="最大并发">
            <Select
              value={appSetting['download.maxDownloadNum']}
              options={maxDownloadOptions}
              className="coral-settings-number-select"
              onChange={(value) => {
                updateSetting('download.maxDownloadNum', value)
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
                updateSetting('download.fileName', event.target.value)
              }}
            />
          </Form.Item>
          <Form.Item label="歌词文件">
            <Space wrap>
              <Switch
                checked={appSetting['download.isDownloadLrc']}
                onChange={(checked) => {
                  updateSetting('download.isDownloadLrc', checked)
                }}
              />
              <Text type="secondary">
                {appSetting['download.lrcFormat'].toUpperCase()}
              </Text>
            </Space>
          </Form.Item>
          <Form.Item label="保存路径">
            <Text ellipsis className="coral-settings-path">
              {appSetting['download.savePath']}
            </Text>
          </Form.Item>
        </SettingSection>

        <SettingSection title="搜索">
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

        <SettingSection title="更新">
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

        <SettingSection title="网络">
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
                updateSetting('network.proxy.host', event.target.value.trim())
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur()
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
                updateSetting('network.proxy.port', event.target.value.trim())
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur()
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="ODC">
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

        <SettingSection title="同步">
          {sync.actionError ? (
            <Alert
              showIcon
              type="error"
              message={sync.actionError}
              className="coral-settings-wide-item"
            />
          ) : null}
          <SettingSwitch
            appSetting={appSetting}
            label="启用同步"
            settingKey="sync.enable"
            updateSetting={applySetting}
          />
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
                updateSetting('sync.mode', event.target.value)
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
                updateSetting('sync.server.port', event.target.value.trim())
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur()
              }}
            />
          </Form.Item>
          <Form.Item label="客户端地址">
            <Input
              allowClear
              disabled={appSetting['sync.enable']}
              defaultValue={appSetting['sync.client.host']}
              placeholder="http://127.0.0.1:23332"
              className="coral-settings-input"
              onBlur={(event) => {
                updateSetting('sync.client.host', event.target.value.trim())
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur()
              }}
            />
          </Form.Item>
          <Form.Item label="最大快照数">
            <InputNumber
              min={1}
              max={30}
              disabled={appSetting['sync.enable']}
              value={appSetting['sync.server.maxSsnapshotNum']}
              onChange={(value) => {
                if (value != null) { updateSetting('sync.server.maxSsnapshotNum', value) }
              }}
            />
          </Form.Item>
          <Form.Item label="服务端设备" className="coral-settings-wide-item">
            <Space direction="vertical" size="small" className="coral-wide">
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  loading={sync.isHydrating}
                  onClick={() => {
                    void sync.refreshServerDevices()
                  }}
                >
                  刷新
                </Button>
                <Button
                  icon={<KeyOutlined />}
                  loading={sync.isMutating}
                  onClick={() => {
                    void sync.generateCode()
                  }}
                >
                  配对码
                </Button>
              </Space>
              <List
                size="small"
                dataSource={syncServerDevices}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无设备"
                    />
                  ),
                }}
                renderItem={(device) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="remove"
                        title="移除设备"
                        description={device.deviceName}
                        okText="移除"
                        cancelText="取消"
                        onConfirm={() => {
                          void sync.removeServerDevice(device.clientId)
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
                    <List.Item.Meta
                      title={device.deviceName}
                      description={device.clientId}
                    />
                  </List.Item>
                )}
              />
            </Space>
          </Form.Item>
        </SettingSection>

        <SettingSection title="OpenAPI">
          <SettingSwitch
            appSetting={appSetting}
            label="启用 OpenAPI"
            settingKey="openAPI.enable"
            updateSetting={applySetting}
          />
          <SettingSwitch
            appSetting={appSetting}
            label="绑定局域网"
            settingKey="openAPI.bindLan"
            updateSetting={applySetting}
          />
          <Form.Item label="端口">
            <Input
              allowClear
              defaultValue={appSetting['openAPI.port']}
              placeholder="23330"
              className="coral-settings-number-input"
              onBlur={(event) => {
                updateSetting('openAPI.port', event.target.value.trim())
              }}
              onPressEnter={(event) => {
                event.currentTarget.blur()
              }}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="User API">
          {userApi.hydrateError ? (
            <Alert
              showIcon
              type="error"
              message={userApi.hydrateError}
              className="coral-settings-wide-item"
            />
          ) : null}
          {userApi.actionError ? (
            <Alert
              showIcon
              type="error"
              message={userApi.actionError}
              className="coral-settings-wide-item"
            />
          ) : null}
          <Form.Item className="coral-settings-wide-item">
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                loading={userApi.isHydrating}
                onClick={() => {
                  void userApi.refreshUserApis()
                }}
              >
                刷新
              </Button>
              <Button
                icon={<UploadOutlined />}
                loading={userApi.isMutating}
                onClick={() => {
                  void handleImportFile()
                }}
              >
                导入文件
              </Button>
              <Button
                icon={<LinkOutlined />}
                loading={userApi.isMutating}
                onClick={() => {
                  setIsOnlineImportOpen(true)
                }}
              >
                在线导入
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  void appService.openUrl(
                    'https://lyswhut.github.io/lx-music-doc/desktop/custom-source',
                  )
                }}
              >
                自定义源文档
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="已安装 API" className="coral-settings-wide-item">
            <List
              size="small"
              dataSource={userApi.userApis}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无 API"
                  />
                ),
              }}
              renderItem={(api) => (
                <List.Item
                  actions={[
                    <Button
                      key="set"
                      type={
                        api.id === appSetting['common.apiSource']
                          ? 'primary'
                          : 'default'
                      }
                      size="small"
                      disabled={api.id === appSetting['common.apiSource']}
                      loading={userApi.isMutating}
                      onClick={() => {
                        void handleSetCurrentApi(api)
                      }}
                    >
                      {api.id === appSetting['common.apiSource']
                        ? '当前'
                        : '设为当前'}
                    </Button>,
                    <Space key="update-alert" size={6}>
                      <Text type="secondary">提醒</Text>
                      <Switch
                        size="small"
                        checked={api.allowShowUpdateAlert}
                        loading={userApi.isMutating}
                        onChange={(checked) => {
                          void userApi.setAllowUpdateAlert(api.id, checked)
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
                        void removeUserApi(api)
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
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <Text>{api.name}</Text>
                        {api.version ? (
                          <Text type="secondary">{api.version}</Text>
                        ) : null}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        {api.description ? (
                          <Text type="secondary">{api.description}</Text>
                        ) : null}
                        <Space wrap size={8}>
                          {api.author ? (
                            <Text type="secondary">{api.author}</Text>
                          ) : null}
                          <Text type="secondary">
                            源 {Object.keys(api.sources ?? {}).length}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Form.Item>
        </SettingSection>

        <SettingSection title="快捷键">
          <HotKeySection />
        </SettingSection>

        <SettingSection title="备份">
            <Form.Item label="部分备份" className="coral-settings-wide-item">
              <Space wrap>
                <Button
                  size="small"
                  onClick={async() => {
                    const result = await appService.showSelectDialog({
                      title: '导入播放列表',
                      properties: ['openFile'],
                      filters: [
                        { name: 'Play List', extensions: ['json', 'lxmc'] },
                        { name: 'All Files', extensions: ['*'] },
                      ],
                    })
                    if (result.canceled || !result.filePaths.length) return
                    Modal.confirm({
                      title: '导入播放列表',
                      content: '将覆盖现有列表数据，是否继续？',
                      okText: '确认',
                      cancelText: '取消',
                      onOk: async() => backupService.importPlayList(result.filePaths[0]),
                    })
                  }}
                >
                  导入播放列表
                </Button>
                <Button
                  size="small"
                  onClick={async() => {
                    const result = await cacheService.showSaveDialog({
                      title: '导出播放列表',
                      defaultPath: 'lx_list.lxmc',
                    })
                    if (result.canceled || !result.filePath) return
                    await backupService.exportPlayList(result.filePath)
                  }}
                >
                  导出播放列表
                </Button>
                <Button
                  size="small"
                  onClick={async() => {
                    const result = await appService.showSelectDialog({
                      title: '导入设置',
                      properties: ['openFile'],
                      filters: [
                        { name: 'Setting', extensions: ['json', 'lxmc'] },
                        { name: 'All Files', extensions: ['*'] },
                      ],
                    })
                    if (result.canceled || !result.filePaths.length) return
                    await backupService.importSetting(result.filePaths[0])
                  }}
                >
                  导入设置
                </Button>
                <Button
                  size="small"
                  onClick={async() => {
                    const result = await cacheService.showSaveDialog({
                      title: '导出设置',
                      defaultPath: 'lx_setting_v2.lxmc',
                    })
                    if (result.canceled || !result.filePath) return
                    await backupService.exportSetting(result.filePath, appSetting)
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
                  onClick={async() => {
                    const result = await appService.showSelectDialog({
                      title: '导入全部数据',
                      properties: ['openFile'],
                      filters: [
                        { name: 'Setting', extensions: ['json', 'lxmc'] },
                        { name: 'All Files', extensions: ['*'] },
                      ],
                    })
                    if (result.canceled || !result.filePaths.length) return
                    Modal.confirm({
                      title: '导入全部数据',
                      content: '将覆盖现有列表和设置数据，是否继续？',
                      okText: '确认',
                      cancelText: '取消',
                      onOk: async() => backupService.importAllData(result.filePaths[0]),
                    })
                  }}
                >
                  导入全部数据
                </Button>
                <Button
                  size="small"
                  onClick={async() => {
                    const result = await cacheService.showSaveDialog({
                      title: '导出全部数据',
                      defaultPath: 'lx_datas_v2.lxmc',
                    })
                    if (result.canceled || !result.filePath) return
                    await backupService.exportAllData(result.filePath, appSetting)
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
                  onClick={async() => {
                    Modal.confirm({
                      title: '导出为文本',
                      content: '是否合并到一个文件？',
                      okText: '合并',
                      cancelText: '分开导出',
                      onOk: async() => {
                        const result = await cacheService.showSaveDialog({
                          title: '导出为文本',
                          defaultPath: 'lx_list_all.txt',
                        })
                        if (result.canceled || !result.filePath) return
                        let path = result.filePath
                        if (!path.endsWith('.txt')) path += '.txt'
                        await backupService.exportPlayListToText(path, true)
                      },
                      onCancel: async() => {
                        const result = await appService.showSelectDialog({
                          title: '选择导出目录',
                          properties: ['openDirectory'],
                        })
                        if (result.canceled || !result.filePaths.length) return
                        await backupService.exportPlayListToText(result.filePaths[0], false)
                      },
                    })
                  }}
                >
                  导出为文本
                </Button>
                <Button
                  size="small"
                  onClick={async() => {
                    Modal.confirm({
                      title: '导出为 CSV',
                      content: '是否合并到一个文件？',
                      okText: '合并',
                      cancelText: '分开导出',
                      onOk: async() => {
                        const result = await cacheService.showSaveDialog({
                          title: '导出为 CSV',
                          defaultPath: 'lx_list_all.csv',
                        })
                        if (result.canceled || !result.filePath) return
                        let path = result.filePath
                        if (!path.endsWith('.csv')) path += '.csv'
                        await backupService.exportPlayListToCsv(path, true, '歌曲名,歌手,专辑\n')
                      },
                      onCancel: async() => {
                        const result = await appService.showSelectDialog({
                          title: '选择导出目录',
                          properties: ['openDirectory'],
                        })
                        if (result.canceled || !result.filePaths.length) return
                        await backupService.exportPlayListToCsv(result.filePaths[0], false, '歌曲名,歌手,专辑\n')
                      },
                    })
                  }}
                >
                  导出为 CSV
                </Button>
              </Space>
            </Form.Item>
        </SettingSection>

        <SettingSection title="其他">
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
                updateSetting('tray.themeId', event.target.value)
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
                onConfirm={async() => {
                  await cacheService.clearCache()
                  setCacheSize(await cacheService.getCacheSize())
                }}
              >
                <Button size="small" danger>
                  清理
                </Button>
              </Popconfirm>
              <Button
                size="small"
                onClick={async() => {
                  setCacheSize(await cacheService.getCacheSize())
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
                onConfirm={async() => {
                  await cacheService.clearOtherSource()
                  setOtherSourceCount(await cacheService.getOtherSourceCount())
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
                onConfirm={async() => {
                  await cacheService.clearMusicUrl()
                  setMusicUrlCount(await cacheService.getMusicUrlCount())
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
                onConfirm={async() => {
                  await cacheService.clearLyricRaw()
                  setLyricRawCount(await cacheService.getLyricRawCount())
                }}
              >
                <Button size="small" danger>
                  清理
                </Button>
              </Popconfirm>
            </Space>
          </Form.Item>
          <Form.Item
            label="已编辑歌词缓存"
            className="coral-settings-wide-item"
          >
            <Space>
              <Text type="secondary">{lyricEditedCount} 首</Text>
              <Popconfirm
                title="清理已编辑歌词缓存"
                okText="清理"
                cancelText="取消"
                onConfirm={async() => {
                  await cacheService.clearLyricEdited()
                  setLyricEditedCount(await cacheService.getLyricEditedCount())
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
                  setIsDislikeListOpen(true)
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
              onConfirm={async() => {
                await listService.overwriteListFull({
                  defaultList: [],
                  loveList: [],
                  userList: list.userLists.map((info) => ({
                    ...info,
                    list: [],
                  })),
                })
                await list.hydrate()
              }}
            >
              <Button danger size="small">
                清空所有歌单
              </Button>
            </Popconfirm>
          </Form.Item>
        </SettingSection>

        <SettingSection title="关于">
          <Form.Item label="开源地址">
            <Button
              type="link"
              onClick={() => {
                void appService.openUrl(
                  'https://github.com/lyswhut/lx-music-desktop',
                )
              }}
            >
              GitHub
            </Button>
          </Form.Item>
          <Form.Item label="最新版本">
            <Button
              type="link"
              onClick={() => {
                void appService.openUrl(
                  'https://github.com/lyswhut/lx-music-desktop/releases',
                )
              }}
            >
              下载地址
            </Button>
          </Form.Item>
          <Form.Item label="常见问题">
            <Button
              type="link"
              onClick={() => {
                void appService.openUrl(
                  'https://lyswhut.github.io/lx-music-doc/faq',
                )
              }}
            >
              文档
            </Button>
          </Form.Item>
          <Form.Item label="问题反馈">
            <Button
              type="link"
              onClick={() => {
                void appService.openUrl(
                  'https://github.com/lyswhut/lx-music-desktop/issues',
                )
              }}
            >
              提交 Issue
            </Button>
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="珊瑚音乐完全免费开源"
            description="软件只有 GitHub 是原始发布渠道，没有客服、没有公众号，请注意防骗。"
          />
        </SettingSection>

        <OnlineImportModal
          open={isOnlineImportOpen}
          loading={userApi.isMutating}
          onClose={() => {
            setIsOnlineImportOpen(false)
          }}
          onSubmit={async(url) => {
            await handleImportOnline(url)
            if (!userApi.actionError) setIsOnlineImportOpen(false)
          }}
        />

        <ThemeSelectorModal
          appSetting={appSetting}
          darkThemes={theme.darkThemes}
          lightThemes={theme.lightThemes}
          open={isThemeSelectorOpen}
          onClose={() => {
            setIsThemeSelectorOpen(false)
          }}
          onEdit={(id) => {
            setIsThemeSelectorOpen(false)
            setEditingThemeId(id)
            setIsThemeEditOpen(true)
          }}
          onRemove={(id) => {
            void theme.removeUserTheme(id)
          }}
          onSelectDark={(id) => {
            void theme.setDarkThemeId(id)
          }}
          onSelectLight={(id) => {
            void theme.setLightThemeId(id)
          }}
        />

        <DislikeListModal
          open={isDislikeListOpen}
          onClose={() => {
            setIsDislikeListOpen(false)
          }}
        />

        <PlayTimeoutModal
          open={isPlayTimeoutOpen}
          onClose={() => {
            setIsPlayTimeoutOpen(false)
          }}
        />

        <ThemeEditModal
          open={isThemeEditOpen}
          themeId={editingThemeId}
          onClose={() => {
            setIsThemeEditOpen(false)
          }}
        />
      </Space>
    </Spin>
  )
})
