declare namespace Coral {
  namespace Player {
    interface ProgressBarOptions {
      progress: number;
      mode?: Electron.ProgressBarOptions['mode'];
    }

    type StatusButtonActions =
      'unCollect' | 'collect' | 'prev' | 'pause' | 'play' | 'next' | 'seek' | 'volume' | 'mute';

    interface LyricInfo extends Coral.Music.LyricInfo {
      rawlrcInfo: Coral.Music.LyricInfo;
    }

    interface Status {
      status: 'playing' | 'paused' | 'error' | 'stoped';
      name: string;
      singer: string;
      albumName: string;
      picUrl: string;
      progress: number;
      duration: number;
      playbackRate: number;
      lyricLineText: string;
      lyricLineAllText: string;
      lyric: string;
      tlyric: string;
      rlyric: string;
      lxlyric: string;
      collect: boolean;
      volume: number;
      mute: boolean;
    }
  }
}
