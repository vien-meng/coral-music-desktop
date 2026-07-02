import {
  makeAutoObservable,
  observable,
  reaction,
  runInAction,
  type IReactionDisposer,
} from 'mobx';
import {
  playerRuntimeBridge,
  type PlayerRuntimeBridge,
  type PlayerRuntimeMusicInfo,
  type PlayerRuntimePlayOptions,
  type PlayerSoundEffectConfig,
  type PlayerRuntimeStatus,
} from '../../services/playerService';
import { isExternalDecoderLocalMusic } from '../../services/playerRuntime/musicUrlResolver';
import { localAudioService } from '../../services/localAudioService';
import { localLyricService } from '../../services/localLyricService';
import { onlineMediaService } from '../../services/onlineMediaService';
import type { DislikeStore } from './dislikeStore';
import type { LibraryStore } from './libraryStore';
import type { ListStore } from './listStore';
import type { SettingsStore } from './settingsStore';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeStatusVolume = (volume: number): number => {
  if (!Number.isFinite(volume)) return 1;
  return volume > 1 ? clamp(volume / 100, 0, 1) : clamp(volume, 0, 1);
};

const getRuntimeMusicId = (musicInfo: PlayerRuntimeMusicInfo): string =>
  'progress' in musicInfo ? musicInfo.id : musicInfo.id;

const isDownloadMusicInfo = (
  musicInfo: PlayerRuntimeMusicInfo,
): musicInfo is Coral.Download.ListItem => 'progress' in musicInfo && 'metadata' in musicInfo;

const getRandomIndex = (length: number): number => Math.floor(Math.random() * length);

type PlayMode = Coral.AppSetting['player.togglePlayMethod'];

const createSoundEffectConfig = (setting: Coral.AppSetting): PlayerSoundEffectConfig => ({
  eqGains: {
    31: setting['player.soundEffect.biquadFilter.hz31'],
    62: setting['player.soundEffect.biquadFilter.hz62'],
    125: setting['player.soundEffect.biquadFilter.hz125'],
    250: setting['player.soundEffect.biquadFilter.hz250'],
    500: setting['player.soundEffect.biquadFilter.hz500'],
    1000: setting['player.soundEffect.biquadFilter.hz1000'],
    2000: setting['player.soundEffect.biquadFilter.hz2000'],
    4000: setting['player.soundEffect.biquadFilter.hz4000'],
    8000: setting['player.soundEffect.biquadFilter.hz8000'],
    16000: setting['player.soundEffect.biquadFilter.hz16000'],
  },
  pannerEnabled: setting['player.soundEffect.panner.enable'],
  pannerSoundR: setting['player.soundEffect.panner.soundR'],
  pitchPlaybackRate: setting['player.soundEffect.pitchShifter.playbackRate'],
});

const lrcTimeTagRxp = /\[\d{1,2}:\d{1,2}(?:[.:]\d+)?]/g;
const lrcMetaTagRxp = /^\[[a-zA-Z]+:[^\]]*]\s*/g;

const cleanLyricBlock = (lyric: string | null | undefined): string =>
  (lyric ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(lrcTimeTagRxp, '').replace(lrcMetaTagRxp, '').trim())
    .filter(Boolean)
    .join('\n');

const emptyLyricStatus: Pick<
  PlayerRuntimeStatus,
  'lyric' | 'lyricLineAllText' | 'lyricLineText' | 'lxlyric' | 'rlyric' | 'tlyric'
> = {
  lyric: '',
  lyricLineAllText: '',
  lyricLineText: '',
  lxlyric: '',
  rlyric: '',
  tlyric: '',
};

export class PlayerStore {
  currentMusic: PlayerRuntimeMusicInfo | null = null;

  currentQueueId: string | null = null;

  currentQueueIndex = -1;

  isPlaying = false;

  /** 外部解码转码中（DFF/DSF 等），驱动播放按钮 loading */
  isPreparingMusic = false;

  private pendingMusic: PlayerRuntimeMusicInfo | null = null;

  isHydrated = false;

  playQueue: PlayerRuntimeMusicInfo[] = [];

  status: PlayerRuntimeStatus | null = null;

  currentTime = 0;

  progress = 0;

  maxPlayTime = 0;

  volume = 1;

  isMute = false;

  playbackRate = 1;

  statusText = '';

