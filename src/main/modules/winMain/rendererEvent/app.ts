// const path = require('path')
import { app } from 'electron';
import { mainHandle, mainOn } from '@common/mainIpc';
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames';
// import { name as defaultName } from '../../../../../package.json'
import {
  minimize,
  maximize,
  closeWindow,
  showWindow,
  setFullScreen,
  sendEvent,
  clearCache,
  getCacheSize,
  toggleDevTools,
  setWindowBounds,
  setWindowResizeable,
  setIgnoreMouseEvents,
  // setThumbnailClip,
  toggleMinimize,
  toggleHide,
  showSelectDialog,
  showDialog,
  showSaveDialog,
} from '@main/modules/winMain';
import { quitApp } from '@main/app';
import { getAllThemes, removeTheme, saveTheme, setPowerSaveBlocker } from '@main/utils';
import { openDirInExplorer } from '@common/utils/electron';
import { probeExternalDecoder } from '../externalDecoderProbe';
import {
  createExternalDecoderStream,
  revokeExternalDecoderStream,
  transcodeExternalDecoder,
} from '../externalDecoderRuntime';
import {
  listExclusiveAudioDevices,
  pauseExclusiveAudioOutput,
  probeExclusiveAudioOutput,
  resumeExclusiveAudioOutput,
  seekExclusiveAudioOutput,
  setExclusiveAudioOutputStatusSender,
  startExclusiveAudioOutput,
  stopExclusiveAudioOutput,
} from '../exclusiveAudioOutputService';
import type {
  ExternalDecoderProbeParams,
  ExternalDecoderProbeResult,
  ExternalDecoderStreamParams,
  ExternalDecoderStreamResult,
  ExternalDecoderTranscodeParams,
  ExternalDecoderTranscodeResult,
  ExclusiveAudioDevice,
  ExclusiveAudioOutputProbeParams,
  ExclusiveAudioOutputProbeResult,
  ExclusiveAudioOutputStartParams,
  ExclusiveAudioOutputStatus,
} from '@shared/playbackCapabilities';
import decodeLocalAudioFile from '../audioDecodeMain';

