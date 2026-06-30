import { audioOutputService } from '../audioOutputService';
import { settingService } from '../settingService';
import { resolvePlayableMusicUrl } from './musicUrlResolver';
import type {
  PlayerRuntimeBridge,
  PlayerRuntimeMusicInfo,
  PlayerRuntimePlayOptions,
  PlayerRuntimeStatus,
  PlayerSoundEffectConfig,
  PlayerStatusListener,
} from './types';

type ExclusiveRuntimeStatus = Awaited<ReturnType<typeof audioOutputService.stopExclusiveAudioOutput>>;

const toPlayerPlaybackStatus = (
  status: ExclusiveRuntimeStatus['status'],
): Coral.Player.Status['status'] => {
  switch (status) {
    case 'playing':
    case 'paused':
    case 'error':
    case 'stoped':
      return status;
    case 'idle':
    case 'opening':
    default:
      return 'paused';
  }
};

const toPlayerStatus = (status: ExclusiveRuntimeStatus): PlayerRuntimeStatus => ({
  duration: status.duration,
  errorText: status.errorText,
  progress: status.progress,
  status: toPlayerPlaybackStatus(status.status),
});

export class ExclusiveAudioPlayerRuntimeBackend implements PlayerRuntimeBridge {
  private readonly listeners = new Set<PlayerStatusListener>();

  private readonly disposers: Array<() => void> = [];

  private currentMusic: PlayerRuntimeMusicInfo | null = null;

  private currentOptions: PlayerRuntimePlayOptions = {};

  private isDisposed = false;

  private isUsingFallback = false;

  private loadRequestId = 0;

  constructor(private readonly fallbackBackend: PlayerRuntimeBridge) {
    this.disposers.push(
      fallbackBackend.onStatus((status) => {
        if (!this.isUsingFallback) return;
        this.publish(status);
      }),
    );
    this.disposers.push(
      audioOutputService.onExclusiveAudioOutputStatus((status) => {
        if (this.isUsingFallback) return;
        this.publish(toPlayerStatus(status));
      }),
    );
  }

  playMusic(musicInfo?: PlayerRuntimeMusicInfo, options: PlayerRuntimePlayOptions = {}): void {
    if (!musicInfo) {
      if (this.isUsingFallback) this.fallbackBackend.playMusic();
      else this.resumeExclusivePlayback();
      return;
    }

    this.currentMusic = musicInfo;
    this.currentOptions = options;
    this.isUsingFallback = false;
    this.loadAndPlay(musicInfo, options, ++this.loadRequestId);
  }

  playNext(): void {
    if (this.isUsingFallback) this.fallbackBackend.playNext();
  }

  playPrev(): void {
    if (this.isUsingFallback) this.fallbackBackend.playPrev();
  }

  togglePlay(): void {
    if (this.isUsingFallback) {
      this.fallbackBackend.togglePlay();
      return;
    }
    this.pauseExclusivePlayback();
  }

  seek(seconds: number): void {
    if (this.isUsingFallback) {
      this.fallbackBackend.seek(seconds);
      return;
    }
    audioOutputService.seekExclusiveAudioOutput(seconds).then((status) => {
      this.publish(toPlayerStatus(status));
    });
  }

  setVolume(volume: number): void {
    if (this.isUsingFallback) this.fallbackBackend.setVolume(volume);
    this.publish({ volume: Math.round(Math.max(0, Math.min(1, volume)) * 100) });
  }

  setMute(isMute: boolean): void {
    if (this.isUsingFallback) this.fallbackBackend.setMute(isMute);
    this.publish({ mute: isMute });
  }

  setPlaybackRate(rate: number): void {
    if (this.isUsingFallback) this.fallbackBackend.setPlaybackRate(rate);
    this.publish({ playbackRate: rate });
  }

  setSoundEffectConfig(config: PlayerSoundEffectConfig): void {
    if (this.isUsingFallback) this.fallbackBackend.setSoundEffectConfig?.(config);
  }

