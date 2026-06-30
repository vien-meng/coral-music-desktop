import {
  DesktopOutlined,
  CustomerServiceOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { Button, Flex, Space, Tooltip, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../stores/rootStore';
import { PlaybackRateBtn } from './PlaybackRateBtn';
import { PlayDetailOverlay } from './PlayDetailOverlay';
import { PlayQueueBtn } from './PlayQueueBtn';
import { ProgressBar } from './ProgressBar';
import { QualitySwitchBtn } from './QualitySwitchBtn';
import { SoundEffectBtn } from './SoundEffectBtn';
import { TogglePlayModeBtn } from './TogglePlayModeBtn';
import { VolumeBtn } from './VolumeBtn';

const { Text } = Typography;

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const PlayBar = observer(() => {
  const { player, settings, ui } = rootStore;
  const isPlaying = player.isPlaying;
  const statusText = player.errorText || player.statusText;
  const subtitleText = [statusText || player.displaySinger, player.queuePositionText]
    .filter(Boolean)
    .join(' · ');

  const nowPlayTimeStr = formatTime(player.currentTime);
  const maxPlayTimeStr = formatTime(player.maxPlayTime);

  const handleSeek = (seconds: number): void => {
    player.seek(seconds);
  };

  const handleToggleDesktopLyric = (): void => {
    const enabled = settings.appSetting?.['desktopLyric.enable'] ?? false;
    settings.updateAppSetting({ 'desktopLyric.enable': !enabled });
  };

  return (
    <div className="coral-playbar">
      <Flex align="center" justify="space-between" gap={16} className="coral-playbar-inner">
        <button
          type="button"
          className="coral-playbar-info-button"
          aria-label="打开播放详情"
          onClick={() => {
            player.openPlayDetail();
          }}
        >
          <span className="coral-playbar-cover">
            {player.coverUrl ? (
              <img
                src={player.coverUrl}
                alt={player.displayName}
                className="coral-playbar-cover-img"
              />
            ) : (
              <CustomerServiceOutlined className="coral-playbar-cover-icon" />
            )}
          </span>
          <span className="coral-playbar-meta">
            <Text ellipsis className="coral-playbar-title">
              {player.displayName}
            </Text>
            <Text
              type={player.errorText ? 'danger' : 'secondary'}
              ellipsis
              className="coral-playbar-subtitle"
            >
              {subtitleText}
            </Text>
          </span>
        </button>

        <Flex align="center" gap={8} className="coral-playbar-progress-wrap">
          <Text type="secondary" className="coral-playbar-time">
            {nowPlayTimeStr}
          </Text>
          <ProgressBar
            progress={player.progress}
            maxPlayTime={player.maxPlayTime}
            isActiveTransition={false}
            onSeek={handleSeek}
            className="coral-playbar-progress"
          />
          <Text type="secondary" className="coral-playbar-time">
            {maxPlayTimeStr}
          </Text>
        </Flex>

        <Space size="small" className="coral-playbar-controls">
          <Button
            aria-label="上一首"
            icon={<StepBackwardOutlined />}
            shape="circle"
            onClick={() => {
              player.playPrev();
            }}
          />
          <Button
            aria-label={isPlaying ? '暂停' : '播放'}
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            shape="circle"
            type="primary"
            size="large"
            onClick={() => {
              player.togglePlay();
            }}
          />
          <Button
            aria-label="下一首"
            icon={<StepForwardOutlined />}
            shape="circle"
            onClick={() => {
              player.playNext();
            }}
          />
          <Tooltip title="桌面歌词">
            <Button
              aria-label="桌面歌词"
              icon={<DesktopOutlined />}
              shape="circle"
              type={settings.appSetting?.['desktopLyric.enable'] ? 'primary' : 'default'}
              onClick={handleToggleDesktopLyric}
            />
          </Tooltip>
          <QualitySwitchBtn />
          <PlayQueueBtn />
          <VolumeBtn />
          <TogglePlayModeBtn />
          <SoundEffectBtn />
          <PlaybackRateBtn />
          {player.needsSourcePlugin ? (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                ui.setActiveRoute('setting');
                ui.requestQuickAction('importUserApiFile');
              }}
            >
              添加音源
            </Button>
          ) : null}
          {player.needsExternalDecoder ? (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                ui.setActiveRoute('setting');
                ui.requestQuickAction('configureExternalDecoder');
              }}
            >
              配置解码器
            </Button>
          ) : null}
        </Space>
      </Flex>
      <PlayDetailOverlay />
    </div>
  );
});