  isPlayDetailOpen = false;

  isCommentPanelOpen = false;

  isLyricSelectionOpen = false;

  playedMusicIds: string[] = [];

  private enrichRequestId = 0;

  private runtime: PlayerRuntimeBridge = playerRuntimeBridge;

  private runtimeStatusDisposer: (() => void) | null = null;

  private settingsDisposer: IReactionDisposer | null = null;

  private historyPlayMode: PlayMode | null = null;

  constructor(
    private readonly settings: SettingsStore | null = null,
    private readonly dislike: DislikeStore | null = null,
    private readonly library: LibraryStore | null = null,
    private readonly list: ListStore | null = null,
  ) {
    makeAutoObservable<
      this,
      | 'dislike'
      | 'enrichRequestId'
      | 'historyPlayMode'
      | 'library'
      | 'list'
      | 'pendingMusic'
      | 'runtime'
      | 'runtimeStatusDisposer'
      | 'settings'
      | 'settingsDisposer'
    >(
      this,
      {
        dislike: false,
        enrichRequestId: false,
        historyPlayMode: false,
        library: false,
        list: false,
        pendingMusic: false,
        runtime: false,
        runtimeStatusDisposer: false,
        settings: false,
        settingsDisposer: false,
        playedMusicIds: observable.shallow,
        playQueue: observable.shallow,
      },
      { autoBind: true },
    );
  }

  get displayName(): string {
    return this.displayMusicInfo?.name ?? this.status?.name ?? '等待播放';
  }

  get displaySinger(): string {
    return this.displayMusicInfo?.singer ?? this.status?.singer ?? '珊瑚音乐';
  }

  get musicInfo(): PlayerRuntimeMusicInfo | null {
    return this.currentMusic;
  }

  get displayMusicInfo(): Coral.Music.MusicInfo | null {
    if (!this.currentMusic) return null;
    return 'progress' in this.currentMusic
      ? this.currentMusic.metadata.musicInfo
      : this.currentMusic;
  }

  get coverUrl(): string | null {
    return this.displayMusicInfo?.meta.picUrl || this.status?.picUrl || null;
  }

  get albumName(): string {
    return this.displayMusicInfo?.meta.albumName ?? this.status?.albumName ?? '';
  }

  get bitrateText(): string {
    const musicInfo = this.displayMusicInfo;
    if (!musicInfo) return '';

    // 本地音乐：使用实际文件元数据
    if (musicInfo.source === 'local') {
      const bitrate = musicInfo.meta.bitrate;
      if (!bitrate || !Number.isFinite(bitrate)) return '';

      const kbps = Math.round(bitrate / 1000);
      const details = [
        `${kbps} kbps`,
        musicInfo.meta.lossless ? 'Lossless' : '',
        musicInfo.meta.sampleRate ? `${Math.round(musicInfo.meta.sampleRate / 1000)} kHz` : '',
        musicInfo.meta.ext ? musicInfo.meta.ext.toUpperCase() : '',
      ].filter(Boolean);

      return details.join(' · ');
    }

    // 在线音乐：优先使用探测到的实际采样率/比特率，回退到音质映射
    const quality = this.actualQuality;
    if (!quality) return '';

    const probeSampleRate = this.status?.probeSampleRate;
    const probeBitrate = this.status?.probeBitrate;
    const probeFormat = this.status?.probeFormat;

    // 音质到理论规格的映射（作为探测失败时的回退）
    const qualitySpecs: Partial<
      Record<Coral.Quality, { kbps: number; sampleRate: number; lossless: boolean }>
    > = {
      '128k': { kbps: 128, sampleRate: 44100, lossless: false },
      '192k': { kbps: 192, sampleRate: 44100, lossless: false },
      '320k': { kbps: 320, sampleRate: 44100, lossless: false },
      flac: { kbps: 900, sampleRate: 44100, lossless: true },
      flac24bit: { kbps: 2000, sampleRate: 96000, lossless: true },
      hires: { kbps: 3000, sampleRate: 192000, lossless: true },
      master: { kbps: 2304, sampleRate: 96000, lossless: true },
    };

    const spec = qualitySpecs[quality];

    // 探测成功，使用实际值
    if (probeBitrate || probeSampleRate) {
      const details = [
        probeBitrate ? `${Math.round(probeBitrate / 1000)} kbps` : spec ? `${spec.kbps} kbps` : '',
        probeSampleRate
          ? `${Math.round(probeSampleRate / 1000)} kHz`
          : spec
            ? `${Math.round(spec.sampleRate / 1000)} kHz`
            : '',
        probeFormat ? probeFormat.toUpperCase() : '',
        this.displayQualityText,
      ].filter(Boolean);
      return details.join(' · ');
    }

    // 探测未完成或失败，使用音质映射回退
    if (!spec) return this.displayQualityText;

    const details = [
      `${spec.kbps} kbps`,
      spec.lossless ? 'Lossless' : '',
      `${Math.round(spec.sampleRate / 1000)} kHz`,
      this.displayQualityText,
    ].filter(Boolean);

    return details.join(' · ');
  }

