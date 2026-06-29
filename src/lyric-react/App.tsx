import { ConfigProvider, Typography } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { createCoralAntdTheme } from '@shared/theme/antdTheme';
import { lyricRootStore } from './stores/lyricRootStore';
import { AudioVisualizer } from './components/common';
import { ControlBar, LyricHorizontal, LyricVertical, ResizeHandles } from './components/layout';
import { useLyricWindowInteraction } from './hooks/useLyricWindowInteraction';

const { Text } = Typography;

export const LyricApp = observer(() => {
  const windowInteraction = useLyricWindowInteraction();
  const shellClassName = [
    'lyric-shell',
    lyricRootStore.isLocked ? 'locked' : null,
    lyricRootStore.shouldHide ? 'hidden' : null,
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    lyricRootStore.initialize();
  }, []);

  return (
    <ConfigProvider locale={zhCN} theme={createCoralAntdTheme(lyricRootStore.themeMode)}>
      <main
        className={shellClassName}
        style={lyricRootStore.lyricStyle}
        onMouseEnter={() => {
          lyricRootStore.setMouseInWindow(true);
        }}
        onMouseLeave={() => {
          lyricRootStore.setMouseInWindow(false);
        }}
        onMouseDown={windowInteraction.handleMoveMouseDown}
        onTouchStart={windowInteraction.handleMoveTouchStart}
      >
        <AudioVisualizer />
        {!lyricRootStore.isLocked ? <ControlBar /> : null}
        <div className="lyric-meta">
          <Text>{lyricRootStore.musicInfo.name}</Text>
          <Text type="secondary">{lyricRootStore.musicInfo.singer}</Text>
        </div>
        {lyricRootStore.direction === 'vertical' ? <LyricVertical /> : <LyricHorizontal />}
        {lyricRootStore.hydrateError ? (
          <Text className="lyric-error">{lyricRootStore.hydrateError}</Text>
        ) : null}
        {!lyricRootStore.isLocked ? <ResizeHandles interaction={windowInteraction} /> : null}
      </main>
    </ConfigProvider>
  );
});
