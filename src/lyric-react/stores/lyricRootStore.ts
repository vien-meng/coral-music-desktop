import type { IpcRendererEvent } from 'electron'
import { makeAutoObservable, observable } from 'mobx'
import type { CSSProperties } from 'react'
import type { CoralThemeMode } from '@shared/theme/antdTheme'
import { applyLyricColors, applyLyricLanguage, applyLyricTheme } from '../services/lyricEnvironment'
import { lyricWindowService } from '../services/lyricWindowService'
import { LyricTimelineService, type LyricTimelineLine } from '../services/lyricTimeline'

type MainWindowMessagePort = IpcRendererEvent['ports'][number]

interface LyricMusicInfo {
  id: string | null
  name: string
  singer: string
  album: string | null
}

interface LyricPayload {
  lyric: string
  tlyric: string | null
  rlyric: string | null
  lxlyric: string | null
}

interface LyricCssProperties extends CSSProperties {
  '--line-extended-gap': string
  '--line-gap': string
  '--lyric-opacity': string
  '--lyric-played-color': string
  '--lyric-shadow-color': string
  '--lyric-unplay-color': string
}

const defaultConfig: LX.DesktopLyric.Config = {
  'desktopLyric.enable': false,
  'desktopLyric.isLock': false,
  'desktopLyric.isAlwaysOnTop': false,
  'desktopLyric.isAlwaysOnTopLoop': false,
  'desktopLyric.isShowTaskbar': true,
  'desktopLyric.pauseHide': false,
  'desktopLyric.audioVisualization': false,
  'desktopLyric.width': 450,
  'desktopLyric.height': 300,
  'desktopLyric.x': null,
  'desktopLyric.y': null,
  'desktopLyric.isLockScreen': true,
  'desktopLyric.isDelayScroll': true,
  'desktopLyric.scrollAlign': 'center',
  'desktopLyric.isHoverHide': false,
  'desktopLyric.direction': 'horizontal',
  'desktopLyric.style.align': 'center',
  'desktopLyric.style.font': '',
  'desktopLyric.style.fontSize': 20,
  'desktopLyric.style.lineGap': 15,
  'desktopLyric.style.lyricUnplayColor': 'rgba(255, 255, 255, 1)',
  'desktopLyric.style.lyricPlayedColor': 'rgba(7, 197, 86, 1)',
  'desktopLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.14)',
  'desktopLyric.style.opacity': 95,
  'desktopLyric.style.ellipsis': false,
  'desktopLyric.style.isFontWeightFont': false,
  'desktopLyric.style.isFontWeightLine': false,
  'desktopLyric.style.isFontWeightExtended': false,
  'desktopLyric.style.isZoomActiveLrc': true,
  'common.langId': 'zh-cn',
  'player.isShowLyricTranslation': false,
  'player.isShowLyricRoma': false,
  'player.isSwapLyricTranslationAndRoma': false,
  'player.isPlayLxlrc': false,
  'player.playbackRate': 1,
}

const defaultMusicInfo: LyricMusicInfo = {
  id: null,
  name: '^',
  singer: '^',
  album: null,
}

const defaultLyrics: LyricPayload = {
  lyric: '',
  tlyric: null,
  rlyric: null,
  lxlyric: null,
}

const clampLineIndex = (line: number, lines: string[]): number => {
  if (!lines.length) return 0
  if (line < 0) return 0
  if (line >= lines.length) return lines.length - 1
  return line
}

const timelineLyricConfigKeys: Array<keyof LX.DesktopLyric.Config> = [
  'player.isShowLyricTranslation',
  'player.isShowLyricRoma',
  'player.isSwapLyricTranslationAndRoma',
  'player.isPlayLxlrc',
]

const lyricColorConfigKeys: Array<keyof LX.DesktopLyric.Config> = [
  'desktopLyric.style.lyricPlayedColor',
  'desktopLyric.style.lyricShadowColor',
  'desktopLyric.style.lyricUnplayColor',
]

export class LyricRootStore {
  analyserData: Uint8Array | null = null
  config: LX.DesktopLyric.Config = { ...defaultConfig }
  hydrateError: string | null = null
  isConnectedToMainWindow = false
  isHydrated = false
  isHydrating = false
  isMouseInWindow = false
  isPauseHidden = false
  isPlay = false
  lineIndex = 0
  lines: string[] = []
  lyrics: LyricPayload = { ...defaultLyrics }
  musicInfo: LyricMusicInfo = { ...defaultMusicInfo }
  offset = 0
  tempOffset = 0
  themeMode: CoralThemeMode = 'dark'
  themeSetting: LX.ThemeSetting | null = null
  timelineLines: LyricTimelineLine[] = []