  get actualQuality(): Coral.Quality | null {
    return this.status?.actualQuality ?? null;
  }

  get displayQualityText(): string {
    const quality =
      this.actualQuality ??
      (this.currentMusic && isDownloadMusicInfo(this.currentMusic)
        ? this.currentMusic.metadata.quality
        : this.settings?.appSetting?.['player.playQuality']);
    if (!quality) return '';

    const labels: Partial<Record<Coral.Quality, string>> = {
      '128k': '128k',
      '192k': '192k',
      '320k': '320k',
      atmos: 'Atmos',
      atmos_plus: 'Atmos+',
      flac: 'FLAC',
      flac24bit: 'FLAC Hi-Res',
      hires: 'Hi-Res',
      master: 'Master',
    };
    return labels[quality] ?? quality;
  }

  get errorText(): string {
    return this.status?.errorText ?? '';
  }

  get needsSourcePlugin(): boolean {
    return /添加音源|User API|Api is not found|没有可用音源/.test(this.errorText);
  }

  get needsExternalDecoder(): boolean {
    return /FFmpeg|外部解码|解码器|DSD|SACD|WAV|PCM/i.test(this.errorText);
  }

  get lyricText(): string {
    return (
      [
        this.status?.lyricLineAllText,
        this.status?.lyricLineText,
        this.status?.lxlyric,
        this.status?.lyric,
      ]
        .map((text) => text?.trim() ?? '')
        .find((text) => text.length > 0) ?? ''
    );
  }

  get currentLyricInfo(): Coral.Music.LyricInfo {
    return {
      lyric: this.status?.lyric ?? '',
      lxlyric: this.status?.lxlyric ?? '',
      rlyric: this.status?.rlyric ?? '',
      tlyric: this.status?.tlyric ?? '',
    };
  }

