import { resolvePlayableMusicUrl } from './musicUrlResolver';
import type { DecodedAudioData } from './localAudioDecodeService';
import { removeFile } from '../nodeBridgeService';
import type {
  PlayerEqFrequency,
  PlayerRuntimePlayOptions,
  PlayerRuntimeBridge,
  PlayerRuntimeMusicInfo,
  PlayerRuntimeStatus,
  PlayerSoundEffectConfig,
  PlayerStatusListener,
} from './types';

const eqFrequencies: PlayerEqFrequency[] = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const createDefaultSoundEffectConfig = (): PlayerSoundEffectConfig => ({
  eqGains: {
    31: 0,
    62: 0,
    125: 0,
    250: 0,
    500: 0,
    1000: 0,
    2000: 0,
    4000: 0,
    8000: 0,
    16000: 0,
  },
  pannerEnabled: false,
  pannerSoundR: 5,
  pitchPlaybackRate: 1,
});

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toPlayerStatusVolume = (volume: number): number => Math.round(clamp(volume, 0, 1) * 100);

const createAudioElement = (): HTMLAudioElement | null => {
  if (typeof globalThis.window?.Audio === 'undefined') return null;

  const audio = new globalThis.window.Audio();
  audio.autoplay = false;
  audio.controls = false;
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';
  return audio;
};

export class HtmlAudioPlayerRuntimeBackend implements PlayerRuntimeBridge {
  private readonly audio: HTMLAudioElement | null = createAudioElement();

  private readonly listeners = new Set<PlayerStatusListener>();

  private readonly disposers: Array<() => void> = [];

  private analyser: AnalyserNode | null = null;

  private audioContext: AudioContext | null = null;

  private biquadFilters: BiquadFilterNode[] = [];

  private basePlaybackRate = 1;

  private decodedAudioBuffer: AudioBuffer | null = null;

  private decodedAudioSource: AudioBufferSourceNode | null = null;

  private decodedGain: GainNode | null = null;

  private decodedPlayStartedAt = 0;

  private decodedProgressTimer: number | null = null;

  private decodedStartOffset = 0;

  private decodedStatus: 'idle' | 'playing' | 'paused' = 'idle';

  private mediaSource: MediaElementAudioSourceNode | null = null;

  private panner: StereoPannerNode | null = null;

  private soundEffectConfig: PlayerSoundEffectConfig = createDefaultSoundEffectConfig();

  private currentMusic: PlayerRuntimeMusicInfo | null = null;

  private currentDecodedFilePath: string | null = null;

  private currentObjectUrl: string | null = null;

  private loadRequestId = 0;

  private status: PlayerRuntimeStatus = {};

  private isDisposed = false;

  constructor() {
    this.bindAudioEvents();
  }

  playMusic(musicInfo?: PlayerRuntimeMusicInfo, options: PlayerRuntimePlayOptions = {}): void {
    if (musicInfo) {
      this.currentMusic = musicInfo;
      this.publishMusicInfo(musicInfo);
      this.loadAndPlayMusic(musicInfo, ++this.loadRequestId, options);
      return;
    }

    this.playAudio();
  }

  playNext(): void {
    this.publish({});
  }

  playPrev(): void {
    this.publish({});
  }

  togglePlay(): void {
    if (this.decodedAudioBuffer) {
      if (this.decodedStatus === 'playing') {
        this.pauseDecodedAudio();
      } else {
        this.playDecodedAudio(this.decodedStartOffset);
      }
      return;
    }

    const audio = this.audio;
    if (!audio?.src) {
      this.playMusic(this.currentMusic ?? undefined);
      return;
    }

    if (audio.paused) {
      this.playAudio();
      return;
    }

    audio.pause();
    this.publishAudioSnapshot({ status: 'paused' });
  }

  seek(seconds: number): void {
    const targetTime = Math.max(0, seconds);
    if (this.decodedAudioBuffer) {
      const duration = this.decodedAudioBuffer.duration;
      const nextOffset = clamp(targetTime, 0, duration);
      this.decodedStartOffset = nextOffset;
      if (this.decodedStatus === 'playing') this.playDecodedAudio(nextOffset);
      this.publish({
        duration,
        progress: nextOffset,
        status: this.decodedStatus === 'playing' ? 'playing' : 'paused',
      });
      return;
    }

    const audio = this.audio;
    if (!audio?.src) {
      this.publish({ progress: targetTime });
      return;
    }

    const maxTime =
      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : targetTime;
    audio.currentTime = clamp(targetTime, 0, maxTime);
    this.publishAudioSnapshot({ progress: audio.currentTime });
  }

