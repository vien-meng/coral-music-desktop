import { reaction } from 'mobx';
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames';
import type { PlayerStore } from '../stores/domains/playerStore';
import type { SettingsStore } from '../stores/domains/settingsStore';

type LyricPort = MessagePort;

type WinMainAction = Coral.DesktopLyric.WinMainActions;

const SEEK_SYNC_THRESHOLD_MS = 1200;

interface SetInfoPayload {
  id: string | null;
  singer: string;
  name: string;
  album: string;
  lrc: string | null;
  tlrc: string | null;
  rlrc: string | null;
  lxlrc: string | null;
  isPlay: boolean;
  line: number;
  played_time: number;
}

interface SetStatusPayload {
  isPlay: boolean;
  line: number;
  played_time: number;
}

interface SetLyricPayload {
  lrc: string | null;
  tlrc: string | null;
  rlrc: string | null;
  lxlrc: string | null;
}

interface Snapshot {
  musicId: string | null;
  singer: string;
  name: string;
  album: string;
  lrc: string | null;
  tlrc: string | null;
  rlrc: string | null;
  lxlrc: string | null;
  isPlay: boolean;
  playedTimeMs: number;
  playbackRate: number;
}

const buildSnapshot = (player: PlayerStore): Snapshot => {
  const musicInfo = player.displayMusicInfo;
  const status = player.status;
  return {
    musicId: musicInfo?.id ?? null,
    singer: musicInfo?.singer ?? status?.singer ?? '',
    name: musicInfo?.name ?? status?.name ?? '',
    album: musicInfo?.meta.albumName ?? status?.albumName ?? '',
    lrc: status?.lyric ?? null,
    tlrc: status?.tlyric ?? null,
    rlrc: status?.rlyric ?? null,
    lxlrc: status?.lxlyric ?? null,
    isPlay: player.isPlaying,
    playedTimeMs: Math.round(player.currentTime * 1000),
    playbackRate: player.playbackRate,
  };
};

const buildSetInfo = (snap: Snapshot): SetInfoPayload => ({
  id: snap.musicId,
  singer: snap.singer,
  name: snap.name,
  album: snap.album,
  lrc: snap.lrc,
  tlrc: snap.tlrc,
  rlrc: snap.rlrc,
  lxlrc: snap.lxlrc,
  isPlay: snap.isPlay,
  line: 0,
  played_time: snap.playedTimeMs,
});

const buildSetStatus = (snap: Snapshot): SetStatusPayload => ({
  isPlay: snap.isPlay,
  line: 0,
  played_time: snap.playedTimeMs,
});

const buildSetLyric = (snap: Snapshot): SetLyricPayload => ({
  lrc: snap.lrc,
  tlrc: snap.tlrc,
  rlrc: snap.rlrc,
  lxlrc: snap.lxlrc,
});

class DesktopLyricService {
  private port: LyricPort | null = null;

  private disposers: Array<() => void> = [];

  private ipcDisposer: (() => void) | null = null;

  start(player: PlayerStore, _settings: SettingsStore): void {
    this.stop();

    const handler = (event: Electron.IpcRendererEvent): void => {
      const [port] = (event as unknown as MessageEvent).ports ?? [];
      if (!port) return;
      this.attachPort(port as unknown as MessagePort, player);
    };
    const { ipcRenderer } = (
      window as unknown as { require: (m: 'electron') => { ipcRenderer: Electron.IpcRenderer } }
    ).require('electron');
    ipcRenderer.on(WIN_MAIN_RENDERER_EVENT_NAME.process_new_desktop_lyric_client, handler);
    this.ipcDisposer = () => {
      ipcRenderer.removeListener(
        WIN_MAIN_RENDERER_EVENT_NAME.process_new_desktop_lyric_client,
        handler,
      );
    };

    this.disposers.push(
      reaction(
        () => player.displayMusicInfo?.id ?? null,
        () => this.pushInfo(player),
      ),
      reaction(
        () => player.status?.lyric ?? null,
        () => this.pushLyric(player),
      ),
      reaction(
        () => player.isPlaying,
        (isPlay) => {
          if (isPlay) this.pushPlay(player);
          else this.pushPause();
        },
      ),
      reaction(
        () => Math.round(player.currentTime * 1000),
        (timeMs, previousTimeMs) => {
          if (
            !player.isPlaying ||
            previousTimeMs == null ||
            Math.abs(timeMs - previousTimeMs) >= SEEK_SYNC_THRESHOLD_MS
          ) {
            this.pushStatus(player);
          }
        },
        { delay: 80 },
      ),
      reaction(
        () => player.playbackRate,
        (rate) => this.postMessage({ action: 'set_playbackRate', data: rate }),
      ),
    );
  }

  stop(): void {
    this.port?.close();
    this.port = null;
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
    this.ipcDisposer?.();
    this.ipcDisposer = null;
  }

  private attachPort(port: LyricPort, player: PlayerStore): void {
    this.port?.close();
    this.port = port;
    port.onmessage = ({ data }: MessageEvent) => {
      const action = (data as { action?: WinMainAction })?.action;
      switch (action) {
        case 'get_info':
          this.pushInfo(player);
          break;
        case 'get_status':
          this.pushStatus(player);
          break;
        case 'get_analyser_data_array':
          break;
        case 'play_prev':
          player.playPrev();
          break;
        case 'toggle_play':
          player.togglePlay();
          break;
        case 'play_next':
          player.playNext();
          break;
      }
    };
    port.onmessageerror = () => {
      this.port = null;
    };
    port.start();
    this.pushInfo(player);
  }

  private pushInfo(player: PlayerStore): void {
    if (!this.port) return;
    this.postMessage({ action: 'set_info', data: buildSetInfo(buildSnapshot(player)) });
  }

  private pushStatus(player: PlayerStore): void {
    if (!this.port) return;
    this.postMessage({ action: 'set_status', data: buildSetStatus(buildSnapshot(player)) });
  }

  private pushLyric(player: PlayerStore): void {
    if (!this.port) return;
    this.postMessage({ action: 'set_lyric', data: buildSetLyric(buildSnapshot(player)) });
  }

  private pushPlay(player: PlayerStore): void {
    if (!this.port) return;
    this.postMessage({ action: 'set_play', data: buildSnapshot(player).playedTimeMs });
  }

  private pushPause(): void {
    if (!this.port) return;
    this.postMessage({ action: 'set_pause' });
  }

  private postMessage(message: unknown): void {
    if (!this.port) return;
    try {
      this.port.postMessage(message);
    } catch {
      this.port = null;
    }
  }
}

export const desktopLyricService = new DesktopLyricService();