  onStatus(listener: PlayerStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;
    for (const dispose of this.disposers.splice(0)) dispose();
    this.listeners.clear();
    audioOutputService.stopExclusiveAudioOutput();
  }

  private async loadAndPlay(
    musicInfo: PlayerRuntimeMusicInfo,
    options: PlayerRuntimePlayOptions,
    requestId: number,
  ): Promise<void> {
    try {
      this.publishMusicInfo(musicInfo);
      this.publish({ status: 'paused', errorText: '' });
      const [setting, resolved] = await Promise.all([
        settingService.getAppSetting(),
        resolvePlayableMusicUrl(musicInfo, options),
      ]);
      if (this.isDisposed || requestId !== this.loadRequestId) return;
      if (!setting || !resolved) {
        this.publish({ status: 'stoped' });
        return;
      }

      if (resolved.decodedAudio || resolved.objectUrl?.startsWith('blob:')) {
        throw new Error('独占输出暂不支持浏览器内存解码流，请使用系统输出或启用 FFmpeg 文件解码。');
      }

      const status = await audioOutputService.startExclusiveAudioOutput({
        backend: setting['player.audioOutput.exclusiveBackend'],
        bufferMs: setting['player.audioOutput.exclusiveBufferMs'],
        deviceId: setting['player.audioOutput.exclusiveDeviceId'],
        sampleRatePolicy: setting['player.audioOutput.exclusiveSampleRatePolicy'],
        sourceUrl: resolved.url,
      });
      if (this.isDisposed || requestId !== this.loadRequestId) return;

      this.publish({
        actualQuality: resolved.quality,
        ...toPlayerStatus(status),
      });

      if (status.status === 'error') {
        await this.playFallbackIfAllowed(setting, musicInfo, options, status.errorText);
      }
    } catch (error) {
      if (this.isDisposed || requestId !== this.loadRequestId) return;
      const errorText = error instanceof Error ? error.message : String(error);
      const setting = await settingService.getAppSetting();
      if (setting?.['player.audioOutput.exclusiveFallbackToSystem']) {
        await this.playFallbackIfAllowed(setting, musicInfo, options, errorText);
        return;
      }
      this.publish({ errorText, status: 'error' });
    }
  }

  private async playFallbackIfAllowed(
    setting: Coral.AppSetting,
    musicInfo: PlayerRuntimeMusicInfo,
    options: PlayerRuntimePlayOptions,
    errorText: string,
  ): Promise<void> {
    if (!setting['player.audioOutput.exclusiveFallbackToSystem']) {
      this.publish({ errorText, status: 'error' });
      return;
    }

    this.isUsingFallback = true;
    this.publish({ errorText: `${errorText} 已回落到系统输出。` });
    this.fallbackBackend.playMusic(musicInfo, options);
  }

  private pauseExclusivePlayback(): void {
    audioOutputService.pauseExclusiveAudioOutput().then((status) => {
      this.publish(toPlayerStatus(status));
    });
  }

  private resumeExclusivePlayback(): void {
    audioOutputService.resumeExclusiveAudioOutput().then((status) => {
      this.publish(toPlayerStatus(status));
    });
  }

  private publishMusicInfo(musicInfo: PlayerRuntimeMusicInfo): void {
    const displayMusicInfo = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo;
    this.publish({
      albumName: displayMusicInfo.meta.albumName,
      name: displayMusicInfo.name,
      picUrl: displayMusicInfo.meta.picUrl ?? '',
      singer: displayMusicInfo.singer,
    });
  }

  private publish(status: PlayerRuntimeStatus): void {
    if (this.isDisposed) return;
    for (const listener of this.listeners) listener({ ...status });
  }
}

export const createExclusiveAudioPlayerRuntimeBackend = (
  fallbackBackend: PlayerRuntimeBridge,
): PlayerRuntimeBridge => new ExclusiveAudioPlayerRuntimeBackend(fallbackBackend);