  setVolume(volume: number): void {
    const normalizedVolume = clamp(volume, 0, 1);
    if (this.audio) this.audio.volume = normalizedVolume;
    this.applyDecodedGain(normalizedVolume, this.status.mute ?? false);
    this.publish({ volume: toPlayerStatusVolume(normalizedVolume) });
  }

  setMute(isMute: boolean): void {
    if (this.audio) this.audio.muted = isMute;
    this.applyDecodedGain(this.audio?.volume ?? this.status.volume ?? 1, isMute);
    this.publish({ mute: isMute });
  }

  setPlaybackRate(rate: number): void {
    const normalizedRate = clamp(rate, 0.5, 2);
    this.basePlaybackRate = normalizedRate;
    this.applyPlaybackRate();
    this.publish({ playbackRate: normalizedRate });
  }

  getAnalyser(): AnalyserNode | null {
    return this.ensureAudioGraph();
  }

  setSoundEffectConfig(config: PlayerSoundEffectConfig): void {
    this.soundEffectConfig = config;
    this.applySoundEffectConfig();
  }

  onStatus(listener: PlayerStatusListener): () => void {
    this.listeners.add(listener);
    if (Object.keys(this.status).length) listener({ ...this.status });

    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;
    for (const dispose of this.disposers.splice(0)) dispose();
    this.listeners.clear();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    this.clearDecodedAudio();
    this.clearDecodedFile();
    this.clearObjectUrl();
    this.audioContext?.close();
    this.audioContext = null;
    this.biquadFilters = [];
    this.mediaSource = null;
    this.panner = null;
    this.analyser = null;
  }

  private bindAudioEvents(): void {
    this.addAudioListener('playing', () => {
      this.publishAudioSnapshot({ status: 'playing' });
    });
    this.addAudioListener('pause', () => {
      this.publishAudioSnapshot({ status: this.audio?.ended ? 'stoped' : 'paused' });
    });
    this.addAudioListener('ended', () => {
      this.publishAudioSnapshot({ isEnded: true, status: 'stoped' });
    });
    this.addAudioListener('error', () => {
      this.publishAudioSnapshot({ status: 'error' });
    });
    this.addAudioListener('loadedmetadata', () => {
      this.publishAudioSnapshot();
    });
    this.addAudioListener('durationchange', () => {
      this.publishAudioSnapshot();
    });
    this.addAudioListener('timeupdate', () => {
      this.publishAudioSnapshot();
    });
    this.addAudioListener('volumechange', () => {
      this.publishAudioSnapshot();
    });
    this.addAudioListener('ratechange', () => {
      this.publishAudioSnapshot();
    });
  }

  private addAudioListener<EventName extends keyof HTMLMediaElementEventMap>(
    eventName: EventName,
    handler: (event: HTMLMediaElementEventMap[EventName]) => void,
  ): void {
    const audio = this.audio;
    if (!audio) return;

    audio.addEventListener(eventName, handler);
    this.disposers.push(() => {
      audio.removeEventListener(eventName, handler);
    });
  }

  private setAudioSource(source: string): void {
    const audio = this.audio;
    if (!audio) return;

    this.clearDecodedAudio();
    if (audio.getAttribute('src') === source) return;
    audio.src = source;
    audio.load();
  }

  private clearDecodedFile(exceptPath?: string): void {
    const filePath = this.currentDecodedFilePath;
    if (!filePath || filePath === exceptPath) return;

    this.currentDecodedFilePath = null;
    removeFile(filePath);
  }

  private clearObjectUrl(exceptUrl?: string): void {
    const objectUrl = this.currentObjectUrl;
    if (!objectUrl || objectUrl === exceptUrl) return;

    this.currentObjectUrl = null;
    globalThis.URL?.revokeObjectURL(objectUrl);
  }

  private clearDecodedAudio(): void {
    this.stopDecodedProgressTimer();
    this.stopDecodedSource();
    this.decodedGain?.disconnect();
    this.decodedGain = null;
    this.decodedAudioBuffer = null;
    this.decodedPlayStartedAt = 0;
    this.decodedStartOffset = 0;
    this.decodedStatus = 'idle';
  }

  private stopDecodedSource(): void {
    const source = this.decodedAudioSource;
    this.decodedAudioSource = null;
    if (!source) return;

    source.onended = null;
    try {
      source.stop();
    } catch {}
    source.disconnect();
  }

  private stopDecodedProgressTimer(): void {
    if (this.decodedProgressTimer == null) return;
    globalThis.window.clearInterval(this.decodedProgressTimer);
    this.decodedProgressTimer = null;
  }

  private getAudioGraphInput(): AudioNode | null {
    if (!this.audioContext || !this.analyser) return null;
    return this.biquadFilters[0] ?? this.panner ?? this.analyser;
  }

