import { ipcChannels, type IpcPlayerActionClick } from '@shared/ipc/contracts'
import { ipcClient } from './ipc/client'
import { isElectronRenderer } from './appService'
import { createHtmlAudioPlayerRuntimeBackend } from './playerRuntime/htmlAudioRuntime'
import type {
  PlayerRuntimeBridge,
  PlayerRuntimeMusicInfo,
  PlayerRuntimePlayOptions,
  PlayerRuntimeStatus,
  PlayerStatusListener,
} from './playerRuntime/types'

export type {
  PlayerRuntimeBridge,
  PlayerRuntimeMusicInfo,
  PlayerRuntimePlayOptions,
  PlayerRuntimeStatus,
  PlayerSoundEffectConfig,
  PlayerStatusListener,
} from './playerRuntime/types'

export const playMusic = (musicInfo?: LX.Music.MusicInfo): void => {
  if (!isElectronRenderer()) return
  if (musicInfo) ipcClient.send(ipcChannels.player.invokePlayMusic, musicInfo)
  else ipcClient.send(ipcChannels.player.invokePlayMusic)
}

export const playNext = (): void => {
  if (!isElectronRenderer()) return
  ipcClient.send(ipcChannels.player.invokePlayNext)
}

export const playPrev = (): void => {
  if (!isElectronRenderer()) return
  ipcClient.send(ipcChannels.player.invokePlayPrev)
}

export const togglePlay = (): void => {
  if (!isElectronRenderer()) return
  ipcClient.send(ipcChannels.player.invokeTogglePlay)
}

export const sendPlayerStatus = (status: Partial<LX.Player.Status>): void => {
  if (!isElectronRenderer()) return
  ipcClient.send(ipcChannels.winMain.playerStatus, status)
}

class IpcPlayerRuntimeBridge implements PlayerRuntimeBridge {
  private readonly listeners = new Set<PlayerStatusListener>()
  private readonly disposers: Array<() => void> = []
  private status: PlayerRuntimeStatus = {}
  private isDisposed = false

  constructor(private readonly backend: PlayerRuntimeBridge = createHtmlAudioPlayerRuntimeBackend()) {
    this.disposers.push(
      backend.onStatus(status => {
        this.publish(status)
      }),
    )

    if (!isElectronRenderer()) return

    this.disposers.push(
      ipcClient.on(ipcChannels.winMain.playerActionOnButtonClick, action => {
        this.handlePlayerAction(action)
      }),
    )
  }

  playMusic(musicInfo?: PlayerRuntimeMusicInfo, options?: PlayerRuntimePlayOptions): void {
    if (!musicInfo) playMusic()
    else if (!('progress' in musicInfo)) playMusic(musicInfo)
    this.backend.playMusic(musicInfo, options)
  }

  playNext(): void {
    playNext()
    this.backend.playNext()
  }

  playPrev(): void {
    playPrev()
    this.backend.playPrev()
  }

  togglePlay(): void {
    togglePlay()
    this.backend.togglePlay()
  }

  seek(seconds: number): void {
    this.backend.seek(seconds)
  }

  setVolume(volume: number): void {
    this.backend.setVolume(volume)
  }

  setMute(isMute: boolean): void {
    this.backend.setMute(isMute)
  }

  setPlaybackRate(rate: number): void {
    this.backend.setPlaybackRate(rate)
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
    this.backend.dispose()
    this.listeners.clear()
  }

  private publish(status: PlayerRuntimeStatus): void {
    if (this.isDisposed) return

    this.status = {
      ...this.status,
      ...status,
    }
    sendPlayerStatus(status)
    for (const listener of this.listeners) listener({ ...status })
  }

  private handlePlayerAction({ action, data }: IpcPlayerActionClick): void {
    switch (action) {
      case 'play':
        this.playMusic()
        break
      case 'pause':
        if (this.status.status === 'playing') this.backend.togglePlay()
        else this.publish({ status: 'paused' })
        break
      case 'prev':
        this.playPrev()
        break
      case 'next':
        this.playNext()
        break
      case 'seek':
        if (typeof data === 'number') this.seek(data)
        break
      case 'volume':
        if (typeof data === 'number') this.setVolume(data)
        break
      case 'mute':
        if (typeof data === 'boolean') this.setMute(data)
        break
      case 'collect':
        this.publish({ collect: true })
        break
      case 'unCollect':
        this.publish({ collect: false })
        break
    }
  }
}

export const playerRuntimeBridge: PlayerRuntimeBridge = new IpcPlayerRuntimeBridge()

export const playerService = {
  playerRuntimeBridge,
  playMusic,
  playNext,
  playPrev,
  sendPlayerStatus,
  togglePlay,
}
