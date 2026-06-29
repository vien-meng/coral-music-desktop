import Lyric, { type LyricPlayerLine } from '@common/utils/lyric-font-player';

export type LyricTimelineLine = LyricPlayerLine;

interface LyricTimelineCallbacks {
  onPlay: (line: number, text: string) => void;
  onSetLyric: (lines: LyricTimelineLine[], offset: number) => void;
  onUpdateLyric: (lines: LyricTimelineLine[]) => void;
}

const getDisplayLyric = (
  lyrics: {
    lyric: string;
    lxlyric: string | null;
  },
  config: LX.DesktopLyric.Config,
): string => (config['player.isPlayLxlrc'] && lyrics.lxlyric ? lyrics.lxlyric : lyrics.lyric);

const getExtendedLyrics = (
  lyrics: {
    rlyric: string | null;
    tlyric: string | null;
  },
  config: LX.DesktopLyric.Config,
): string[] => {
  const extendedLyrics: string[] = [];

  if (config['player.isShowLyricRoma'] && lyrics.rlyric) extendedLyrics.push(lyrics.rlyric);
  if (config['player.isShowLyricTranslation'] && lyrics.tlyric) extendedLyrics.push(lyrics.tlyric);
  if (config['player.isSwapLyricTranslationAndRoma']) extendedLyrics.reverse();

  return extendedLyrics;
};

export class LyricTimelineService {
  private readonly callbacks: LyricTimelineCallbacks;

  private player: Lyric | null = null;

  constructor(callbacks: LyricTimelineCallbacks) {
    this.callbacks = callbacks;
  }

  init(config: LX.DesktopLyric.Config): void {
    this.player = new Lyric({
      activeLineClassName: 'active',
      isVertical: config['desktopLyric.direction'] === 'vertical',
      rate: config['player.playbackRate'],
      shadowContent: true,
      onPlay: this.callbacks.onPlay,
      onSetLyric: this.callbacks.onSetLyric,
      onUpdateLyric: this.callbacks.onUpdateLyric,
    });
  }

  setLyric(
    lyrics: {
      lyric: string;
      lxlyric: string | null;
      rlyric: string | null;
      tlyric: string | null;
    },
    config: LX.DesktopLyric.Config,
  ): void {
    this.player?.setLyric(getDisplayLyric(lyrics, config), getExtendedLyrics(lyrics, config));
  }

  play(time: number): void {
    this.player?.play(time);
  }

  pause(): void {
    this.player?.pause();
  }

  stop(): void {
    this.player?.setLyric('');
  }

  setLyricOffset(offset: number): void {
    this.player?.setOffset(offset);
  }

  setPlaybackRate(rate: number): void {
    this.player?.setPlaybackRate(rate);
  }

  setVertical(isVertical: boolean): void {
    this.player?.setVertical(isVertical);
  }
}
