import {
  RetweetOutlined,
  OrderedListOutlined,
  ReloadOutlined,
  SwapOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Popover, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

type PlayMode = 'listLoop' | 'random' | 'list' | 'singleLoop' | 'none';

const PLAY_MODE_ICONS: Record<PlayMode, ReactNode> = {
  listLoop: <RetweetOutlined />,
  random: <SwapOutlined />,
  list: <OrderedListOutlined />,
  singleLoop: <ReloadOutlined />,
  none: <StopOutlined />,
};

const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  listLoop: '列表循环',
  random: '随机播放',
  list: '顺序播放',
  singleLoop: '单曲循环',
  none: '关闭',
};

export const TogglePlayModeBtn = observer(() => {
  const { settings } = rootStore;
  const currentMode = (settings.appSetting?.['player.togglePlayMethod'] ?? 'listLoop') as PlayMode;

  const handleSetMode = (mode: PlayMode): void => {
    void settings.updateAppSetting({ 'player.togglePlayMethod': mode });
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
      {(Object.keys(PLAY_MODE_LABELS) as PlayMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => {
            handleSetMode(mode);
          }}
          style={{
            border: 'none',
            background: mode === currentMode ? 'var(--color-primary-alpha-100)' : 'transparent',
            cursor: 'pointer',
            padding: '6px 16px',
            textAlign: 'left',
            color: mode === currentMode ? 'var(--color-primary)' : 'var(--color-font)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
          }}
        >
          {PLAY_MODE_ICONS[mode]}
          <Text>{PLAY_MODE_LABELS[mode]}</Text>
        </button>
      ))}
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="topRight">
      <button
        aria-label={PLAY_MODE_LABELS[currentMode]}
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
        {PLAY_MODE_ICONS[currentMode]}
      </button>
    </Popover>
  );
});