  private readonly disposers: Array<() => void> = []
  private mainWindowPort: MainWindowMessagePort | null = null
  private pauseHideTimer: ReturnType<typeof setTimeout> | null = null
  private readonly timeline: LyricTimelineService

  constructor() {
    this.timeline = new LyricTimelineService({
      onPlay: (line, text) => {
        this.handleTimelinePlay(line, text)
      },
      onSetLyric: (lines, offset) => {
        this.handleTimelineSetLyric(lines, offset)
      },
      onUpdateLyric: lines => {
        this.handleTimelineUpdateLyric(lines)
      },
    })
    this.timeline.init(this.config)

    makeAutoObservable<this, 'disposers' | 'mainWindowPort' | 'pauseHideTimer' | 'timeline'>(
      this,
      {
        disposers: false,
        mainWindowPort: false,
        pauseHideTimer: false,
        analyserData: observable.ref,
        timeline: false,
        timelineLines: observable.ref,
      },
      { autoBind: true },
    )
  }

  get isLocked(): boolean {
    return this.config['desktopLyric.isLock']
  }

  get direction(): LX.DesktopLyric.Config['desktopLyric.direction'] {
    return this.config['desktopLyric.direction']
  }

  get shouldHide(): boolean {
    return this.isPauseHidden || (this.config['desktopLyric.isHoverHide'] && this.isMouseInWindow)
  }

  get isAudioVisualizationActive(): boolean {
    return this.config['desktopLyric.audioVisualization'] && this.isPlay
  }

  get currentLine(): string {
    const currentLine = this.lines[this.lineIndex]
    if (currentLine) return currentLine
    if (this.musicInfo.name && this.musicInfo.name !== '^') return this.musicInfo.name
    return '珊瑚音乐桌面歌词迁移入口'
  }

  get nextLine(): string {
    const nextLine = this.lines[this.lineIndex + 1]
    if (nextLine) return nextLine
    if (this.musicInfo.singer && this.musicInfo.singer !== '^') return this.musicInfo.singer
    return '等待主窗口歌词数据'
  }

  get lyricStyle(): CSSProperties {
    const style: LyricCssProperties = {
      '--lyric-unplay-color': this.config['desktopLyric.style.lyricUnplayColor'],
      '--lyric-played-color': this.config['desktopLyric.style.lyricPlayedColor'],
      '--lyric-shadow-color': this.config['desktopLyric.style.lyricShadowColor'],
      '--line-gap': `${this.config['desktopLyric.style.lineGap']}px`,
      '--line-extended-gap': `${Math.max(this.config['desktopLyric.style.lineGap'] / 3, 1).toFixed(2)}px`,
      '--lyric-opacity': String(this.config['desktopLyric.style.opacity'] / 100),
      fontFamily: this.config['desktopLyric.style.font'] || undefined,
      fontSize: `${this.config['desktopLyric.style.fontSize']}px`,
      textAlign: this.config['desktopLyric.style.align'],
    }

    return style
  }