  get lyricDisplayLines(): string[] {
    return this.lyricText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 24);
  }

  get lyricSelectionText(): string {
    const lyricInfo = this.currentLyricInfo;
    const sections = [
      cleanLyricBlock(lyricInfo.lyric),
      cleanLyricBlock(lyricInfo.tlyric),
      cleanLyricBlock(lyricInfo.rlyric),
    ].filter(Boolean);

    if (sections.length) return sections.join('\n\n');
    return cleanLyricBlock(this.lyricText);
  }

  get lyricSelectionLines(): string[] {
    return this.lyricSelectionText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  get playInfo(): { musicInfo: PlayerRuntimeMusicInfo | null } | null {
    return this.currentMusic ? { musicInfo: this.currentMusic } : null;
  }

  get queueCount(): number {
    return this.playQueue.length;
  }

  get queueItems(): PlayerRuntimeMusicInfo[] {
    return this.playQueue.slice();
  }

  get currentQueueMusicId(): string {
    return this.currentMusic ? getRuntimeMusicId(this.currentMusic) : '';
  }

  get queuePositionText(): string {
    if (!this.playQueue.length) return '';

    const currentIndex = this.currentMusic
      ? this.findQueueIndex(this.currentMusic)
      : this.currentQueueIndex;
    if (currentIndex < 0) return '';

    return `${currentIndex + 1} / ${this.playQueue.length}`;
  }

  hydrate(runtime: PlayerRuntimeBridge = playerRuntimeBridge): void {
    if (this.isHydrated) return;

    this.bindRuntime(runtime);
    this.startSettingsSync();
    this.isHydrated = true;
  }

  dispose(): void {
    this.runtimeStatusDisposer?.();
    this.runtimeStatusDisposer = null;
    this.settingsDisposer?.();
    this.settingsDisposer = null;
    this.runtime.dispose();
    this.isPlayDetailOpen = false;
    this.clearQueue();
    this.isHydrated = false;
  }

  bindRuntime(runtime: PlayerRuntimeBridge): void {
    this.runtimeStatusDisposer?.();
    this.runtime = runtime;
    this.runtimeStatusDisposer = runtime.onStatus((status) => {
      this.applyRuntimeStatus(status);
    });
  }

  getAnalyser(): AnalyserNode | null {
    return this.runtime.getAnalyser?.() ?? null;
  }

  playMusic(musicInfo?: PlayerRuntimeMusicInfo, options: PlayerRuntimePlayOptions = {}): void {
    if (musicInfo) {
      // 外部解码转码耗时较长，延迟切换 currentMusic，等转码完成再切换播放界面信息
      if (isExternalDecoderLocalMusic(musicInfo)) {
        this.isPreparingMusic = true;
        this.pendingMusic = musicInfo;
        this.syncQueueIndex(musicInfo);
        this.recordPlayedMusic(musicInfo);
        // 转码期间并行预加载歌词（含在线兜底），避免转码完成后才开始搜索导致延迟
        this.enrichCurrentLocalLyricInfo(musicInfo);
      } else {
        // 切到非外部解码音乐时，清除上一首的 pending 状态
        this.pendingMusic = null;
        this.isPreparingMusic = false;
        this.commitMusicInfo(musicInfo);
      }
    }
    this.runtime.playMusic(musicInfo, {
      preferredQuality: this.settings?.appSetting?.['player.playQuality'],
      ...options,
    });
  }

  private commitMusicInfo(
    musicInfo: PlayerRuntimeMusicInfo,
    options: { skipLyric?: boolean } = {},
  ): void {
    this.currentMusic = musicInfo;
    if (!options.skipLyric) this.clearLyricSnapshot();
    this.syncQueueIndex(musicInfo);
    this.recordPlayedMusic(musicInfo);
    this.library?.addPlayHistory(
      'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo,
      this.currentQueueId,
    );
    this.enrichCurrentLocalMusicInfo(musicInfo);
    if (!options.skipLyric) this.enrichCurrentLocalLyricInfo(musicInfo);
    this.enrichCurrentOnlineMusicInfo(musicInfo);
  }

  playNext(isAutoToggle = false): void {
    const nextMusic = this.getQueueSibling('next', isAutoToggle);
    if (!nextMusic) {
      if (!isAutoToggle) this.runtime.playNext();
      return;
    }

    this.playMusic(nextMusic);
  }

  playPrev(): void {
    const prevMusic = this.getQueueSibling('prev', false);
    if (!prevMusic) {
      this.runtime.playPrev();
      return;
    }

    this.playMusic(prevMusic);
  }

  setQueue(queue: PlayerRuntimeMusicInfo[], queueId: string | null = null): void {
    const shouldResetHistory =
      this.currentQueueId !== queueId || this.shouldAutoCleanPlayedHistory();
    this.playQueue = queue.slice();
    this.currentQueueId = queueId;
    if (shouldResetHistory) this.clearPlayedHistory();
    if (this.currentMusic) this.syncQueueIndex(this.currentMusic);
  }

  clearQueue(): void {
    this.playQueue = [];
    this.currentQueueId = null;
    this.currentQueueIndex = -1;
    this.clearPlayedHistory();
  }

  playFromQueue(
    musicInfo: PlayerRuntimeMusicInfo,
    queue: PlayerRuntimeMusicInfo[],
    queueId: string | null = null,
  ): void {
    this.setQueue(queue, queueId);
    this.currentQueueIndex = this.findQueueIndex(musicInfo);
    this.playMusic(musicInfo);
  }

  togglePlay(): void {
    this.runtime.togglePlay();
  }

  seek(seconds: number): void {
    this.setCurrentTime(seconds);
    this.runtime.seek(seconds);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.settings?.updateAppSetting({ 'player.volume': this.volume });
    this.runtime.setVolume(this.volume);
  }

  setMute(isMute: boolean): void {
    this.isMute = isMute;
    this.settings?.updateAppSetting({ 'player.isMute': isMute });
    this.runtime.setMute(isMute);
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.5, Math.min(2, rate));
    this.settings?.updateAppSetting({ 'player.playbackRate': this.playbackRate });
    this.runtime.setPlaybackRate(this.playbackRate);
  }

  setProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(1, progress));
    this.currentTime = this.progress * this.maxPlayTime;
  }

  setCurrentTime(seconds: number): void {
    this.currentTime = Math.max(0, seconds);
    this.progress = this.maxPlayTime ? clamp(this.currentTime / this.maxPlayTime, 0, 1) : 0;
  }

  setMaxPlayTime(seconds: number): void {
    this.maxPlayTime = Math.max(0, seconds);
    this.progress = this.maxPlayTime ? clamp(this.currentTime / this.maxPlayTime, 0, 1) : 0;
  }

  setStatusText(text: string): void {
    this.statusText = text;
  }

  openPlayDetail(): void {
    this.isPlayDetailOpen = true;
  }

  closePlayDetail(): void {
    this.isPlayDetailOpen = false;
    this.isCommentPanelOpen = false;
    this.isLyricSelectionOpen = false;
  }

  togglePlayDetail(): void {
    this.isPlayDetailOpen = !this.isPlayDetailOpen;
    if (!this.isPlayDetailOpen) {
      this.isCommentPanelOpen = false;
      this.isLyricSelectionOpen = false;
    }
  }

  closeCommentPanel(): void {
    this.isCommentPanelOpen = false;
  }

  closeLyricSelection(): void {
    this.isLyricSelectionOpen = false;
  }

  toggleCommentPanel(): void {
    this.isCommentPanelOpen = !this.isCommentPanelOpen;
    if (this.isCommentPanelOpen) this.isLyricSelectionOpen = false;
  }

  toggleLyricSelection(): void {
    this.isLyricSelectionOpen = !this.isLyricSelectionOpen;
    if (this.isLyricSelectionOpen) this.isCommentPanelOpen = false;
  }

  setStatus(status: PlayerRuntimeStatus): void {
    this.status = {
      ...this.status,
      ...status,
    };

    if (status.status) {
      this.isPlaying = status.status === 'playing';
    }
  }

  updateLyricSnapshot(lyricInfo: Coral.Music.LyricInfo): void {
    this.status = {
      ...this.status,
      lyric: lyricInfo.lyric,
      lxlyric: lyricInfo.lxlyric ?? '',
      rlyric: lyricInfo.rlyric ?? '',
      tlyric: lyricInfo.tlyric ?? '',
    };
  }

  clearLyricSnapshot(): void {
    this.status = {
      ...this.status,
      ...emptyLyricStatus,
    };
  }

  refreshCurrentMusicWithQuality(quality: Coral.Quality): void {
    if (
      !this.currentMusic ||
      isDownloadMusicInfo(this.currentMusic) ||
      this.currentMusic.source === 'local' ||
      this.currentMusic.source === 'webdav'
    )
      return;
    this.settings?.updateAppSetting({ 'player.playQuality': quality });
    this.playMusic(this.currentMusic, {
      isRefresh: true,
      preferredQuality: quality,
    });
  }

  private applyRuntimeStatus(status: PlayerRuntimeStatus): void {
    // 外部解码转码完成或失败时，提交 pendingMusic（即使失败也提交，让歌词兜底和播放界面信息正常工作）
    if (typeof status.isPreparing === 'boolean') {
      this.isPreparingMusic = status.isPreparing;
      if (!status.isPreparing && this.pendingMusic) {
        const pending = this.pendingMusic;
        this.pendingMusic = null;
        // 歌词已在 playMusic 阶段预加载，提交时不清空不重载，避免闪烁和重复请求
        this.commitMusicInfo(pending, { skipLyric: true });
      }
    } else if (status.status === 'error' && this.pendingMusic) {
      // 独占模式下可能不发布 isPreparing，通过 error 状态兜底清理
      const pending = this.pendingMusic;
      this.pendingMusic = null;
      this.isPreparingMusic = false;
      this.commitMusicInfo(pending, { skipLyric: true });
    }

    this.setStatus(status);

    if (typeof status.progress === 'number') {
      this.setCurrentTime(status.progress);
    }

    if (typeof status.duration === 'number') {
      this.setMaxPlayTime(status.duration);
    }

    if (typeof status.volume === 'number') {
      this.volume = normalizeStatusVolume(status.volume);
    }

    if (typeof status.mute === 'boolean') {
      this.isMute = status.mute;
    }

    if (typeof status.playbackRate === 'number') {
      this.playbackRate = clamp(status.playbackRate, 0.5, 2);
    }

    if (status.isEnded) this.playNext(true);
  }

  private findQueueIndex(musicInfo: PlayerRuntimeMusicInfo): number {
    const musicId = getRuntimeMusicId(musicInfo);
    return this.playQueue.findIndex((item) => getRuntimeMusicId(item) === musicId);
  }

  private syncQueueIndex(musicInfo: PlayerRuntimeMusicInfo): void {
    this.currentQueueIndex = this.findQueueIndex(musicInfo);
  }

  private getPlayMode(): Coral.AppSetting['player.togglePlayMethod'] {
    return this.settings?.appSetting?.['player.togglePlayMethod'] ?? 'listLoop';
  }

  private clearPlayedHistory(): void {
    this.playedMusicIds = [];
  }

  private isPlayedHistoryEnabled(playMode: PlayMode = this.getPlayMode()): boolean {
    return playMode === 'random';
  }

  private shouldAutoCleanPlayedHistory(): boolean {
    return this.settings?.appSetting?.['player.isAutoCleanPlayedList'] === true;
  }

  private recordPlayedMusic(musicInfo: PlayerRuntimeMusicInfo, force = false): void {
    if (!force && !this.isPlayedHistoryEnabled()) return;

    const musicId = getRuntimeMusicId(musicInfo);
    if (this.playedMusicIds.includes(musicId)) return;

    this.playedMusicIds = [...this.playedMusicIds, musicId].slice(-1000);
  }

  private enrichCurrentLocalMusicInfo(musicInfo: PlayerRuntimeMusicInfo): void {
    if (isDownloadMusicInfo(musicInfo) || musicInfo.source !== 'local') return;
    if (musicInfo.meta.picUrl && musicInfo.meta.bitrate) return;

    const musicId = getRuntimeMusicId(musicInfo);
    localAudioService
      .enrichLocalMusicInfoWithMetadata(musicInfo)
      .then((enrichedMusicInfo) => {
        if (!this.currentMusic || getRuntimeMusicId(this.currentMusic) !== musicId) return;

        this.currentMusic = enrichedMusicInfo;
        const queueIndex = this.findQueueIndex(enrichedMusicInfo);
        if (queueIndex >= 0) {
          this.playQueue = this.playQueue.map((item, index) =>
            index === queueIndex ? enrichedMusicInfo : item,
          );
        }
        this.status = {
          ...this.status,
          albumName: enrichedMusicInfo.meta.albumName,
          picUrl: enrichedMusicInfo.meta.picUrl ?? '',
          probeBitrate: enrichedMusicInfo.meta.bitrate ?? this.status?.probeBitrate ?? null,
          probeSampleRate:
            enrichedMusicInfo.meta.sampleRate ?? this.status?.probeSampleRate ?? null,
          probeFormat: enrichedMusicInfo.meta.ext ?? this.status?.probeFormat ?? null,
        };
        this.list?.updateSelectedMusicInfo(enrichedMusicInfo);
      })
      .catch(() => {});
  }

  private enrichCurrentLocalLyricInfo(musicInfo: PlayerRuntimeMusicInfo): void {
    if (isDownloadMusicInfo(musicInfo) || musicInfo.source !== 'local') return;

    const musicId = getRuntimeMusicId(musicInfo);
    localLyricService
      .getLocalLyricInfo(musicInfo)
      .then(async (localLyricInfo) => {
        if ([localLyricInfo.lyric, localLyricInfo.lxlyric].some(Boolean)) return localLyricInfo;
        return localLyricService.getFallbackOnlineLyricInfo(musicInfo);
      })
      .then((lyricInfo) => {
        // 转码期间 currentMusic 还是上一首，需同时检查 pendingMusic
        const activeMusic = this.pendingMusic ?? this.currentMusic;
        if (!activeMusic || getRuntimeMusicId(activeMusic) !== musicId) return;
        if (![lyricInfo.lyric, lyricInfo.lxlyric, lyricInfo.rlyric, lyricInfo.tlyric].some(Boolean))
          return;

        runInAction(() => {
          this.status = {
            ...this.status,
            lyric: lyricInfo.lyric,
            lxlyric: lyricInfo.lxlyric ?? '',
            rlyric: lyricInfo.rlyric ?? '',
            tlyric: lyricInfo.tlyric ?? '',
          };
        });
      })
      .catch((err) => {
        console.error('[歌词] 获取歌词失败:', err);
      });
  }

  private enrichCurrentOnlineMusicInfo(musicInfo: PlayerRuntimeMusicInfo): void {
    if (
      isDownloadMusicInfo(musicInfo) ||
      musicInfo.source === 'local' ||
      musicInfo.source === 'webdav'
    )
      return;

    const requestId = ++this.enrichRequestId;
    const musicId = getRuntimeMusicId(musicInfo);

    Promise.allSettled([
      onlineMediaService.getOnlinePicUrl(musicInfo),
      onlineMediaService.getOnlineLyricInfo(musicInfo),
    ])
      .then(([picResult, lyricResult]) => {
        if (
          !this.currentMusic ||
          getRuntimeMusicId(this.currentMusic) !== musicId ||
          requestId !== this.enrichRequestId
        )
          return;

        const nextMusicInfo = {
          ...musicInfo,
          meta: {
            ...musicInfo.meta,
          },
        } as Coral.Music.MusicInfoOnline;
        const nextStatus: PlayerRuntimeStatus = {};

        if (picResult.status === 'fulfilled' && picResult.value && !nextMusicInfo.meta.picUrl) {
          nextMusicInfo.meta.picUrl = picResult.value;
          nextStatus.picUrl = picResult.value;
        }

        if (lyricResult.status === 'fulfilled') {
          const lyricInfo = lyricResult.value;
          if (
            [lyricInfo.lyric, lyricInfo.lxlyric, lyricInfo.rlyric, lyricInfo.tlyric].some(Boolean)
          ) {
            nextStatus.lyric = lyricInfo.lyric;
            nextStatus.lxlyric = lyricInfo.lxlyric ?? '';
            nextStatus.rlyric = lyricInfo.rlyric ?? '';
            nextStatus.tlyric = lyricInfo.tlyric ?? '';
          }
        }

        if (nextStatus.picUrl) {
          this.currentMusic = nextMusicInfo;
          const queueIndex = this.findQueueIndex(nextMusicInfo);
          if (queueIndex >= 0) {
            this.playQueue = this.playQueue.map((item, index) =>
              index === queueIndex ? nextMusicInfo : item,
            );
          }
        }

        if (Object.keys(nextStatus).length) {
          this.status = {
            ...this.status,
            ...nextStatus,
          };
        }
      })
      .catch(() => {});
  }

  private isStaticPlayableQueueItem(musicInfo: PlayerRuntimeMusicInfo): boolean {
    if (isDownloadMusicInfo(musicInfo)) {
      return musicInfo.isComplate && !/\.ape$/i.test(musicInfo.metadata.fileName);
    }

    if (musicInfo.source === 'local') {
      return Boolean(musicInfo.meta.filePath.trim());
    }

    return true;
  }

  private isDislikedQueueItem(musicInfo: PlayerRuntimeMusicInfo): boolean {
    return this.dislike?.hasDislike(musicInfo) ?? false;
  }

  private getBaseQueueCandidateIndexes(): number[] {
    return this.playQueue
      .map((musicInfo, index) => ({ index, musicInfo }))
      .filter(
        ({ musicInfo }) =>
          this.isStaticPlayableQueueItem(musicInfo) && !this.isDislikedQueueItem(musicInfo),
      )
      .map(({ index }) => index);
  }

  private getHistoryFilteredCandidateIndexes(
    baseIndexes: number[],
    safeIndex: number,
    playMode: PlayMode,
  ): number[] {
    if (!this.isPlayedHistoryEnabled(playMode)) return baseIndexes;

    const currentMusicId = this.playQueue[safeIndex]
      ? getRuntimeMusicId(this.playQueue[safeIndex])
      : null;
    const unplayedIndexes = baseIndexes.filter((index) => {
      const musicId = getRuntimeMusicId(this.playQueue[index]);
      return musicId === currentMusicId || !this.playedMusicIds.includes(musicId);
    });

    if (unplayedIndexes.length) return unplayedIndexes;

    this.clearPlayedHistory();
    if (this.currentMusic) this.recordPlayedMusic(this.currentMusic, true);

    const resetIndexes = baseIndexes.filter((index) => {
      const musicId = getRuntimeMusicId(this.playQueue[index]);
      return musicId !== currentMusicId;
    });
    return resetIndexes.length ? resetIndexes : baseIndexes;
  }

  private getSequentialCandidateIndex(
    candidateIndexes: number[],
    safeIndex: number,
    direction: 'next' | 'prev',
    isLoop: boolean,
  ): number | null {
    if (!candidateIndexes.length) return null;

    if (direction === 'next') {
      const nextIndex = candidateIndexes.find((index) => index > safeIndex);
      if (nextIndex != null) return nextIndex;
      return isLoop ? candidateIndexes[0] : null;
    }

    const prevIndex = candidateIndexes.findLast((index) => index < safeIndex);
    if (prevIndex != null) return prevIndex;
    return isLoop ? (candidateIndexes.at(-1) ?? null) : null;
  }

  private getQueueSibling(
    direction: 'next' | 'prev',
    isAutoToggle: boolean,
  ): PlayerRuntimeMusicInfo | null {
    if (!this.playQueue.length) return null;

    const currentIndex = this.currentMusic
      ? this.findQueueIndex(this.currentMusic)
      : this.currentQueueIndex;
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    let targetIndex = safeIndex;
    let playMode = this.getPlayMode();

    if (this.historyPlayMode !== playMode) {
      this.historyPlayMode = playMode;
      this.clearPlayedHistory();
      if (this.currentMusic && this.isPlayedHistoryEnabled(playMode))
        this.recordPlayedMusic(this.currentMusic, true);
    }

    if (
      !isAutoToggle &&
      (playMode === 'list' || playMode === 'singleLoop' || playMode === 'none')
    ) {
      playMode = 'listLoop';
    }

    const baseCandidateIndexes = this.getBaseQueueCandidateIndexes();
    const candidateIndexes = this.getHistoryFilteredCandidateIndexes(
      baseCandidateIndexes,
      safeIndex,
      playMode,
    );

    switch (playMode) {
      case 'random':
        {
          const randomCandidateIndexes = candidateIndexes.filter((index) => index !== safeIndex);
          const availableIndexes = randomCandidateIndexes.length
            ? randomCandidateIndexes
            : candidateIndexes;
          if (!availableIndexes.length) return null;
          targetIndex = availableIndexes[getRandomIndex(availableIndexes.length)];
        }
        break;
      case 'listLoop':
        {
          const sequentialIndex = this.getSequentialCandidateIndex(
            candidateIndexes,
            safeIndex,
            direction,
            true,
          );
          if (sequentialIndex == null) return null;
          targetIndex = sequentialIndex;
        }
        break;
      case 'list':
        {
          const sequentialIndex = this.getSequentialCandidateIndex(
            candidateIndexes,
            safeIndex,
            direction,
            false,
          );
          if (sequentialIndex == null) return null;
          targetIndex = sequentialIndex;
        }
        break;
      case 'singleLoop':
        if (!candidateIndexes.includes(safeIndex)) {
          const sequentialIndex = this.getSequentialCandidateIndex(
            candidateIndexes,
            safeIndex,
            direction,
            true,
          );
          if (sequentialIndex == null) return null;
          targetIndex = sequentialIndex;
        }
        break;
      default:
        return null;
    }

    this.currentQueueIndex = targetIndex;
    return this.playQueue[targetIndex] ?? null;
  }

  private startSettingsSync(): void {
    if (!this.settings || this.settingsDisposer) return;

    this.settingsDisposer = reaction(
      () => {
        const setting = this.settings?.appSetting;
        if (!setting) return null;

        return {
          isMute: setting['player.isMute'],
          playbackRate: setting['player.playbackRate'],
          soundEffectConfig: createSoundEffectConfig(setting),
          volume: setting['player.volume'],
        };
      },
      (snapshot) => {
        if (!snapshot) return;

        this.volume = normalizeStatusVolume(snapshot.volume);
        this.isMute = snapshot.isMute;
        this.playbackRate = clamp(snapshot.playbackRate, 0.5, 2);
        this.runtime.setSoundEffectConfig?.(snapshot.soundEffectConfig);
      },
      { fireImmediately: true },
    );
  }
}
