export type PlayerRuntimeStatus = Partial<LX.Player.Status> & {
  actualQuality?: LX.Quality;
  errorText?: string;
  isEnded?: boolean;
  /** 在线音频探测到的实际采样率 (Hz) */
  probeSampleRate?: number | null;
  /** 在线音频探测到的实际比特率 (bps) */
  probeBitrate?: number | null;
  /** 在线音频探测到的格式 */
  probeFormat?: string | null;
};
export type PlayerStatusListener = (status: PlayerRuntimeStatus) => void;
export type PlayerRuntimeMusicInfo = LX.Music.MusicInfo | LX.Download.ListItem;
export type PlayerEqFrequency = 31 | 62 | 125 | 250 | 500 | 1000 | 2000 | 4000 | 8000 | 16000;

export interface PlayerSoundEffectConfig {
  eqGains: Record<PlayerEqFrequency, number>;
  pannerEnabled: boolean;
  pannerSoundR: number;
  pitchPlaybackRate: number;
}

export interface PlayerRuntimePlayOptions {
  isRefresh?: boolean;
  preferredQuality?: LX.Quality;
}

export interface PlayerRuntimeBridge {
  getAnalyser?: () => AnalyserNode | null;
  playMusic: (musicInfo?: PlayerRuntimeMusicInfo, options?: PlayerRuntimePlayOptions) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMute: (isMute: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setSoundEffectConfig?: (config: PlayerSoundEffectConfig) => void;
  onStatus: (listener: PlayerStatusListener) => () => void;
  dispose: () => void;
}