  async initialize(): Promise<void> {
    if (this.isHydrating || this.isHydrated) return

    this.isHydrating = true
    this.hydrateError = null

    try {
      if (!lyricWindowService.isElectronLyricRenderer()) {
        this.isHydrated = true
        return
      }

      const config = await lyricWindowService.getConfig()
      if (config) this.mergeConfig(config)

      this.startRealtimeSync()
      this.requestMainWindowChannel()
      this.isHydrated = true
    } catch (error) {
      this.hydrateError = error instanceof Error ? error.message : String(error)
    } finally {
      this.isHydrating = false
    }
  }

  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose()
    this.clearPauseHideTimer()
    this.mainWindowPort = null
    this.isConnectedToMainWindow = false
  }

  async toggleLock(): Promise<void> {
    await this.updateConfig({
      'desktopLyric.isLock': !this.config['desktopLyric.isLock'],
    })
  }

  async setDirection(direction: LX.DesktopLyric.Config['desktopLyric.direction']): Promise<void> {
    await this.updateConfig({
      'desktopLyric.direction': direction,
    })
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await this.updateConfig({
      'desktopLyric.enable': enabled,
    })
  }

  async toggleAlwaysOnTop(): Promise<void> {
    await this.updateConfig({
      'desktopLyric.isAlwaysOnTop': !this.config['desktopLyric.isAlwaysOnTop'],
    })
  }

  async toggleActiveLyricZoom(): Promise<void> {
    await this.updateConfig({
      'desktopLyric.style.isZoomActiveLrc': !this.config['desktopLyric.style.isZoomActiveLrc'],
    })
  }

  async changeFontSize(step: number): Promise<void> {
    const fontSize = Math.min(Math.max(this.config['desktopLyric.style.fontSize'] + step, 10), 80)
    if (fontSize === this.config['desktopLyric.style.fontSize']) return

    await this.updateConfig({
      'desktopLyric.style.fontSize': fontSize,
    })
  }

  async changeOpacity(step: number): Promise<void> {
    const opacity = Math.min(Math.max(this.config['desktopLyric.style.opacity'] + step, 6), 100)
    if (opacity === this.config['desktopLyric.style.opacity']) return

    await this.updateConfig({
      'desktopLyric.style.opacity': opacity,
    })
  }

  async updateConfig(config: Partial<LX.DesktopLyric.Config>): Promise<void> {
    this.mergeConfig(config)
    await lyricWindowService.updateConfig(config)
  }

  requestMainWindowChannel(): void {
    lyricWindowService.requestMainWindowChannel()
  }

  sendDesktopLyricInfo(info: LX.DesktopLyric.WinMainActions): void {
    if (!this.mainWindowPort) return
    this.mainWindowPort.postMessage({ action: info })
  }

  getInfo(): void {
    this.sendDesktopLyricInfo('get_info')
  }

  getStatus(): void {
    this.sendDesktopLyricInfo('get_status')
  }

  getAnalyserDataArray(): void {
    this.sendDesktopLyricInfo('get_analyser_data_array')
  }

  requestAnalyserData(): void {
    if (!this.isAudioVisualizationActive) return
    this.getAnalyserDataArray()
  }

  setMouseInWindow(isEnter: boolean): void {
    this.isMouseInWindow = isEnter
    lyricWindowService.sendMouseEnterLeave(isEnter)
  }

  private startRealtimeSync(): void {
    if (this.disposers.length) return

    this.disposers.push(
      lyricWindowService.onConfigChanged(config => {
        this.mergeConfig(config)
      }),
      lyricWindowService.onThemeChange(setting => {
        this.applyThemeSetting(setting)
      }),
      lyricWindowService.onMainWindowInited(() => {
        this.requestMainWindowChannel()
      }),
      lyricWindowService.onMouseEnterLeave(isEnter => {
        this.isMouseInWindow = isEnter
      }),
      lyricWindowService.onProvideMainWindowChannel(event => {
        this.bindMainWindowPort(event)
      }),
    )
  }

  private bindMainWindowPort(event: IpcRendererEvent): void {
    const [port] = event.ports
    if (!port) return

    this.mainWindowPort = port
    this.isConnectedToMainWindow = true

    port.onmessage = ({ data }) => {
      this.handleDesktopLyricMessage(data as LX.DesktopLyric.LyricActions)
    }
    port.onmessageerror = () => {
      this.isConnectedToMainWindow = false
    }

    this.getInfo()
  }

  private handleDesktopLyricMessage(event: LX.DesktopLyric.LyricActions): void {
    switch (event.action) {
      case 'set_info':
        this.musicInfo = {
          id: event.data.id,
          singer: event.data.singer,
          name: event.data.name,
          album: event.data.album,
        }
        this.setLyrics({
          lyric: event.data.lrc ?? '',
          tlyric: event.data.tlrc,
          rlyric: event.data.rlrc,
          lxlyric: event.data.lxlrc,
        })
        this.setPlaybackStatus(event.data.isPlay, event.data.line, event.data.played_time)
        if (event.data.isPlay) this.getStatus()
        break
      case 'set_lyric':
        this.setLyrics({
          lyric: event.data.lrc ?? '',
          tlyric: event.data.tlrc,
          rlyric: event.data.rlrc,
          lxlyric: event.data.lxlrc,
        })
        break
      case 'set_status':
        this.setPlaybackStatus(event.data.isPlay, event.data.line, event.data.played_time)
        break
      case 'set_offset':
        this.offset = event.data
        this.tempOffset = event.data
        this.timeline.setLyricOffset(event.data)
        break
      case 'set_playbackRate':
        this.mergeConfig({
          'player.playbackRate': event.data,
        })
        this.timeline.setPlaybackRate(event.data)
        break
      case 'set_play':
        this.setPlaybackStatus(true, this.lineIndex, event.data)
        break
      case 'set_pause':
        this.setPlaybackStatus(false, this.lineIndex)
        break
      case 'set_stop':
        this.isPlay = false
        this.lineIndex = 0
        this.lines = []
        this.timelineLines = []
        this.analyserData = null
        this.timeline.stop()
        this.syncPauseHideState()
        break
      case 'send_analyser_data_array':
        this.analyserData = event.data
        break
    }
  }

  private setLyrics(lyrics: LyricPayload): void {
    this.lyrics = lyrics
    this.refreshTimelineLyric()
  }

  private setPlaybackStatus(isPlay: boolean, line: number, playedTime?: number): void {
    this.isPlay = isPlay
    this.lineIndex = clampLineIndex(line, this.lines)

    if (isPlay) this.timeline.play(playedTime ?? 0)
    else {
      this.analyserData = null
      this.timeline.pause()
    }

    this.syncPauseHideState()
  }

  private mergeConfig(config: Partial<LX.DesktopLyric.Config>): void {
    const shouldRefreshLyric = timelineLyricConfigKeys.some(key => key in config)
    const shouldUpdateVertical = 'desktopLyric.direction' in config
    const shouldUpdatePlaybackRate = 'player.playbackRate' in config
    const shouldSyncPauseHide = 'desktopLyric.pauseHide' in config
    const shouldSyncAudioVisualization = 'desktopLyric.audioVisualization' in config
    const shouldSyncLanguage = 'common.langId' in config
    const shouldSyncLyricColors = lyricColorConfigKeys.some(key => key in config)

    this.config = {
      ...this.config,
      ...config,
    }

    if (shouldRefreshLyric) this.refreshTimelineLyric()
    if (shouldUpdateVertical) this.timeline.setVertical(this.config['desktopLyric.direction'] === 'vertical')
    if (shouldUpdatePlaybackRate) {
      this.timeline.setPlaybackRate(this.config['player.playbackRate'])
      if (this.isPlay) {
        window.setTimeout(() => {
          this.getStatus()
        })
      }
    }
    if (shouldSyncPauseHide) this.syncPauseHideState()
    if (shouldSyncAudioVisualization && !this.config['desktopLyric.audioVisualization']) this.analyserData = null
    if (shouldSyncLanguage) applyLyricLanguage(this.config['common.langId'])
    if (shouldSyncLyricColors) applyLyricColors(this.config)
  }

  private syncPauseHideState(): void {
    this.clearPauseHideTimer()

    if (!this.config['desktopLyric.pauseHide']) {
      this.isPauseHidden = false
      return
    }

    if (this.isPlay) {
      this.isPauseHidden = false
      return
    }

    this.pauseHideTimer = setTimeout(() => {
      this.isPauseHidden = true
      this.pauseHideTimer = null
    }, 200)
  }

  private clearPauseHideTimer(): void {
    if (!this.pauseHideTimer) return
    clearTimeout(this.pauseHideTimer)
    this.pauseHideTimer = null
  }

  private applyThemeSetting(setting: LX.ThemeSetting): void {
    this.themeSetting = setting
    this.themeMode = setting.theme.isDark ? 'dark' : 'light'
    applyLyricTheme(setting)
  }

  private refreshTimelineLyric(): void {
    if (!this.musicInfo.id) return
    this.timeline.setLyric(this.lyrics, this.config)
  }

  private handleTimelinePlay(line: number, text: string): void {
    this.lineIndex = clampLineIndex(line, this.lines)
    if (!this.lines.length && text) this.lines = [text]
  }

  private handleTimelineSetLyric(lines: LyricTimelineLine[], offset: number): void {
    this.timelineLines = lines
    this.lines = lines.map(line => line.text)
    this.lineIndex = clampLineIndex(0, this.lines)
    this.offset = offset
    this.tempOffset = 0
  }

  private handleTimelineUpdateLyric(lines: LyricTimelineLine[]): void {
    this.timelineLines = lines
    this.lines = lines.map(line => line.text)
    this.lineIndex = clampLineIndex(this.lineIndex, this.lines)
  }
}

export const lyricRootStore = new LyricRootStore()
