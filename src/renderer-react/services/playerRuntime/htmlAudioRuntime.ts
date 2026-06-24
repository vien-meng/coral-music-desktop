import {
  resolvePlayableMusicUrl,
} from './musicUrlResolver'
import type {
  PlayerEqFrequency,
  PlayerRuntimeBridge,
  PlayerRuntimeMusicInfo,
  PlayerRuntimeStatus,
  PlayerSoundEffectConfig,
  PlayerStatusListener,
} from './types'

const eqFrequencies: PlayerEqFrequency[] = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

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
})

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const toPlayerStatusVolume = (volume: number): number => {
  return Math.round(clamp(volume, 0, 1) * 100)
}

const createAudioElement = (): HTMLAudioElement | null => {
  if (typeof globalThis.window?.Audio === 'undefined') return null

  const audio = new globalThis.window.Audio()
  audio.autoplay = false
  audio.controls = false
  audio.crossOrigin = 'anonymous'
  audio.preload = 'auto'
  return audio
}

export class HtmlAudioPlayerRuntimeBackend implements PlayerRuntimeBridge {
  private readonly audio: HTMLAudioElement | null = createAudioElement()
  private readonly listeners = new Set<PlayerStatusListener>()
  private readonly disposers: Array<() => void> = []
  private analyser: AnalyserNode | null = null
  private audioContext: AudioContext | null = null
  private biquadFilters: BiquadFilterNode[] = []
  private basePlaybackRate = 1
  private mediaSource: MediaElementAudioSourceNode | null = null
  private panner: StereoPannerNode | null = null
  private soundEffectConfig: PlayerSoundEffectConfig = createDefaultSoundEffectConfig()
  private currentMusic: PlayerRuntimeMusicInfo | null = null
  private loadRequestId = 0
  private status: PlayerRuntimeStatus = {}
  private isDisposed = false

  constructor() {
    this.bindAudioEvents()
  }

  playMusic(musicInfo?: PlayerRuntimeMusicInfo): void {
    if (musicInfo) {
      this.currentMusic = musicInfo
      this.publishMusicInfo(musicInfo)
      void this.loadAndPlayMusic(musicInfo, ++this.loadRequestId)
      return
    }

    this.playAudio()
  }

  playNext(): void {
    this.publish({})
  }

  playPrev(): void {
    this.publish({})
  }

  togglePlay(): void {
    const audio = this.audio
    if (!audio?.src) {
      this.playMusic(this.currentMusic ?? undefined)
      return
    }

    if (audio.paused) {
      this.playAudio()
      return
    }

    audio.pause()
    this.publishAudioSnapshot({ status: 'paused' })
  }

  seek(seconds: number): void {
    const targetTime = Math.max(0, seconds)
    const audio = this.audio
    if (!audio?.src) {
      this.publish({ progress: targetTime })
      return
    }

    const maxTime = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : targetTime
    audio.currentTime = clamp(targetTime, 0, maxTime)
    this.publishAudioSnapshot({ progress: audio.currentTime })
  }

  setVolume(volume: number): void {
    const normalizedVolume = clamp(volume, 0, 1)
    if (this.audio) this.audio.volume = normalizedVolume
    this.publish({ volume: toPlayerStatusVolume(normalizedVolume) })
  }

  setMute(isMute: boolean): void {
    if (this.audio) this.audio.muted = isMute
    this.publish({ mute: isMute })
  }

  setPlaybackRate(rate: number): void {
    const normalizedRate = clamp(rate, 0.5, 2)
    this.basePlaybackRate = normalizedRate
    this.applyPlaybackRate()
    this.publish({ playbackRate: normalizedRate })
  }

  getAnalyser(): AnalyserNode | null {
    return this.ensureAudioGraph()
  }

  setSoundEffectConfig(config: PlayerSoundEffectConfig): void {
    this.soundEffectConfig = config
    this.applySoundEffectConfig()
  }

  onStatus(listener: PlayerStatusListener): () => void {
    this.listeners.add(listener)
    if (Object.keys(this.status).length) listener({ ...this.status })

    return () => {
      this.listeners.delete(listener)
    }
  }

  dispose(): void {
    if (this.isDisposed) return

    this.isDisposed = true
    for (const dispose of this.disposers.splice(0)) dispose()
    this.listeners.clear()
    if (this.audio) {
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
    }
    void this.audioContext?.close()
    this.audioContext = null
    this.biquadFilters = []
    this.mediaSource = null
    this.panner = null
    this.analyser = null
  }

  private bindAudioEvents(): void {
    this.addAudioListener('playing', () => {
      this.publishAudioSnapshot({ status: 'playing' })
    })
    this.addAudioListener('pause', () => {
      this.publishAudioSnapshot({ status: this.audio?.ended ? 'stoped' : 'paused' })
    })
    this.addAudioListener('ended', () => {
      this.publishAudioSnapshot({ isEnded: true, status: 'stoped' })
    })
    this.addAudioListener('error', () => {
      this.publishAudioSnapshot({ status: 'error' })
    })
    this.addAudioListener('loadedmetadata', () => {
      this.publishAudioSnapshot()
    })
    this.addAudioListener('durationchange', () => {
      this.publishAudioSnapshot()
    })
    this.addAudioListener('timeupdate', () => {
      this.publishAudioSnapshot()
    })
    this.addAudioListener('volumechange', () => {
      this.publishAudioSnapshot()
    })
    this.addAudioListener('ratechange', () => {
      this.publishAudioSnapshot()
    })
  }

