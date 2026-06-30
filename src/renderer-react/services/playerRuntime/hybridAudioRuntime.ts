import { settingService } from '../settingService';
import { createExclusiveAudioPlayerRuntimeBackend } from './exclusiveAudioRuntime';
import { createHtmlAudioPlayerRuntimeBackend } from './htmlAudioRuntime';
import type {
  PlayerRuntimeBridge,
  PlayerRuntimeMusicInfo,
  PlayerRuntimePlayOptions,
  PlayerRuntimeStatus,
  PlayerSoundEffectConfig,
  PlayerStatusListener,
} from './types';

export class HybridAudioPlayerRuntimeBackend implements PlayerRuntimeBridge {
  private readonly listeners = new Set<PlayerStatusListener>();

  private readonly disposers: Array<() => void> = [];

  private readonly systemBackend = createHtmlAudioPlayerRuntimeBackend();

  private readonly exclusiveBackend = createExclusiveAudioPlayerRuntimeBackend(this.systemBackend);

  private activeMode: Coral.AppSetting['player.audioOutput.mode'] = 'system';

  private isDisposed = false;

  constructor() {
    this.disposers.push(
      this.systemBackend.onStatus((status) => {
        if (this.activeMode === 'system') this.publish(status);
      }),
    );
    this.disposers.push(
      this.exclusiveBackend.onStatus((status) => {
        if (this.activeMode === 'exclusive') this.publish(status);
      }),
    );
    this.syncSettings();
  }

  playMusic(musicInfo?: PlayerRuntimeMusicInfo, options?: PlayerRuntimePlayOptions): void {
    this.getActiveBackend().playMusic(musicInfo, options);
  }

  playNext(): void {
    this.getActiveBackend().playNext();
  }

  playPrev(): void {
    this.getActiveBackend().playPrev();
  }

  togglePlay(): void {
    this.getActiveBackend().togglePlay();
  }

  seek(seconds: number): void {
    this.getActiveBackend().seek(seconds);
  }

  setVolume(volume: number): void {
    this.systemBackend.setVolume(volume);
    if (this.activeMode === 'exclusive') this.exclusiveBackend.setVolume(volume);
  }

  setMute(isMute: boolean): void {
    this.systemBackend.setMute(isMute);
    if (this.activeMode === 'exclusive') this.exclusiveBackend.setMute(isMute);
  }

  setPlaybackRate(rate: number): void {
    this.systemBackend.setPlaybackRate(rate);
    if (this.activeMode === 'exclusive') this.exclusiveBackend.setPlaybackRate(rate);
  }

  setSoundEffectConfig(config: PlayerSoundEffectConfig): void {
    this.systemBackend.setSoundEffectConfig?.(config);
    if (this.activeMode === 'exclusive') this.exclusiveBackend.setSoundEffectConfig?.(config);
  }

  getAnalyser(): AnalyserNode | null {
    return this.activeMode === 'system' ? this.systemBackend.getAnalyser?.() ?? null : null;
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
    this.exclusiveBackend.dispose();
    this.systemBackend.dispose();
    this.listeners.clear();
  }

  private getActiveBackend(): PlayerRuntimeBridge {
    return this.activeMode === 'exclusive' ? this.exclusiveBackend : this.systemBackend;
  }

  private syncSettings(): void {
    settingService.getAppSetting().then((setting) => {
      if (!setting || this.isDisposed) return;
      this.activeMode = setting['player.audioOutput.mode'];
    });
    this.disposers.push(
      settingService.onSettingChanged((setting) => {
        if (!setting['player.audioOutput.mode']) return;
        this.activeMode = setting['player.audioOutput.mode'];
      }),
    );
  }

  private publish(status: PlayerRuntimeStatus): void {
    if (this.isDisposed) return;
    for (const listener of this.listeners) listener({ ...status });
  }
}

export const createHybridAudioPlayerRuntimeBackend = (): PlayerRuntimeBridge =>
  new HybridAudioPlayerRuntimeBackend();