export default () => {
  // 设置应用名称
  // mainOn(WIN_MAIN_RENDERER_EVENT_NAME.set_app_name, ({ params: name }) => {
  //   if (name == null) {
  //     app.setName(defaultName)
  //   } else {
  //     app.setName(name)
  //   }
  // })
  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.quit, () => {
    quitApp();
  });
  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.min_toggle, () => {
    toggleMinimize();
  });
  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.hide_toggle, () => {
    toggleHide();
  });
  mainHandle(WIN_MAIN_RENDERER_EVENT_NAME.min, async () => {
    minimize();
  });
  mainHandle<undefined, boolean>(WIN_MAIN_RENDERER_EVENT_NAME.max, async () => maximize());
  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.focus, () => {
    showWindow();
  });
  mainOn<boolean>(WIN_MAIN_RENDERER_EVENT_NAME.set_power_save_blocker, ({ params: enabled }) => {
    setPowerSaveBlocker(enabled);
  });
  mainHandle<ExternalDecoderProbeParams, ExternalDecoderProbeResult>(
    WIN_MAIN_RENDERER_EVENT_NAME.external_decoder_probe,
    async ({ params }) => probeExternalDecoder(params),
  );
  mainHandle<ExternalDecoderTranscodeParams, ExternalDecoderTranscodeResult>(
    WIN_MAIN_RENDERER_EVENT_NAME.external_decoder_transcode,
    async ({ params }) => transcodeExternalDecoder(params),
  );
  mainHandle<ExternalDecoderStreamParams, ExternalDecoderStreamResult>(
    WIN_MAIN_RENDERER_EVENT_NAME.external_decoder_create_stream,
    async ({ params }) => createExternalDecoderStream(params),
  );
  mainHandle<string>(
    WIN_MAIN_RENDERER_EVENT_NAME.external_decoder_revoke_stream,
    async ({ params }) => {
      revokeExternalDecoderStream(params);
    },
  );
  setExclusiveAudioOutputStatusSender((status) => {
    sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.audio_output_status, status);
  });
  mainHandle<undefined, ExclusiveAudioDevice[]>(
    WIN_MAIN_RENDERER_EVENT_NAME.audio_output_list_devices,
    async () => listExclusiveAudioDevices(),
  );
  mainHandle<ExclusiveAudioOutputProbeParams, ExclusiveAudioOutputProbeResult>(
    WIN_MAIN_RENDERER_EVENT_NAME.audio_output_probe_exclusive,
    async ({ params }) => probeExclusiveAudioOutput(params),
  );
  mainHandle<ExclusiveAudioOutputStartParams, ExclusiveAudioOutputStatus>(
    WIN_MAIN_RENDERER_EVENT_NAME.audio_output_start,
    async ({ params }) => startExclusiveAudioOutput(params),
  );
  mainHandle<undefined, ExclusiveAudioOutputStatus>(
    WIN_MAIN_RENDERER_EVENT_NAME.audio_output_pause,
    async () => pauseExclusiveAudioOutput(),
  );
  mainHandle<undefined, ExclusiveAudioOutputStatus>(
    WIN_MAIN_RENDERER_EVENT_NAME.audio_output_resume,
    async () => resumeExclusiveAudioOutput(),
  );
  mainHandle<number, ExclusiveAudioOutputStatus>(
    WIN_MAIN_RENDERER_EVENT_NAME.audio_output_seek,
    async ({ params }) => seekExclusiveAudioOutput(params),
  );
  mainHandle<undefined, ExclusiveAudioOutputStatus>(
    WIN_MAIN_RENDERER_EVENT_NAME.audio_output_stop,
    async () => stopExclusiveAudioOutput(),
  );
  mainHandle<boolean | undefined, void>(
    WIN_MAIN_RENDERER_EVENT_NAME.close,
    async ({ params: isForce }) => {
      if (isForce) {
        app.exit(0);
        return;
      }
      closeWindow();
    },
  );
  // 全屏
  mainHandle<boolean, boolean>(
    WIN_MAIN_RENDERER_EVENT_NAME.fullscreen,
    async ({ params: isFullscreen }) => {
      global.coral.event_app.main_window_fullscreen(isFullscreen);
      return setFullScreen(isFullscreen);
    },
  );

  // 选择目录
  mainHandle<Electron.OpenDialogOptions, Electron.OpenDialogReturnValue>(
    WIN_MAIN_RENDERER_EVENT_NAME.show_select_dialog,
    async ({ params: options }) => showSelectDialog(options),
  );
  // 显示弹窗信息
  mainOn<Electron.MessageBoxSyncOptions>(WIN_MAIN_RENDERER_EVENT_NAME.show_dialog, ({ params }) => {
    showDialog(params);
  });
  // 显示保存弹窗
  mainHandle<Electron.SaveDialogOptions, Electron.SaveDialogReturnValue>(
    WIN_MAIN_RENDERER_EVENT_NAME.show_save_dialog,
    async ({ params }) => showSaveDialog(params),
  );
  // 在资源管理器中定位文件
  mainOn<string>(WIN_MAIN_RENDERER_EVENT_NAME.open_dir_in_explorer, async ({ params }) => {
    openDirInExplorer(params);
  });

  mainHandle(WIN_MAIN_RENDERER_EVENT_NAME.clear_cache, async () => {
    await clearCache();
  });

  mainHandle<number>(WIN_MAIN_RENDERER_EVENT_NAME.get_cache_size, async () => getCacheSize());

  mainHandle<string, ArrayBuffer>(
    WIN_MAIN_RENDERER_EVENT_NAME.decode_local_audio,
    async ({ params: filePath }) => decodeLocalAudioFile(filePath),
  );

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.open_dev_tools, () => {
    toggleDevTools();
  });

  mainOn<Partial<Electron.Rectangle>>(
    WIN_MAIN_RENDERER_EVENT_NAME.set_window_size,
    ({ params }) => {
      setWindowBounds(params);
    },
  );

  mainOn<boolean>(WIN_MAIN_RENDERER_EVENT_NAME.set_window_resizeable, ({ params: resizable }) => {
    setWindowResizeable(resizable);
  });

  mainOn<boolean>(WIN_MAIN_RENDERER_EVENT_NAME.set_ignore_mouse_events, ({ params: isIgnored }) => {
    isIgnored ? setIgnoreMouseEvents(isIgnored, { forward: true }) : setIgnoreMouseEvents(false);
  });

  // mainHandle<Electron.Rectangle>(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_set_thumbnail_clip, async({ params }) => {
  //   return setThumbnailClip(params)
  // })

  mainOn<Coral.Player.Status>(WIN_MAIN_RENDERER_EVENT_NAME.player_status, ({ params }) => {
    // setThumbarButtons(params)
    global.coral.event_app.player_status(params);
  });

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.inited, () => {
    global.coral.event_app.main_window_inited();
  });

  mainHandle<{ themes: Coral.Theme[]; userThemes: Coral.Theme[] }>(
    WIN_MAIN_RENDERER_EVENT_NAME.get_themes,
    async () => getAllThemes(),
  );
  mainHandle<Coral.Theme>(WIN_MAIN_RENDERER_EVENT_NAME.save_theme, async ({ params: theme }) => {
    saveTheme(theme);
  });
  mainHandle<string>(WIN_MAIN_RENDERER_EVENT_NAME.remove_theme, async ({ params: id }) => {
    removeTheme(id);
  });
};

export const sendFocus = () => {
  sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.focus);
};

export const sendTaskbarButtonClick = (
  action: Coral.Player.StatusButtonActions,
  data?: unknown,
) => {
  sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.player_action_on_button_click, { action, data });
};
export const sendConfigChange = (setting: Partial<Coral.AppSetting>) => {
  sendEvent(WIN_MAIN_RENDERER_EVENT_NAME.on_config_change, setting);
};
