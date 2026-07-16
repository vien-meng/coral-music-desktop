import { AudioMutedOutlined, SoundOutlined } from '@ant-design/icons';
import { Checkbox, Popover, Slider, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const getVolumeIcon = (volume: number, isMute: boolean) => {
  if (isMute || volume === 0) return <AudioMutedOutlined />;
  return <SoundOutlined />;
};

export const VolumeBtn = observer(() => {
  const { player } = rootStore;
  const volume = player.volume;
  const isMute = player.isMute;

  const handleVolumeChange = (value: number): void => {
    player.setVolume(value, false);
  };

  const handleMuteToggle = (checked: boolean): void => {
    player.setMute(checked);
  };

  const adjustVolume = (delta: number): void => {
    player.setVolume(Math.max(0, Math.min(1, player.volume + delta)));
  };

  const handleWheel = (event: React.WheelEvent): void => {
    if (!event.deltaY) return;
    event.preventDefault();
    adjustVolume(event.deltaY > 0 ? -0.05 : 0.05);
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    adjustVolume(event.key === 'ArrowUp' ? 0.05 : -0.05);
  };

  const content = (
    <div
      aria-label="音量控制"
      role="group"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={(event) => {
        event.currentTarget.focus({ preventScroll: true });
      }}
      onWheel={handleWheel}
      style={{ width: 200, padding: '8px 0' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text>音量</Text>
        <Text type="secondary">{Math.round(volume * 100)}%</Text>
      </div>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleVolumeChange}
        onChangeComplete={(value) => {
          player.setVolume(value);
        }}
        tooltip={{ formatter: (value) => `${Math.round((value ?? 0) * 100)}%` }}
      />
      <Checkbox
        checked={isMute}
        onChange={(event) => {
          handleMuteToggle(event.target.checked);
        }}
        style={{ marginTop: 8 }}
      >
        静音
      </Checkbox>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="topRight">
      <button
        aria-label={isMute ? '取消静音' : '音量'}
        onKeyDown={handleKeyDown}
        onMouseEnter={(event) => {
          event.currentTarget.focus({ preventScroll: true });
        }}
        onWheel={handleWheel}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '0 8px',
          color: 'var(--color-font)',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {getVolumeIcon(volume, isMute)}
      </button>
    </Popover>
  );
});