  private addAudioListener<EventName extends keyof HTMLMediaElementEventMap>(
    eventName: EventName,
    handler: (event: HTMLMediaElementEventMap[EventName]) => void,
  ): void {
    const audio = this.audio
    if (!audio) return

    audio.addEventListener(eventName, handler)
    this.disposers.push(() => {
      audio.removeEventListener(eventName, handler)
    })
  }

  private setAudioSource(source: string): void {
    const audio = this.audio
    if (!audio) return

    if (audio.getAttribute('src') === source) return
    audio.src = source
    audio.load()
  }

  private async loadAndPlayMusic(musicInfo: PlayerRuntimeMusicInfo, requestId: number): Promise<void> {
    let resolved: Awaited<ReturnType<typeof resolvePlayableMusicUrl>> = null
    try {
      resolved = await resolvePlayableMusicUrl(musicInfo)
    } catch (err) {
      console.error(err)
      if (this.isDisposed || requestId !== this.loadRequestId) return

      this.publish({ status: 'error' })
      return
    }

    if (this.isDisposed || requestId !== this.loadRequestId) return

    if (!resolved) {
      this.publish({ status: 'stoped' })
      return
    }

    this.currentMusic = resolved.musicInfo
    this.publishMusicInfo(resolved.musicInfo)
    this.setAudioSource(resolved.url)
    this.playAudio()
  }

  private playAudio(): void {
    const audio = this.audio
    if (!audio?.src) {
      this.publish({ status: 'stoped' })
      return
    }

    this.ensureAudioGraph()
    if (this.audioContext?.state === 'suspended') {
      void this.audioContext.resume()
    }

    void audio.play()
      .then(() => {
        this.publishAudioSnapshot({ status: 'playing' })
      })
      .catch(() => {
        this.publishAudioSnapshot({ status: 'error' })
      })
  }

  private publishMusicInfo(musicInfo: PlayerRuntimeMusicInfo): void {
    const displayMusicInfo = 'progress' in musicInfo ? musicInfo.metadata.musicInfo : musicInfo
    this.publish({
      albumName: displayMusicInfo.meta.albumName,
      name: displayMusicInfo.name,
      picUrl: displayMusicInfo.meta.picUrl ?? '',
      singer: displayMusicInfo.singer,
    })
  }

  private publishAudioSnapshot(status: PlayerRuntimeStatus = {}): void {
    const audio = this.audio
    if (!audio) {
      this.publish(status)
      return
    }

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0
    const progress = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
    this.publish({
      duration,
      mute: audio.muted,
      playbackRate: audio.playbackRate,
      progress,
      volume: toPlayerStatusVolume(audio.volume),
      ...status,
    })
  }

  private publish(status: PlayerRuntimeStatus): void {
    if (this.isDisposed) return

    this.status = {
      ...this.status,
      ...status,
    }

    for (const listener of this.listeners) listener({ ...status })
  }

  private ensureAudioGraph(): AnalyserNode | null {
    const audio = this.audio
    if (!audio) return null
    if (this.analyser) return this.analyser

    const AudioContextConstructor = globalThis.window?.AudioContext
    if (!AudioContextConstructor) return null

    this.audioContext = new AudioContextConstructor()
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8
    this.mediaSource = this.audioContext.createMediaElementSource(audio)
    this.biquadFilters = eqFrequencies.map(frequency => {
      const filter = this.audioContext!.createBiquadFilter()
      filter.type = 'peaking'
      filter.frequency.value = frequency
      filter.Q.value = 1
      filter.gain.value = 0
      return filter
    })
    this.panner = typeof this.audioContext.createStereoPanner === 'function'
      ? this.audioContext.createStereoPanner()
      : null

    let previousNode: AudioNode = this.mediaSource
    for (const filter of this.biquadFilters) {
      previousNode.connect(filter)
      previousNode = filter
    }
    if (this.panner) {
      previousNode.connect(this.panner)
      previousNode = this.panner
    }
    previousNode.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
    this.applySoundEffectConfig()
    return this.analyser
  }

  private applyPlaybackRate(): void {
    const rate = clamp(this.basePlaybackRate * this.soundEffectConfig.pitchPlaybackRate, 0.25, 4)
    if (!this.audio) return
    this.audio.defaultPlaybackRate = rate
    this.audio.playbackRate = rate
  }

  private applySoundEffectConfig(): void {
    for (const [index, frequency] of eqFrequencies.entries()) {
      const filter = this.biquadFilters[index]
      if (!filter) continue
      filter.gain.value = clamp(this.soundEffectConfig.eqGains[frequency], -20, 20)
    }

    if (this.panner) {
      this.panner.pan.value = this.soundEffectConfig.pannerEnabled
        ? clamp((this.soundEffectConfig.pannerSoundR - 5) / 5, -1, 1)
        : 0
    }

    this.applyPlaybackRate()
  }
}

export const createHtmlAudioPlayerRuntimeBackend = (): PlayerRuntimeBridge => {
  return new HtmlAudioPlayerRuntimeBackend()
}