  private ensureBaseAudioGraph(): AudioNode | null {
    if (!this.audioContext) {
      const AudioContextConstructor = globalThis.window?.AudioContext;
      if (!AudioContextConstructor) return null;
      this.audioContext = new AudioContextConstructor();
    }
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.biquadFilters = eqFrequencies.map((frequency) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });
      this.panner =
        typeof this.audioContext.createStereoPanner === 'function'
          ? this.audioContext.createStereoPanner()
          : null;

      let previousNode: AudioNode | null = null;
      for (const filter of this.biquadFilters) {
        if (previousNode) previousNode.connect(filter);
        previousNode = filter;
      }
      if (this.panner) {
        if (previousNode) previousNode.connect(this.panner);
        previousNode = this.panner;
      }
      if (previousNode) previousNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.applySoundEffectConfig();
    }

    return this.getAudioGraphInput();
  }

  private createAudioBuffer(decodedAudio: DecodedAudioData): AudioBuffer {
    const audioContext = this.audioContext;
    if (!audioContext) throw new Error('AudioContext is unavailable.');

    const channelData = decodedAudio.channelData.filter((channel) => channel.length);
    const channelCount = channelData.length;
    if (!channelCount) throw new Error('本地音频解码结果为空。');
    const sampleCount = Math.max(...channelData.map((channel) => channel.length));
    const buffer = audioContext.createBuffer(channelCount, sampleCount, decodedAudio.sampleRate);
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      buffer.copyToChannel(new Float32Array(channelData[channelIndex]), channelIndex);
    }
    return buffer;
  }

  private playDecodedAudio(offset = this.decodedStartOffset): void {
    const audioBuffer = this.decodedAudioBuffer;
    const graphInput = this.ensureBaseAudioGraph();
    if (!audioBuffer || !this.audioContext || !graphInput) return;

    this.stopDecodedSource();
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = clamp(
      this.basePlaybackRate * this.soundEffectConfig.pitchPlaybackRate,
      0.25,
      4,
    );
    if (!this.decodedGain) {
      this.decodedGain = this.audioContext.createGain();
      this.decodedGain.connect(graphInput);
    }
    this.applyDecodedGain(this.audio?.volume ?? 1, this.audio?.muted ?? false);
    source.connect(this.decodedGain);
    this.decodedStartOffset = clamp(offset, 0, audioBuffer.duration);
    this.decodedPlayStartedAt = this.audioContext.currentTime - this.decodedStartOffset;
    this.decodedStatus = 'playing';
    this.decodedAudioSource = source;
    source.onended = () => {
      if (this.decodedStatus !== 'playing') return;
      this.decodedStartOffset = audioBuffer.duration;
      this.decodedStatus = 'idle';
      this.stopDecodedProgressTimer();
      this.publish({
        duration: audioBuffer.duration,
        isEnded: true,
        progress: audioBuffer.duration,
        status: 'stoped',
      });
    };
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    source.start(0, this.decodedStartOffset);
    this.startDecodedProgressTimer();
    this.publish({
      duration: audioBuffer.duration,
      progress: this.decodedStartOffset,
      status: 'playing',
    });
  }

  private pauseDecodedAudio(): void {
    if (!this.audioContext || !this.decodedAudioBuffer) return;
    this.decodedStartOffset = clamp(
      this.audioContext.currentTime - this.decodedPlayStartedAt,
      0,
      this.decodedAudioBuffer.duration,
    );
    this.decodedStatus = 'paused';
    this.stopDecodedSource();
    this.stopDecodedProgressTimer();
    this.publish({
      duration: this.decodedAudioBuffer.duration,
      progress: this.decodedStartOffset,
      status: 'paused',
    });
  }

  private startDecodedProgressTimer(): void {
    this.stopDecodedProgressTimer();
    this.decodedProgressTimer = globalThis.window.setInterval(() => {
      if (!this.audioContext || !this.decodedAudioBuffer || this.decodedStatus !== 'playing')
        return;
      const progress = clamp(
        this.audioContext.currentTime - this.decodedPlayStartedAt,
        0,
        this.decodedAudioBuffer.duration,
      );
      this.publish({
        duration: this.decodedAudioBuffer.duration,
        progress,
        status: 'playing',
      });
    }, 250);
  }

  private applyDecodedGain(volume: number, isMute: boolean): void {
    if (!this.decodedGain) return;
    const normalizedVolume = typeof volume === 'number' && volume > 1 ? volume / 100 : volume;
    this.decodedGain.gain.value = isMute ? 0 : clamp(normalizedVolume, 0, 1);
  }

  private async loadAndPlayMusic(
    musicInfo: PlayerRuntimeMusicInfo,
    requestId: number,
    options: PlayerRuntimePlayOptions = {},
  ): Promise<void> {
    let resolved: Awaited<ReturnType<typeof resolvePlayableMusicUrl>> = null;
    try {
      resolved = await resolvePlayableMusicUrl(musicInfo, options);
    } catch (err) {
      if (this.isDisposed || requestId !== this.loadRequestId) return;
      console.error(err);

      this.publish({
        errorText: err instanceof Error ? err.message : String(err),
        status: 'error',
      });
      return;
    }

    if (this.isDisposed || requestId !== this.loadRequestId) {
      if (resolved?.decodedFilePath) removeFile(resolved.decodedFilePath);
      if (resolved?.objectUrl) globalThis.URL?.revokeObjectURL(resolved.objectUrl);
      return;
    }

    if (!resolved) {
      this.clearDecodedFile();
      this.clearObjectUrl();
      this.publish({ status: 'stoped' });
      return;
    }

    this.currentMusic = resolved.musicInfo;
    this.publishMusicInfo(resolved.musicInfo);
    this.publish({ actualQuality: resolved.quality, errorText: '' });
    this.clearDecodedFile(resolved.decodedFilePath);
    this.clearObjectUrl(resolved.objectUrl);
    this.currentDecodedFilePath = resolved.decodedFilePath ?? null;
    this.currentObjectUrl = resolved.objectUrl ?? null;
    if (resolved.decodedAudio) {
      try {
        this.audio?.pause();
        this.audio?.removeAttribute('src');
        this.clearDecodedAudio();
        if (!this.ensureBaseAudioGraph()) {
          throw new Error('当前环境无法初始化 WebAudio 播放引擎。');
        }
        this.decodedAudioBuffer = this.createAudioBuffer(resolved.decodedAudio);
        this.decodedStartOffset = 0;
        this.publish({ errorText: '' });
        this.playDecodedAudio(0);
      } catch (err) {
        console.error(err);
        this.publish({
          errorText: err instanceof Error ? err.message : String(err),
          status: 'error',
        });
      }
      return;
    }
    this.setAudioSource(resolved.url);
    this.playAudio();
  }

  private playAudio(): void {
    if (this.decodedAudioBuffer) {
      this.playDecodedAudio(this.decodedStartOffset);
      return;
    }

    const audio = this.audio;
    if (!audio?.src) {
      this.publish({ status: 'stoped' });
      return;
    }

    this.ensureAudioGraph();
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    audio
      .play()
      .then(() => {
        this.publishAudioSnapshot({
          errorText: '',
          status: 'playing',
        });
      })
      .catch((err) => {
        this.publishAudioSnapshot({
          errorText: err instanceof Error ? err.message : String(err),
          status: 'error',
        });
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

  private publishAudioSnapshot(status: PlayerRuntimeStatus = {}): void {
    const audio = this.audio;
    if (!audio) {
      this.publish(status);
      return;
    }

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const progress = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    this.publish({
      duration,
      mute: audio.muted,
      playbackRate: audio.playbackRate,
      progress,
      volume: toPlayerStatusVolume(audio.volume),
      ...status,
    });
  }

  private publish(status: PlayerRuntimeStatus): void {
    if (this.isDisposed) return;

    this.status = {
      ...this.status,
      ...status,
    };

    for (const listener of this.listeners) listener({ ...status });
  }

  private ensureAudioGraph(): AnalyserNode | null {
    const audio = this.audio;
    if (!audio) return null;
    const graphInput = this.ensureBaseAudioGraph();
    if (!this.audioContext || !this.analyser || !graphInput) return null;
    if (!this.mediaSource) {
      this.mediaSource = this.audioContext.createMediaElementSource(audio);
      this.mediaSource.connect(graphInput);
    }
    return this.analyser;
  }

  private applyPlaybackRate(): void {
    const rate = clamp(this.basePlaybackRate * this.soundEffectConfig.pitchPlaybackRate, 0.25, 4);
    if (!this.audio) return;
    this.audio.defaultPlaybackRate = rate;
    this.audio.playbackRate = rate;
  }

  private applySoundEffectConfig(): void {
    for (const [index, frequency] of eqFrequencies.entries()) {
      const filter = this.biquadFilters[index];
      if (!filter) continue;
      filter.gain.value = clamp(this.soundEffectConfig.eqGains[frequency], -20, 20);
    }

    if (this.panner) {
      this.panner.pan.value = this.soundEffectConfig.pannerEnabled
        ? clamp((this.soundEffectConfig.pannerSoundR - 5) / 5, -1, 1)
        : 0;
    }

    this.applyPlaybackRate();
  }
}

export const createHtmlAudioPlayerRuntimeBackend = (): PlayerRuntimeBridge =>
  new HtmlAudioPlayerRuntimeBackend();
