import { ThunderboltOutlined } from '@ant-design/icons';
import { Button, Checkbox, Popover, Slider, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const MIN_RATE = 50;
const MAX_RATE = 200;

export const PlaybackRateBtn = observer(() => {
  const { player, settings } = rootStore;
  const playbackRate = player.playbackRate;
  const sliderValue = Math.round(playbackRate * 100);
  const isActive = playbackRate !== 1;

  const handleRateChange = (value: number): void => {
    player.setPlaybackRate(value / 100);
  };

  const handleReset = (): void => {
    player.setPlaybackRate(1);
  };

  const handlePreservesPitch = (checked: boolean): void => {
    settings.updateAppSetting({ 'player.preservesPitch': checked });
  };

  const content = (
    <div style={{ width: 220, padding: '8px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text>播放速率</Text>
        <Text type="secondary">{playbackRate.toFixed(2)}x</Text>
      </div>
      <Slider
        min={MIN_RATE}
        max={MAX_RATE}
        step={5}
        value={sliderValue}
        onChange={handleRateChange}
        tooltip={{ formatter: (value) => `${((value ?? 100) / 100).toFixed(2)}x` }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Checkbox
          checked={settings.appSetting?.['player.preservesPitch'] ?? true}
          onChange={(event) => {
            handlePreservesPitch(event.target.checked);
          }}
        >
          保持音高
        </Checkbox>
        <Button size="small" onClick={handleReset}>
          重置
        </Button>
      </div>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="topRight">
      <button
        aria-label="播放速率"
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '0 8px',
          color: isActive ? 'var(--color-primary)' : 'var(--color-font)',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ThunderboltOutlined />
      </button>
    </Popover>
  );
});
